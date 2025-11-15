// api-manager.js - Multi-source API management with caching and rate limiting

import {
  API_SOURCES,
  TIMING,
  LIMITS,
  ERROR_CODES,
} from './constants.js';
import {
  VocabError,
  fetchWithRetry,
  rateLimiter,
  logError,
  unique,
} from './helpers.js';

/**
 * API Manager for dictionary, audio, and translation services
 */
class APIManager {
  constructor() {
    this.settings = null;
    this.storageManager = null;
  }

  /**
   * Initialize with settings and storage manager
   */
  async init(settings, storageManager) {
    this.settings = settings || await this.loadSettings();
    this.storageManager = storageManager;
  }

  /**
   * Load settings from Chrome storage
   */
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('settings', (result) => {
        resolve(result.settings || {});
      });
    });
  }

  // ==================== MAIN ENRICHMENT FUNCTION ====================

  /**
   * Enrich word with definitions, audio, translations
   * @param {string} word - Word to enrich
   * @param {object} context - Context information
   * @returns {Promise<object>} Enriched data
   */
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
      errors: [],
    };

    try {
      // Check cache first for complete enrichment
      const cacheKey = `enriched_${word}`;
      if (this.storageManager) {
        const cached = await this.storageManager.getCachedData(cacheKey);
        if (cached) {
          console.log(`Using cached enrichment for "${word}"`);
          return cached;
        }
      }

      // 1. Get definitions (with fallback)
      const defResult = await this.getDefinitions(word);
      Object.assign(enrichedData, defResult);

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

      // Cache complete enrichment
      if (this.storageManager) {
        await this.storageManager.cacheData(cacheKey, enrichedData, 'enrichment');
      }

    } catch (error) {
      enrichedData.errors.push({
        type: 'general',
        message: error.message,
      });
      logError('Enrich Word', error, { word });
    }

    return enrichedData;
  }

  // ==================== DICTIONARY SOURCES ====================

  /**
   * Get definitions from multiple sources with intelligent fallback
   * @param {string} word - Word to look up
   * @returns {Promise<object>} Definition data
   */
  async getDefinitions(word) {
    // Check cache first
    const cacheKey = `def_${word}`;
    if (this.storageManager) {
      const cached = await this.storageManager.getCachedData(cacheKey);
      if (cached) {
        console.log(`Using cached definition for "${word}"`);
        return cached;
      }
    }

    const sources = this.settings?.dictionaryPriority || [
      API_SOURCES.DICTIONARY.OXFORD,
      API_SOURCES.DICTIONARY.CAMBRIDGE,
      API_SOURCES.DICTIONARY.MERRIAM_WEBSTER,
      API_SOURCES.DICTIONARY.FREE,
    ];

    for (const source of sources) {
      try {
        console.log(`Trying ${source} dictionary for "${word}"...`);

        let result = null;

        switch (source) {
          case API_SOURCES.DICTIONARY.OXFORD:
            if (this.settings?.oxfordAppId && this.settings?.oxfordAppKey) {
              result = await this.fetchOxfordDictionary(word);
              if (result) {
                result.source = 'Oxford (Premium)';
              }
            }
            break;

          case API_SOURCES.DICTIONARY.CAMBRIDGE:
            result = await this.fetchCambridgeDictionary(word);
            if (result) {
              result.source = 'Cambridge';
            }
            break;

          case API_SOURCES.DICTIONARY.MERRIAM_WEBSTER:
            if (this.settings?.merriamWebsterApiKey) {
              result = await this.fetchMerriamWebster(word);
              if (result) {
                result.source = 'Merriam-Webster';
              }
            }
            break;

          case API_SOURCES.DICTIONARY.FREE:
            result = await this.fetchFreeDictionary(word);
            if (result) {
              result.source = 'Free Dictionary';
            }
            break;
        }

        if (result) {
          // Cache successful result
          if (this.storageManager) {
            await this.storageManager.cacheData(cacheKey, result, source);
          }
          return result;
        }

      } catch (error) {
        console.error(`${source} failed:`, error.message);
        continue;
      }
    }

    // No definition found from any source
    throw new VocabError(ERROR_CODES.NO_DEFINITION_FOUND);
  }

  /**
   * Fetch from Oxford Dictionaries API
   */
  async fetchOxfordDictionary(word) {
    const url = `https://od-api.oxforddictionaries.com/api/v2/entries/en-us/${word.toLowerCase()}`;

    try {
      const response = await fetchWithRetry(
        url,
        {
          headers: {
            'app_id': this.settings.oxfordAppId,
            'app_key': this.settings.oxfordAppKey,
          },
        },
        'oxford'
      );

      const data = await response.json();
      const lexicalEntry = data.results[0].lexicalEntries[0];
      const entry = lexicalEntry.entries[0];
      const sense = entry.senses[0];

      return {
        definitions: sense.definitions || [],
        ipa: entry.pronunciations?.[0]?.phoneticSpelling || '',
        partOfSpeech: lexicalEntry.lexicalCategory.id,
        etymology: entry.etymologies?.[0] || '',
        examples: sense.examples?.map(e => e.text).slice(0, LIMITS.MAX_EXAMPLES) || [],
        synonyms: sense.synonyms?.map(s => s.text).slice(0, LIMITS.MAX_SYNONYMS) || [],
        antonyms: sense.antonyms?.map(a => a.text).slice(0, LIMITS.MAX_ANTONYMS) || [],
      };
    } catch (error) {
      if (error instanceof VocabError) throw error;
      throw new VocabError(ERROR_CODES.API_REQUEST_FAILED, { api: 'Oxford' });
    }
  }

  /**
   * Fetch from Cambridge Dictionary (web scraping)
   */
  async fetchCambridgeDictionary(word) {
    const url = `https://dictionary.cambridge.org/dictionary/english/${word.toLowerCase()}`;

    try {
      const response = await fetchWithRetry(url, {}, 'cambridge');
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract definition
      const defElement = doc.querySelector('.def.ddef_d');
      const definition = defElement?.textContent.trim() || '';

      if (!definition) throw new Error('No definition found');

      // Extract IPA (US pronunciation)
      const ipaElement = doc.querySelector('.us .ipa');
      const ipa = ipaElement?.textContent.trim() || '';

      // Extract part of speech
      const posElement = doc.querySelector('.pos.dpos');
      const partOfSpeech = posElement?.textContent.trim() || '';

      // Extract examples
      const examples = Array.from(doc.querySelectorAll('.examp.dexamp'))
        .map(el => el.textContent.trim())
        .slice(0, LIMITS.MAX_EXAMPLES);

      return {
        definitions: [definition],
        ipa: ipa,
        partOfSpeech: partOfSpeech,
        etymology: '',
        examples: examples,
        synonyms: [],
        antonyms: [],
      };
    } catch (error) {
      if (error instanceof VocabError) throw error;
      throw new VocabError(ERROR_CODES.API_REQUEST_FAILED, { api: 'Cambridge' });
    }
  }

  /**
   * Fetch from Merriam-Webster API
   */
  async fetchMerriamWebster(word) {
    const apiKey = this.settings?.merriamWebsterApiKey;
    if (!apiKey) {
      throw new VocabError(ERROR_CODES.API_KEY_MISSING, { api: 'Merriam-Webster' });
    }

    const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`;

    try {
      const response = await fetchWithRetry(url, {}, 'merriam-webster');
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No results');
      }

      const entry = data[0];
      if (typeof entry === 'string') {
        throw new Error('Did you mean suggestions only');
      }

      return {
        definitions: entry.shortdef || [],
        ipa: entry.hwi?.hw?.replace(/\*/g, '·') || '',
        partOfSpeech: entry.fl || '',
        etymology: entry.et?.[0]?.[1] || '',
        examples: [],
        synonyms: entry.syns?.[0] || [],
        antonyms: entry.ants?.[0] || [],
      };
    } catch (error) {
      if (error instanceof VocabError) throw error;
      throw new VocabError(ERROR_CODES.API_REQUEST_FAILED, { api: 'Merriam-Webster' });
    }
  }

  /**
   * Fetch from Free Dictionary API (fallback)
   */
  async fetchFreeDictionary(word) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;

    try {
      const response = await fetchWithRetry(url, {}, 'free-dictionary');
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
        synonyms: definition.synonyms?.slice(0, LIMITS.MAX_SYNONYMS) || [],
        antonyms: definition.antonyms?.slice(0, LIMITS.MAX_ANTONYMS) || [],
      };
    } catch (error) {
      if (error instanceof VocabError) throw error;
      throw new VocabError(ERROR_CODES.API_REQUEST_FAILED, { api: 'Free Dictionary' });
    }
  }

  // ==================== AUDIO SOURCES ====================

  /**
   * Get audio pronunciations from multiple sources
   * @param {string} word - Word to get audio for
   * @param {string} ipa - IPA pronunciation
   * @returns {Promise<object>} Audio data
   */
  async getAudio(word, ipa) {
    // Check cache first
    const cacheKey = `audio_${word}`;
    if (this.storageManager) {
      const cached = await this.storageManager.getCachedData(cacheKey);
      if (cached) {
        console.log(`Using cached audio for "${word}"`);
        return cached;
      }
    }

    const sources = this.settings?.audioPriority || [
      API_SOURCES.AUDIO.FORVO,
      API_SOURCES.AUDIO.OXFORD,
      API_SOURCES.AUDIO.CAMBRIDGE,
      API_SOURCES.AUDIO.GOOGLE_TTS,
    ];

    const audioFiles = [];

    for (const source of sources) {
      try {
        console.log(`Trying ${source} audio for "${word}"...`);

        let audio = null;

        switch (source) {
          case API_SOURCES.AUDIO.FORVO:
            if (this.settings?.forvoApiKey) {
              audio = await this.fetchForvoAudio(word);
              if (audio.length > 0) {
                audioFiles.push(...audio);
                if (!this.settings?.downloadBothAccents) {
                  const result = { audio: audioFiles };
                  if (this.storageManager) {
                    await this.storageManager.cacheData(cacheKey, result, source);
                  }
                  return result;
                }
              }
            }
            break;

          case API_SOURCES.AUDIO.OXFORD:
            if (this.settings?.oxfordAppId && this.settings?.oxfordAppKey) {
              audio = await this.fetchOxfordAudio(word);
              if (audio) {
                audioFiles.push(audio);
                if (!this.settings?.downloadBothAccents) {
                  const result = { audio: audioFiles };
                  if (this.storageManager) {
                    await this.storageManager.cacheData(cacheKey, result, source);
                  }
                  return result;
                }
              }
            }
            break;

          case API_SOURCES.AUDIO.CAMBRIDGE:
            audio = await this.fetchCambridgeAudio(word);
            if (audio) {
              audioFiles.push(audio);
              if (!this.settings?.downloadBothAccents) {
                const result = { audio: audioFiles };
                if (this.storageManager) {
                  await this.storageManager.cacheData(cacheKey, result, source);
                }
                return result;
              }
            }
            break;

          case API_SOURCES.AUDIO.GOOGLE_TTS:
            const googleTTS = this.getGoogleTTSUrl(word);
            audioFiles.push({
              url: googleTTS,
              accent: 'us',
              source: 'Google TTS',
              quality: 'synthetic',
            });
            break;
        }
      } catch (error) {
        console.error(`${source} audio failed:`, error.message);
        continue;
      }
    }

    const result = { audio: unique(audioFiles) };

    // Cache result
    if (this.storageManager && audioFiles.length > 0) {
      await this.storageManager.cacheData(cacheKey, result, 'audio');
    }

    return result;
  }

  /**
   * Fetch audio from Forvo API
   */
  async fetchForvoAudio(word) {
    const apiKey = this.settings?.forvoApiKey;
    if (!apiKey) {
      throw new VocabError(ERROR_CODES.API_KEY_MISSING, { api: 'Forvo' });
    }

    const url = `https://apifree.forvo.com/key/${apiKey}/format/json/action/word-pronunciations/word/${word}/language/en`;

    try {
      const response = await fetchWithRetry(url, {}, 'forvo');
      const data = await response.json();
      const items = data.items || [];

      // Filter and sort by ratings
      const audioFiles = items
        .filter(item => this.settings?.preferUsAudio ? item.country === 'United States' : true)
        .sort((a, b) => (b.num_positive_votes || 0) - (a.num_positive_votes || 0))
        .slice(0, LIMITS.MAX_AUDIO_FILES)
        .map(item => ({
          url: item.pathmp3,
          accent: item.country === 'United States' ? 'us' : 'uk',
          source: 'Forvo',
          quality: 'native',
          username: item.username,
          votes: item.num_positive_votes,
        }));

      return audioFiles;
    } catch (error) {
      if (error instanceof VocabError) throw error;
      throw new VocabError(ERROR_CODES.API_REQUEST_FAILED, { api: 'Forvo' });
    }
  }

  /**
   * Fetch audio from Oxford API
   */
  async fetchOxfordAudio(word) {
    const url = `https://od-api.oxforddictionaries.com/api/v2/entries/en-us/${word.toLowerCase()}`;

    try {
      const response = await fetchWithRetry(
        url,
        {
          headers: {
            'app_id': this.settings.oxfordAppId,
            'app_key': this.settings.oxfordAppKey,
          },
        },
        'oxford-audio'
      );

      const data = await response.json();
      const audioUrl = data.results[0].lexicalEntries[0].entries[0].pronunciations?.[0]?.audioFile;

      if (audioUrl) {
        return {
          url: audioUrl,
          accent: 'us',
          source: 'Oxford',
          quality: 'professional',
        };
      }

      return null;
    } catch (error) {
      if (error instanceof VocabError) throw error;
      return null;
    }
  }

  /**
   * Fetch audio from Cambridge Dictionary
   */
  async fetchCambridgeAudio(word) {
    const url = `https://dictionary.cambridge.org/dictionary/english/${word.toLowerCase()}`;

    try {
      const response = await fetchWithRetry(url, {}, 'cambridge-audio');
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
          quality: 'professional',
        };
      }

      return null;
    } catch (error) {
      if (error instanceof VocabError) throw error;
      return null;
    }
  }

  /**
   * Get Google TTS URL (fallback)
   */
  getGoogleTTSUrl(word) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&client=tw-ob`;
  }

  // ==================== TRANSLATION ====================

  /**
   * Get Vietnamese translation
   * @param {string} text - Text to translate
   * @returns {Promise<string>} Vietnamese translation
   */
  async getVietnameseTranslation(text) {
    // Check cache first
    const cacheKey = `trans_${text}`;
    if (this.storageManager) {
      const cached = await this.storageManager.getCachedData(cacheKey);
      if (cached) {
        console.log(`Using cached translation for "${text}"`);
        return cached;
      }
    }

    try {
      const response = await fetchWithRetry(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`,
        {},
        'translation'
      );

      const data = await response.json();
      const translation = data.responseData.translatedText || text;

      // Cache translation
      if (this.storageManager) {
        await this.storageManager.cacheData(cacheKey, translation, 'translation');
      }

      return translation;
    } catch (error) {
      logError('Vietnamese Translation', error, { text });
      return text; // Return original if translation fails
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Extract collocations from sentence
   */
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

    return unique(collocations);
  }

  /**
   * Get images (placeholder for future implementation)
   */
  async getImages(word) {
    // TODO: Integrate with Unsplash API or Google Images API
    return [];
  }

  /**
   * Detect part of speech from context
   */
  detectPOSFromContext(word, sentence) {
    const patterns = {
      verb: /\b(is|are|was|were|been|be|have|has|had|do|does|did|will|would|could|should|may|might|can)\s+\w*ing\b/i,
      noun: /\b(the|a|an|this|that|these|those|my|your|his|her|its|our|their)\s+\w+\b/i,
      adjective: /\b(very|so|too|quite|really|extremely)\s+\w+\b/i,
      adverb: /\w+ly\b/i,
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

  /**
   * Generate memory hint based on word structure
   */
  generateMemoryHint(word) {
    const hints = [];

    // Prefixes
    const prefixes = {
      'un': 'không/phủ định',
      're': 'lại/trở lại',
      'pre': 'trước',
      'dis': 'không/ngược lại',
      'over': 'quá mức',
      'under': 'dưới mức',
      'mis': 'sai',
      'sub': 'dưới',
      'inter': 'giữa',
      'trans': 'qua',
      'anti': 'chống lại',
      'auto': 'tự động',
      'co': 'cùng',
      'de': 'xuống/giảm',
      'ex': 'ra ngoài',
    };

    // Suffixes
    const suffixes = {
      'able': 'có thể được',
      'ful': 'đầy',
      'less': 'không có',
      'ment': 'hành động/kết quả',
      'ness': 'tính chất',
      'tion': 'hành động/quá trình',
      'ly': 'một cách',
      'er': 'người/vật',
      'ist': 'người theo chủ nghĩa',
      'ism': 'chủ nghĩa',
      'ive': 'có tính chất',
      'al': 'liên quan đến',
      'ous': 'nhiều/đầy',
      'y': 'có tính chất',
    };

    for (const [prefix, meaning] of Object.entries(prefixes)) {
      if (word.startsWith(prefix)) {
        hints.push(`Tiền tố "${prefix}-" = ${meaning}`);
      }
    }

    for (const [suffix, meaning] of Object.entries(suffixes)) {
      if (word.endsWith(suffix)) {
        hints.push(`Hậu tố "-${suffix}" = ${meaning}`);
      }
    }

    return hints.join('; ');
  }
}

// Export for use in other modules
export default APIManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIManager;
}
