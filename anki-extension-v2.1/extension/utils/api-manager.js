// api-manager.js - Multi-source API management with intelligent fallback
class APIManager {
  constructor() {
    this.settings = null;
    this.cache = new Map();
  }

  // Initialize with settings
  async init(settings) {
    this.settings = settings || await this.loadSettings();
  }

  // Load settings
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('settings', (result) => {
        resolve(result.settings || {});
      });
    });
  }

  // ==================== MAIN ENRICHMENT FUNCTION ====================
  
  async enrichWord(word, context = {}) {
    const enrichedData = {
      word: word,
      definitions: [],
      audio: [],
      ipa: '',
      partOfSpeech: '',
      etymology: '',
      examples: [],
      synonyms: [],
      antonyms: [],
      collocations: [],
      vietnamese: '',
      images: [],
      sourceQuality: '',
      enrichedAt: Date.now(),
      errors: []
    };

    try {
      // 1. Get definitions (with fallback)
      const defResult = await this.getDefinitions(word);
      enrichedData.definitions = defResult.definitions;
      enrichedData.ipa = defResult.ipa;
      enrichedData.partOfSpeech = defResult.partOfSpeech;
      enrichedData.etymology = defResult.etymology;
      enrichedData.examples = defResult.examples;
      enrichedData.synonyms = defResult.synonyms;
      enrichedData.antonyms = defResult.antonyms;
      enrichedData.sourceQuality = defResult.source;

      // 2. Get audio (with fallback)
      const audioResult = await this.getAudio(word, enrichedData.ipa);
      enrichedData.audio = audioResult.audio;

      // 3. Get Vietnamese translation
      enrichedData.vietnamese = await this.getVietnameseTranslation(word);

      // 4. Extract collocations from context
      if (context.sentence) {
        enrichedData.collocations = this.extractCollocations(word, context.sentence);
      }

      // 5. Get images (optional)
      if (this.settings?.fetchImages) {
        enrichedData.images = await this.getImages(word);
      }

    } catch (error) {
      enrichedData.errors.push({
        type: 'general',
        message: error.message
      });
    }

    return enrichedData;
  }

  // ==================== DICTIONARY SOURCES ====================
  
  async getDefinitions(word) {
    const sources = this.settings?.dictionaryPriority || ['oxford', 'cambridge', 'merriam-webster', 'free'];
    
    for (const source of sources) {
      try {
        console.log(`Trying ${source} dictionary for "${word}"...`);
        
        switch (source) {
          case 'oxford':
            if (this.settings?.oxfordAppId && this.settings?.oxfordAppKey) {
              const result = await this.fetchOxfordDictionary(word);
              if (result) return { ...result, source: 'Oxford (Premium)' };
            }
            break;
            
          case 'cambridge':
            const cambridge = await this.fetchCambridgeDictionary(word);
            if (cambridge) return { ...cambridge, source: 'Cambridge' };
            break;
            
          case 'merriam-webster':
            const merriam = await this.fetchMerriamWebster(word);
            if (merriam) return { ...merriam, source: 'Merriam-Webster' };
            break;
            
          case 'free':
            const free = await this.fetchFreeDictionary(word);
            if (free) return { ...free, source: 'Free Dictionary' };
            break;
        }
      } catch (error) {
        console.error(`${source} failed:`, error);
        continue;
      }
    }
    
    // Fallback to basic definition
    return {
      definitions: ['Definition not found'],
      ipa: '',
      partOfSpeech: 'unknown',
      etymology: '',
      examples: [],
      synonyms: [],
      antonyms: [],
      source: 'None'
    };
  }

  // Oxford Dictionaries API
  async fetchOxfordDictionary(word) {
    const url = `https://od-api.oxforddictionaries.com/api/v2/entries/en-us/${word.toLowerCase()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'app_id': this.settings.oxfordAppId,
          'app_key': this.settings.oxfordAppKey
        }
      });
      
      if (!response.ok) throw new Error(`Oxford API: ${response.status}`);
      
      const data = await response.json();
      const lexicalEntry = data.results[0].lexicalEntries[0];
      const entry = lexicalEntry.entries[0];
      const sense = entry.senses[0];
      
      return {
        definitions: sense.definitions || [],
        ipa: entry.pronunciations?.[0]?.phoneticSpelling || '',
        partOfSpeech: lexicalEntry.lexicalCategory.id,
        etymology: entry.etymologies?.[0] || '',
        examples: sense.examples?.map(e => e.text) || [],
        synonyms: sense.synonyms?.map(s => s.text).slice(0, 5) || [],
        antonyms: sense.antonyms?.map(a => a.text).slice(0, 5) || []
      };
    } catch (error) {
      throw new Error(`Oxford API error: ${error.message}`);
    }
  }

  // Cambridge Dictionary (Web Scraping)
  async fetchCambridgeDictionary(word) {
    const url = `https://dictionary.cambridge.org/dictionary/english/${word.toLowerCase()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Cambridge: ${response.status}`);
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract definition
      const defElement = doc.querySelector('.def.ddef_d');
      const definition = defElement?.textContent.trim() || '';
      
      // Extract IPA (US pronunciation)
      const ipaElement = doc.querySelector('.us .ipa');
      const ipa = ipaElement?.textContent.trim() || '';
      
      // Extract part of speech
      const posElement = doc.querySelector('.pos.dpos');
      const partOfSpeech = posElement?.textContent.trim() || '';
      
      // Extract examples
      const examples = Array.from(doc.querySelectorAll('.examp.dexamp'))
        .map(el => el.textContent.trim())
        .slice(0, 3);
      
      return {
        definitions: definition ? [definition] : [],
        ipa: ipa,
        partOfSpeech: partOfSpeech,
        etymology: '',
        examples: examples,
        synonyms: [],
        antonyms: []
      };
    } catch (error) {
      throw new Error(`Cambridge error: ${error.message}`);
    }
  }

  // Merriam-Webster API
  async fetchMerriamWebster(word) {
    // Note: Requires API key
    const apiKey = this.settings?.merriamWebsterApiKey;
    if (!apiKey) throw new Error('Merriam-Webster API key not configured');
    
    const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Merriam-Webster: ${response.status}`);
      
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('No results');
      
      const entry = data[0];
      if (typeof entry === 'string') throw new Error('Did you mean suggestions only');
      
      return {
        definitions: entry.shortdef || [],
        ipa: entry.hwi?.hw?.replace(/\*/g, '·') || '',
        partOfSpeech: entry.fl || '',
        etymology: entry.et?.[0]?.[1] || '',
        examples: [],
        synonyms: entry.syns?.[0] || [],
        antonyms: entry.ants?.[0] || []
      };
    } catch (error) {
      throw new Error(`Merriam-Webster error: ${error.message}`);
    }
  }

  // Free Dictionary API (Fallback)
  async fetchFreeDictionary(word) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Free API: ${response.status}`);
      
      const data = await response.json();
      const entry = data[0];
      const meaning = entry.meanings[0];
      const definition = meaning.definitions[0];
      
      return {
        definitions: [definition.definition],
        ipa: entry.phonetic || entry.phonetics?.[0]?.text || '',
        partOfSpeech: meaning.partOfSpeech || '',
        etymology: '',
        examples: definition.example ? [definition.example] : [],
        synonyms: definition.synonyms || [],
        antonyms: definition.antonyms || []
      };
    } catch (error) {
      throw new Error(`Free API error: ${error.message}`);
    }
  }

  // ==================== AUDIO SOURCES ====================
  
  async getAudio(word, ipa) {
    const sources = this.settings?.audioPriority || ['forvo', 'oxford', 'cambridge', 'google-tts'];
    const audioFiles = [];
    
    for (const source of sources) {
      try {
        console.log(`Trying ${source} audio for "${word}"...`);
        
        switch (source) {
          case 'forvo':
            if (this.settings?.forvoApiKey) {
              const forvo = await this.fetchForvoAudio(word);
              if (forvo.length > 0) {
                audioFiles.push(...forvo);
                if (!this.settings?.downloadBothAccents) return { audio: audioFiles };
              }
            }
            break;
            
          case 'oxford':
            if (this.settings?.oxfordAppId && this.settings?.oxfordAppKey) {
              const oxford = await this.fetchOxfordAudio(word);
              if (oxford) {
                audioFiles.push(oxford);
                if (!this.settings?.downloadBothAccents) return { audio: audioFiles };
              }
            }
            break;
            
          case 'cambridge':
            const cambridge = await this.fetchCambridgeAudio(word);
            if (cambridge) {
              audioFiles.push(cambridge);
              if (!this.settings?.downloadBothAccents) return { audio: audioFiles };
            }
            break;
            
          case 'google-tts':
            const googleTTS = this.getGoogleTTSUrl(word);
            audioFiles.push({
              url: googleTTS,
              accent: 'us',
              source: 'Google TTS',
              quality: 'synthetic'
            });
            break;
        }
      } catch (error) {
        console.error(`${source} audio failed:`, error);
        continue;
      }
    }
    
    return { audio: audioFiles };
  }

  // Forvo API
  async fetchForvoAudio(word) {
    const url = `https://apifree.forvo.com/key/${this.settings.forvoApiKey}/format/json/action/word-pronunciations/word/${word}/language/en`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Forvo API error');
      
      const data = await response.json();
      const items = data.items || [];
      
      // Filter and sort by ratings
      const audioFiles = items
        .filter(item => this.settings?.preferUsAudio ? item.country === 'United States' : true)
        .sort((a, b) => (b.num_positive_votes || 0) - (a.num_positive_votes || 0))
        .slice(0, 3)
        .map(item => ({
          url: item.pathmp3,
          accent: item.country === 'United States' ? 'us' : 'uk',
          source: 'Forvo',
          quality: 'native',
          username: item.username,
          votes: item.num_positive_votes
        }));
      
      return audioFiles;
    } catch (error) {
      throw new Error(`Forvo error: ${error.message}`);
    }
  }

  // Oxford Audio
  async fetchOxfordAudio(word) {
    const url = `https://od-api.oxforddictionaries.com/api/v2/entries/en-us/${word.toLowerCase()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'app_id': this.settings.oxfordAppId,
          'app_key': this.settings.oxfordAppKey
        }
      });
      
      if (!response.ok) throw new Error('Oxford Audio API error');
      
      const data = await response.json();
      const audioUrl = data.results[0].lexicalEntries[0].entries[0].pronunciations?.[0]?.audioFile;
      
      if (audioUrl) {
        return {
          url: audioUrl,
          accent: 'us',
          source: 'Oxford',
          quality: 'professional'
        };
      }
      
      return null;
    } catch (error) {
      throw new Error(`Oxford audio error: ${error.message}`);
    }
  }

  // Cambridge Audio
  async fetchCambridgeAudio(word) {
    const url = `https://dictionary.cambridge.org/dictionary/english/${word.toLowerCase()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Cambridge error');
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Find US audio
      const audioElement = doc.querySelector('.us source[type="audio/mpeg"]');
      const audioUrl = audioElement?.getAttribute('src');
      
      if (audioUrl) {
        return {
          url: audioUrl.startsWith('http') ? audioUrl : `https://dictionary.cambridge.org${audioUrl}`,
          accent: 'us',
          source: 'Cambridge',
          quality: 'professional'
        };
      }
      
      return null;
    } catch (error) {
      throw new Error(`Cambridge audio error: ${error.message}`);
    }
  }

  // Google TTS (Fallback)
  getGoogleTTSUrl(word) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&client=tw-ob`;
  }

  // ==================== TRANSLATION ====================
  
  async getVietnameseTranslation(text) {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`
      );
      
      if (!response.ok) throw new Error('Translation API error');
      
      const data = await response.json();
      return data.responseData.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  // Extract collocations from sentence
  extractCollocations(word, sentence) {
    const words = sentence.toLowerCase().split(/\s+/);
    const wordIndex = words.indexOf(word.toLowerCase());
    
    if (wordIndex === -1) return [];
    
    const collocations = [];
    
    // Get word before
    if (wordIndex > 0) {
      collocations.push(`${words[wordIndex - 1]} ${word}`);
    }
    
    // Get word after
    if (wordIndex < words.length - 1) {
      collocations.push(`${word} ${words[wordIndex + 1]}`);
    }
    
    // Get 2-word combinations
    if (wordIndex > 1) {
      collocations.push(`${words[wordIndex - 2]} ${words[wordIndex - 1]} ${word}`);
    }
    if (wordIndex < words.length - 2) {
      collocations.push(`${word} ${words[wordIndex + 1]} ${words[wordIndex + 2]}`);
    }
    
    return [...new Set(collocations)]; // Remove duplicates
  }

  // Get images (optional feature)
  async getImages(word) {
    // This could integrate with Google Images API or Unsplash API
    // For now, return empty array
    // Note: Would require additional API keys
    return [];
  }

  // Detect part of speech from context
  detectPOSFromContext(word, sentence) {
    const patterns = {
      verb: /\b(is|are|was|were|been|be|have|has|had|do|does|did|will|would|could|should|may|might|can)\s+\w*ing\b/i,
      noun: /\b(the|a|an|this|that|these|those|my|your|his|her|its|our|their)\s+\w+\b/i,
      adjective: /\b(very|so|too|quite|really|extremely)\s+\w+\b/i,
      adverb: /\w+ly\b/i
    };
    
    // Check word endings
    if (word.endsWith('ly')) return 'adverb';
    if (word.endsWith('ing') || word.endsWith('ed')) return 'verb';
    if (word.endsWith('ness') || word.endsWith('tion') || word.endsWith('ment')) return 'noun';
    if (word.endsWith('ful') || word.endsWith('less') || word.endsWith('ous')) return 'adjective';
    
    // Check sentence context
    for (const [pos, pattern] of Object.entries(patterns)) {
      if (pattern.test(sentence)) {
        return pos;
      }
    }
    
    return 'unknown';
  }

  // Generate memory hint
  generateMemoryHint(word) {
    const hints = [];
    
    // Prefixes
    const prefixes = {
      'un': 'not/opposite',
      're': 'again/back',
      'pre': 'before',
      'dis': 'not/opposite',
      'over': 'too much',
      'under': 'too little',
      'mis': 'wrongly',
      'sub': 'under/below',
      'inter': 'between',
      'trans': 'across'
    };
    
    // Suffixes
    const suffixes = {
      'able': 'can be done',
      'ful': 'full of',
      'less': 'without',
      'ment': 'action/result',
      'ness': 'state of',
      'tion': 'process',
      'ly': 'manner',
      'er': 'one who',
      'ist': 'one who practices',
      'ism': 'belief system'
    };
    
    for (const [prefix, meaning] of Object.entries(prefixes)) {
      if (word.startsWith(prefix)) {
        hints.push(`Prefix "${prefix}-" means ${meaning}`);
      }
    }
    
    for (const [suffix, meaning] of Object.entries(suffixes)) {
      if (word.endsWith(suffix)) {
        hints.push(`Suffix "-${suffix}" means ${meaning}`);
      }
    }
    
    return hints.join('; ');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIManager;
}
