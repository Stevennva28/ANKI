// background.js - Service Worker for Extension V2.1
import StorageManager from './utils/storage-manager.js';
import APIManager from './utils/api-manager.js';
import { ankiHelper } from './utils/anki-helper.js';
import {
  validateWord,
  validateSentence,
  VocabError,
  processBatch,
  logError,
  formatError,
} from './utils/helpers.js';
import {
  TIMING,
  STATUS,
  ERROR_CODES,
  LIMITS,
  ANKI,
  SOURCE_TYPES,
  SOURCE_ICONS,
  DEFAULT_FIELD_MAPPING,
} from './utils/constants.js';

// Initialize managers
const storage = new StorageManager();
const apiManager = new APIManager();

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await storage.saveSettings(storage.getDefaultSettings());

    // Create context menus
    createContextMenus();

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('library.html?welcome=true')
    });
  }

  // Initialize storage and API manager
  await storage.init();

  const settings = await storage.getSettings();
  await apiManager.init(settings, storage); // Pass storage for caching!

  // Update badge
  await storage.updateBadge();

  console.log('Anki Vocabulary Assistant V2.1 - Background initialized');
});

// Create context menus
function createContextMenus() {
  chrome.contextMenus.create({
    id: 'add-to-queue',
    title: 'Add "%s" to vocabulary queue',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'add-sentence-cloze',
    title: 'Create cloze card from sentence',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'open-library',
    title: 'Open Vocabulary Library',
    contexts: ['page']
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === 'add-to-queue') {
      const word = info.selectionText.trim();
      await addWordToQueue(word, tab);
    } else if (info.menuItemId === 'add-sentence-cloze') {
      await addSentenceCloze(info.selectionText, tab);
    } else if (info.menuItemId === 'open-library') {
      chrome.tabs.create({ url: chrome.runtime.getURL('library.html') });
    }
  } catch (error) {
    logError('Context Menu', error);
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender) {
  try {
    switch (request.action) {
      // Queue operations
      case 'addToQueue':
        return await addWordToQueue(request.word, sender.tab, request.context);

      case 'enrichWord':
        return await enrichWord(request.itemId);

      case 'batchEnrich':
        return await batchEnrich(request.itemIds);

      case 'addToAnki':
        return await addToAnki(request.itemId);

      case 'addToAnkiNow':
        // Premium popup: Add word directly to Anki (queue → enrich → anki)
        return await addToAnkiNow(request.word, sender.tab, request.context, request.data);

      case 'batchAddToAnki':
        return await batchAddToAnki(request.itemIds);

      case 'getQueue':
        return await storage.getQueue(request.options);

      case 'getQueueItem':
        return await storage.getQueueItem(request.id);

      case 'updateQueueItem':
        return await storage.updateQueueItem(request.id, request.updates);

      case 'deleteQueueItem':
        await storage.deleteQueueItem(request.id);
        return { success: true };

      case 'clearQueue':
        await storage.clearQueue();
        return { success: true };

      // History operations
      case 'getHistory':
        return await storage.getHistory(request.options);

      case 'searchHistory':
        return await storage.searchHistory(request.query);

      // Statistics
      case 'getStatistics':
        return await storage.getStatistics();

      // Settings
      case 'getSettings':
        return await storage.getSettings();

      case 'saveSettings':
        await storage.saveSettings(request.settings);
        await apiManager.init(request.settings, storage);
        return { success: true };

      // Anki operations
      case 'checkAnkiConnection':
        return await checkAnkiConnection();

      case 'getAnkiDecks':
        return await getAnkiDecks();

      case 'getAnkiModels':
        return await getAnkiModels();

      case 'getModelFields':
        return await getModelFields(request.modelName);

      case 'suggestFieldMapping':
        return suggestFieldMapping(request.modelFields);

      case 'validateFieldMapping':
        return validateFieldMapping(request.mapping, request.modelFields);

      // Data management
      case 'exportData':
        return await storage.exportData();

      case 'importData':
        await storage.importData(request.data);
        return { success: true };

      default:
        throw new VocabError(ERROR_CODES.UNKNOWN_ERROR, { action: request.action });
    }
  } catch (error) {
    logError('Message Handler', error, { action: request.action });
    return { error: formatError(error) };
  }
}

// ==================== QUEUE OPERATIONS ====================

/**
 * Add word to queue with validation
 */
async function addWordToQueue(word, tab, context = {}) {
  try {
    // Validate word
    const validatedWord = validateWord(word);

    // Create queue item
    const item = {
      word: validatedWord,
      sentence: context.sentence || '',
      source: {
        type: detectSourceType(tab?.url),
        url: tab?.url || '',
        title: tab?.title || '',
        timestamp: context.timestamp || null,
        thumbnail: context.thumbnail || null
      },
      surroundingText: context.surroundingText || '',
      priority: context.priority || 'normal',
      tags: context.tags || []
    };

    const queueItem = await storage.addToQueue(item);

    // Show notification
    const settings = await storage.getSettings();
    if (settings.showNotifications) {
      showNotification(
        '✅ Added to Queue',
        `"${validatedWord}" has been added to your vocabulary queue`
      );
    }

    // Auto-enrich if enabled
    if (settings.autoEnrichOnAdd) {
      setTimeout(() => enrichWord(queueItem.id), settings.enrichDelay || TIMING.ENRICH_DELAY);
    }

    return { success: true, item: queueItem };
  } catch (error) {
    logError('Add To Queue', error, { word });
    return { error: formatError(error) };
  }
}

/**
 * Enrich word with definitions, audio, translations
 */
async function enrichWord(itemId) {
  try {
    const item = await storage.getQueueItem(itemId);
    if (!item) {
      throw new VocabError(ERROR_CODES.ITEM_NOT_FOUND);
    }

    // Update status
    await storage.updateQueueItem(itemId, { status: STATUS.ENRICHING });

    // Enrich with APIs (with caching!)
    const enrichedData = await apiManager.enrichWord(item.word, item.context);

    // Update item with enriched data
    await storage.updateQueueItem(itemId, {
      status: STATUS.ENRICHED,
      enrichedData: enrichedData
    });

    return { success: true, data: enrichedData };
  } catch (error) {
    await storage.updateQueueItem(itemId, {
      status: STATUS.ERROR,
      error: error.message
    });
    logError('Enrich Word', error, { itemId });
    return { error: formatError(error) };
  }
}

/**
 * Batch enrich multiple words (3x faster with concurrent processing)
 */
async function batchEnrich(itemIds) {
  try {
    const results = await processBatch(
      itemIds,
      async (id) => {
        const result = await enrichWord(id);
        if (result.error) throw new Error(result.error.message);
        return result;
      },
      3, // Process 3 items concurrently
      TIMING.BATCH_DELAY
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      results,
      summary: {
        total: itemIds.length,
        successful,
        failed,
      },
    };
  } catch (error) {
    logError('Batch Enrich', error, { count: itemIds.length });
    return { error: formatError(error) };
  }
}

// ==================== ANKI OPERATIONS ====================

/**
 * Check AnkiConnect connection
 */
async function checkAnkiConnection() {
  try {
    const result = await ankiHelper.checkConnection();
    return result;
  } catch (error) {
    logError('Check Anki Connection', error);
    return { connected: false, error: formatError(error) };
  }
}

/**
 * Get all Anki decks
 */
async function getAnkiDecks() {
  try {
    const decks = await ankiHelper.getDeckNames();
    return { decks };
  } catch (error) {
    logError('Get Anki Decks', error);
    return { error: formatError(error) };
  }
}

/**
 * Get all Anki note types (models)
 */
async function getAnkiModels() {
  try {
    const models = await ankiHelper.getModelNames();
    return { models };
  } catch (error) {
    logError('Get Anki Models', error);
    return { error: formatError(error) };
  }
}

/**
 * Get fields for a specific note type
 */
async function getModelFields(modelName) {
  try {
    const fields = await ankiHelper.getModelFieldNames(modelName);
    return { fields };
  } catch (error) {
    logError('Get Model Fields', error, { modelName });
    return { error: formatError(error) };
  }
}

/**
 * Suggest field mapping based on field names
 */
function suggestFieldMapping(modelFields) {
  try {
    const suggested = ankiHelper.suggestFieldMapping(modelFields, ANKI.EXTENSION_FIELDS);
    return { mapping: suggested };
  } catch (error) {
    logError('Suggest Field Mapping', error);
    return { error: formatError(error) };
  }
}

/**
 * Validate field mapping
 */
function validateFieldMapping(mapping, modelFields) {
  try {
    ankiHelper.validateFieldMapping(mapping, modelFields);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Add word to Anki using field mapping
 */
async function addToAnki(itemId) {
  try {
    const item = await storage.getQueueItem(itemId);
    if (!item) {
      throw new VocabError(ERROR_CODES.ITEM_NOT_FOUND);
    }

    // Enrich first if not enriched
    if (!item.enrichedData) {
      await enrichWord(itemId);
      // Retry after enrichment
      return await addToAnki(itemId);
    }

    // Update status
    await storage.updateQueueItem(itemId, { status: STATUS.ADDING });

    // Get settings with field mapping
    const settings = await storage.getSettings();

    // Use default mapping if not configured
    const fieldMapping = settings.fieldMapping || DEFAULT_FIELD_MAPPING;

    // Create Anki note using ankiHelper with field mapping
    const note = await ankiHelper.createNote(item, fieldMapping, settings);

    // Add to Anki
    const noteId = await ankiHelper.addNote(note);

    // Move to history
    await storage.addToHistory({
      ...item,
      addedToAnkiAt: Date.now(),
      ankiNoteId: noteId
    });
    await storage.deleteQueueItem(itemId);

    // Show notification
    const notifSettings = await storage.getSettings();
    if (notifSettings.showNotifications) {
      showNotification(
        '✅ Added to Anki',
        `"${item.word}" has been added to your Anki deck`
      );
    }

    return { success: true, noteId };
  } catch (error) {
    await storage.updateQueueItem(itemId, {
      status: STATUS.ERROR,
      error: error.message
    });
    logError('Add To Anki', error, { itemId });
    return { error: formatError(error) };
  }
}

/**
 * Batch add multiple words to Anki
 */
async function batchAddToAnki(itemIds) {
  try {
    const results = await processBatch(
      itemIds,
      async (id) => {
        const result = await addToAnki(id);
        if (result.error) throw new Error(result.error.message);
        return result;
      },
      2, // Process 2 items concurrently (slower for Anki)
      TIMING.ANKI_DELAY
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      results,
      summary: {
        total: itemIds.length,
        successful,
        failed,
      },
    };
  } catch (error) {
    logError('Batch Add To Anki', error, { count: itemIds.length });
    return { error: formatError(error) };
  }
}

/**
 * Add word to Anki immediately (Premium popup flow)
 * Steps: addToQueue → enrichWord → addToAnki
 */
async function addToAnkiNow(word, tab, context, premiumData) {
  try {
    // Step 1: Add to queue
    const queueResult = await addWordToQueue(word, tab, context);

    if (queueResult.error) {
      return { error: queueResult.error };
    }

    const itemId = queueResult.item.id;

    // If premium data provided (multiple meanings selected), save it
    if (premiumData && premiumData.selectedMeanings) {
      await storage.updateQueueItem(itemId, {
        premiumData: premiumData.selectedMeanings,
      });
    }

    // Step 2: Enrich word
    const enrichResult = await enrichWord(itemId);

    if (enrichResult.error) {
      // Continue even if enrichment fails - we still have basic data
      console.warn('Enrichment failed, proceeding with basic data:', enrichResult.error);
    }

    // Step 3: Add to Anki
    const ankiResult = await addToAnki(itemId);

    if (ankiResult.error) {
      return { error: ankiResult.error };
    }

    // Step 4: Show notification
    showNotification(
      `✅ "${word}" added to Anki!`,
      `Successfully created card in Anki`,
      'success'
    );

    return {
      success: true,
      itemId,
      noteId: ankiResult.noteId,
      message: `"${word}" added to Anki successfully`,
    };
  } catch (error) {
    logError('Add To Anki Now', error, { word });
    return { error: formatError(error) };
  }
}

// ==================== UTILITIES ====================

/**
 * Detect source type from URL
 */
function detectSourceType(url) {
  if (!url) return SOURCE_TYPES.WEB;

  if (url.includes('youtube.com')) return SOURCE_TYPES.YOUTUBE;
  if (url.includes('wikipedia.org')) return SOURCE_TYPES.WIKIPEDIA;
  if (url.includes('medium.com')) return SOURCE_TYPES.ARTICLE;
  if (url.endsWith('.pdf')) return SOURCE_TYPES.PDF;

  return SOURCE_TYPES.WEB;
}

/**
 * Show notification
 */
function showNotification(title, message) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message,
      priority: 1
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}

/**
 * Add sentence cloze (extract words from sentence)
 */
async function addSentenceCloze(sentence, tab) {
  try {
    const validatedSentence = validateSentence(sentence);

    // Extract words from sentence
    const words = validatedSentence.trim().split(/\s+/)
      .filter(w => w.length > 3)
      .map(w => w.replace(/[^a-z'-]/gi, ''))
      .filter(w => w);

    if (words.length === 0) {
      throw new VocabError(ERROR_CODES.INVALID_WORD);
    }

    // Add each word to queue
    const results = [];
    for (const word of words.slice(0, LIMITS.MAX_WORDS_IN_PHRASE)) {
      try {
        const result = await addWordToQueue(word, tab, {
          sentence: validatedSentence,
          tags: ['cloze']
        });
        if (result.success) results.push(result);
      } catch (error) {
        logError('Add Cloze Word', error, { word });
      }
    }

    return { success: true, wordsAdded: results.length };
  } catch (error) {
    logError('Add Sentence Cloze', error);
    return { error: formatError(error) };
  }
}

// ==================== KEYBOARD SHORTCUTS ====================

chrome.commands.onCommand.addListener((command) => {
  try {
    if (command === 'add-to-queue') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'captureSelection' });
        }
      });
    } else if (command === 'open-library') {
      chrome.tabs.create({ url: chrome.runtime.getURL('library.html') });
    }
  } catch (error) {
    logError('Command Handler', error, { command });
  }
});

// ==================== ALARMS ====================

// Alarm for cache cleanup (daily)
chrome.alarms.create('cleanupCache', {
  periodInMinutes: TIMING.CACHE_CLEANUP_INTERVAL
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (alarm.name === 'cleanupCache') {
      await storage.clearExpiredCache();
      console.log('Cache cleanup completed');
    }
  } catch (error) {
    logError('Alarm Handler', error, { alarm: alarm.name });
  }
});

console.log('Anki Vocabulary Assistant V2.1 - Background Service Worker loaded');
