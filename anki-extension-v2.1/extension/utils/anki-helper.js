// anki-helper.js - AnkiConnect integration helper

import { ANKI, ERROR_CODES, TIMING } from './constants.js';
import { VocabError, fetchWithRetry, retryWithBackoff } from './helpers.js';

/**
 * AnkiConnect Helper Class
 */
class AnkiHelper {
  constructor() {
    this.url = ANKI.CONNECT_URL;
    this.version = ANKI.VERSION;
  }

  /**
   * Make AnkiConnect API call
   */
  async invoke(action, params = {}) {
    try {
      const response = await fetchWithRetry(
        this.url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            version: this.version,
            params,
          }),
        },
        'anki'
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.result;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new VocabError(ERROR_CODES.ANKI_NOT_CONNECTED);
      }
      throw error;
    }
  }

  /**
   * Check AnkiConnect version and connection
   */
  async checkConnection() {
    try {
      const version = await this.invoke('version');
      return {
        connected: true,
        version,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all deck names
   */
  async getDeckNames() {
    try {
      const decks = await this.invoke('deckNames');
      return decks;
    } catch (error) {
      throw new VocabError(ERROR_CODES.ANKI_NOT_CONNECTED);
    }
  }

  /**
   * Get all model (note type) names
   */
  async getModelNames() {
    try {
      const models = await this.invoke('modelNames');
      return models;
    } catch (error) {
      throw new VocabError(ERROR_CODES.ANKI_NOT_CONNECTED);
    }
  }

  /**
   * Get field names for a specific model
   */
  async getModelFieldNames(modelName) {
    try {
      const fields = await this.invoke('modelFieldNames', { modelName });
      return fields;
    } catch (error) {
      if (error.message.includes('model was not found')) {
        throw new VocabError(ERROR_CODES.ANKI_NOTE_TYPE_NOT_FOUND, { noteType: modelName });
      }
      throw error;
    }
  }

  /**
   * Get complete model information
   */
  async getModelInfo(modelName) {
    try {
      const fields = await this.getModelFieldNames(modelName);
      const templates = await this.invoke('modelTemplates', { modelName });

      return {
        name: modelName,
        fields,
        templates: Object.keys(templates),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a note to Anki
   */
  async addNote(note) {
    try {
      const noteId = await this.invoke('addNote', { note });
      return noteId;
    } catch (error) {
      if (error.message.includes('duplicate')) {
        throw new VocabError(ERROR_CODES.ANKI_DUPLICATE_NOTE);
      }
      if (error.message.includes('deck')) {
        throw new VocabError(ERROR_CODES.ANKI_DECK_NOT_FOUND, { deck: note.deckName });
      }
      if (error.message.includes('model')) {
        throw new VocabError(ERROR_CODES.ANKI_NOTE_TYPE_NOT_FOUND, { noteType: note.modelName });
      }
      throw new VocabError(ERROR_CODES.ANKI_ADD_NOTE_FAILED);
    }
  }

  /**
   * Store media file in Anki
   */
  async storeMediaFile(filename, data) {
    try {
      const result = await this.invoke('storeMediaFile', {
        filename,
        data, // Base64 encoded
      });
      return filename;
    } catch (error) {
      console.error('Failed to store media file:', error);
      return null;
    }
  }

  /**
   * Download audio and store in Anki
   */
  async downloadAndStoreAudio(word, audioUrl) {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Failed to download audio');

      const audioBlob = await response.blob();

      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result.split(',')[1];
            const filename = `vocab_${word}_${Date.now()}.mp3`;

            const storedFilename = await this.storeMediaFile(filename, base64Audio);
            resolve(storedFilename);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
    } catch (error) {
      console.error('Audio download error:', error);
      return null;
    }
  }

  /**
   * Create Anki note from enriched data with field mapping
   */
  async createNote(queueItem, fieldMapping, settings) {
    const { word, enrichedData, context } = queueItem;
    const modelName = settings.noteType || 'Basic';
    const deckName = queueItem.targetDeck || settings.defaultDeck;

    // Prepare field values from enriched data
    const dataMap = {
      word: word,
      ipa: enrichedData?.ipa || '',
      vietnamese: enrichedData?.vietnamese || '',
      partOfSpeech: enrichedData?.partOfSpeech || '',
      audio: '', // Will be set below
      exampleEn: context?.sentence || enrichedData?.examples?.[0] || '',
      exampleVn: '', // Will be translated
      definition: enrichedData?.definitions?.[0] || '',
      image: '',
      synonyms: enrichedData?.synonyms?.join(', ') || '',
      antonyms: enrichedData?.antonyms?.join(', ') || '',
      collocations: enrichedData?.collocations?.join(', ') || '',
      wordFamily: '',
      etymology: enrichedData?.etymology || '',
      hints: this.generateMemoryHint(word),
    };

    // Download and store audio
    if (enrichedData?.audio?.length > 0) {
      const audioUrl = enrichedData.audio[0].url;
      const audioFilename = await this.downloadAndStoreAudio(word, audioUrl);
      if (audioFilename) {
        dataMap.audio = `[sound:${audioFilename}]`;
      }
    }

    // Translate example sentence to Vietnamese if not already done
    if (dataMap.exampleEn && !dataMap.exampleVn) {
      try {
        dataMap.exampleVn = await this.translateToVietnamese(dataMap.exampleEn);
      } catch (error) {
        console.error('Translation error:', error);
      }
    }

    // Map extension data fields to Anki note fields based on fieldMapping
    const fields = {};
    for (const [ankiField, extensionField] of Object.entries(fieldMapping)) {
      fields[ankiField] = dataMap[extensionField] || '';
    }

    // Create note object
    const note = {
      deckName,
      modelName,
      fields,
      tags: [
        'vocab-assistant',
        context?.source?.type || 'web',
        new Date().toISOString().split('T')[0],
        ...(queueItem.metadata?.tags || []),
      ],
      options: {
        allowDuplicate: settings.allowDuplicates || false,
        duplicateScope: settings.duplicateScope || 'deck',
      },
    };

    return note;
  }

  /**
   * Translate text to Vietnamese
   */
  async translateToVietnamese(text) {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`
      );

      if (!response.ok) throw new Error('Translation API error');

      const data = await response.json();
      return data.responseData.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return '';
    }
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

  /**
   * Validate field mapping
   */
  validateFieldMapping(fieldMapping, modelFields) {
    const mappedFields = Object.keys(fieldMapping);
    const invalidFields = mappedFields.filter(field => !modelFields.includes(field));

    if (invalidFields.length > 0) {
      throw new Error(`Invalid fields for selected note type: ${invalidFields.join(', ')}`);
    }

    return true;
  }

  /**
   * Get suggested field mapping based on field names
   */
  suggestFieldMapping(modelFields, extensionFields) {
    const mapping = {};

    // Normalize field names for comparison
    const normalize = (str) => str.toLowerCase().replace(/[_\s-]/g, '');

    for (const modelField of modelFields) {
      const normalizedModel = normalize(modelField);

      // Try exact match first
      for (const [extKey, extField] of Object.entries(extensionFields)) {
        const normalizedExt = normalize(extKey);
        if (normalizedModel === normalizedExt) {
          mapping[modelField] = extField;
          break;
        }
      }

      // Try partial match
      if (!mapping[modelField]) {
        for (const [extKey, extField] of Object.entries(extensionFields)) {
          const normalizedExt = normalize(extKey);
          if (normalizedModel.includes(normalizedExt) || normalizedExt.includes(normalizedModel)) {
            mapping[modelField] = extField;
            break;
          }
        }
      }
    }

    return mapping;
  }
}

// Export singleton instance
export const ankiHelper = new AnkiHelper();

// Export class for testing
export default AnkiHelper;
