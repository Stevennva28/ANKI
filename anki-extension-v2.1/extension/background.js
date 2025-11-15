// background.js - Service Worker for Extension V2
import StorageManager from './utils/storage-manager.js';
import APIManager from './utils/api-manager.js';

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
  
  // Initialize storage
  await storage.init();
  await apiManager.init();
  
  // Update badge
  await storage.updateBadge();
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
  if (info.menuItemId === 'add-to-queue') {
    const word = info.selectionText.trim();
    await addWordToQueue(word, tab);
  } else if (info.menuItemId === 'add-sentence-cloze') {
    await addSentenceCloze(info.selectionText, tab);
  } else if (info.menuItemId === 'open-library') {
    chrome.tabs.create({ url: chrome.runtime.getURL('library.html') });
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
      case 'addToQueue':
        return await addWordToQueue(request.word, sender.tab, request.context);
        
      case 'enrichWord':
        return await enrichWord(request.itemId);
        
      case 'batchEnrich':
        return await batchEnrich(request.itemIds);
        
      case 'addToAnki':
        return await addToAnki(request.itemId);
        
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
        
      case 'getHistory':
        return await storage.getHistory(request.options);
        
      case 'searchHistory':
        return await storage.searchHistory(request.query);
        
      case 'getStatistics':
        return await storage.getStatistics();
        
      case 'getSettings':
        return await storage.getSettings();
        
      case 'saveSettings':
        await storage.saveSettings(request.settings);
        await apiManager.init(request.settings);
        return { success: true };
        
      case 'checkAnkiConnection':
        return await checkAnkiConnection();
        
      case 'getAnkiDecks':
        return await getAnkiDecks();
        
      case 'exportData':
        return await storage.exportData();
        
      case 'importData':
        await storage.importData(request.data);
        return { success: true };
        
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
  } catch (error) {
    return { error: error.message };
  }
}

// ==================== QUEUE OPERATIONS ====================

async function addWordToQueue(word, tab, context = {}) {
  try {
    // Clean word
    word = word.toLowerCase().trim().replace(/[^a-z\s-]/gi, '');
    if (!word || word.split(' ').length > 3) {
      throw new Error('Invalid word');
    }
    
    // Create queue item
    const item = {
      word: word,
      sentence: context.sentence || '',
      source: {
        type: detectSourceType(tab.url),
        url: tab.url,
        title: tab.title,
        timestamp: context.timestamp || null,
        thumbnail: context.thumbnail || null
      },
      surroundingText: context.surroundingText || '',
      priority: context.priority || 'normal',
      tags: context.tags || []
    };
    
    const queueItem = await storage.addToQueue(item);
    
    // Show notification
    if ((await storage.getSettings()).showNotifications) {
      showNotification(
        '✅ Added to Queue',
        `"${word}" has been added to your vocabulary queue`
      );
    }
    
    // Auto-enrich if enabled
    const settings = await storage.getSettings();
    if (settings.autoEnrichOnAdd) {
      setTimeout(() => enrichWord(queueItem.id), settings.enrichDelay || 2000);
    }
    
    return { success: true, item: queueItem };
  } catch (error) {
    return { error: error.message };
  }
}

async function enrichWord(itemId) {
  try {
    const item = await storage.getQueueItem(itemId);
    if (!item) throw new Error('Item not found');
    
    // Update status
    await storage.updateQueueItem(itemId, { status: 'enriching' });
    
    // Enrich with APIs
    const enrichedData = await apiManager.enrichWord(item.word, item.context);
    
    // Update item with enriched data
    await storage.updateQueueItem(itemId, {
      status: 'enriched',
      enrichedData: enrichedData
    });
    
    return { success: true, data: enrichedData };
  } catch (error) {
    await storage.updateQueueItem(itemId, {
      status: 'error',
      error: error.message
    });
    return { error: error.message };
  }
}

async function batchEnrich(itemIds) {
  const results = [];
  
  for (const id of itemIds) {
    try {
      const result = await enrichWord(id);
      results.push({ id, success: true, result });
      
      // Delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }
  
  return { results };
}

// ==================== ANKI OPERATIONS ====================

async function checkAnkiConnection() {
  try {
    const response = await fetch('http://localhost:8765', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'version',
        version: 6
      })
    });
    
    const result = await response.json();
    return { connected: !!result.result, version: result.result };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

async function getAnkiDecks() {
  try {
    const response = await fetch('http://localhost:8765', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deckNames',
        version: 6
      })
    });
    
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    
    return { decks: result.result };
  } catch (error) {
    return { error: error.message };
  }
}

async function addToAnki(itemId) {
  try {
    const item = await storage.getQueueItem(itemId);
    if (!item) throw new Error('Item not found');
    if (!item.enrichedData) {
      // Enrich first
      await enrichWord(itemId);
      return await addToAnki(itemId); // Retry
    }
    
    // Update status
    await storage.updateQueueItem(itemId, { status: 'adding' });
    
    // Create Anki note
    const note = await createAnkiNote(item);
    
    // Add to Anki via AnkiConnect
    const response = await fetch('http://localhost:8765', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addNote',
        version: 6,
        params: { note }
      })
    });
    
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    
    // Move to history
    await storage.addToHistory(item);
    await storage.deleteQueueItem(itemId);
    
    // Show notification
    showNotification(
      '✅ Added to Anki',
      `"${item.word}" has been added to your Anki deck`
    );
    
    return { success: true, noteId: result.result };
  } catch (error) {
    await storage.updateQueueItem(itemId, {
      status: 'error',
      error: error.message
    });
    return { error: error.message };
  }
}

async function batchAddToAnki(itemIds) {
  const results = [];
  
  for (const id of itemIds) {
    try {
      const result = await addToAnki(id);
      results.push({ id, success: true, result });
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }
  
  return { results };
}

async function createAnkiNote(item) {
  const data = item.enrichedData;
  const settings = await storage.getSettings();
  
  // Download and store audio
  let audioField = '';
  if (data.audio && data.audio.length > 0) {
    const audioUrl = data.audio[0].url;
    const audioFilename = await downloadAndStoreAudio(item.word, audioUrl);
    if (audioFilename) {
      audioField = `[sound:${audioFilename}]`;
    }
  }
  
  // Create note
  const note = {
    deckName: item.targetDeck,
    modelName: 'EnglishVocabulary_VN',
    fields: {
      Word: item.word,
      IPA: data.ipa || '',
      Vietnamese: data.vietnamese || '',
      Part_of_Speech: data.partOfSpeech || '',
      Audio: audioField,
      Example_EN: item.context.sentence || (data.examples?.[0] || ''),
      Example_VN: await apiManager.getVietnameseTranslation(item.context.sentence || data.examples?.[0] || ''),
      English_Definition: data.definitions?.[0] || '',
      Image: '',
      Synonyms: data.synonyms?.join(', ') || '',
      Antonyms: data.antonyms?.join(', ') || '',
      Collocations: data.collocations?.join(', ') || '',
      Word_Family: '',
      Etymology: data.etymology || '',
      Hints: apiManager.generateMemoryHint(item.word)
    },
    tags: [
      'vocab-assistant',
      item.context.source.type,
      new Date().toISOString().split('T')[0]
    ].concat(item.metadata.tags || []),
    options: {
      allowDuplicate: false
    }
  };
  
  return note;
}

async function downloadAndStoreAudio(word, audioUrl) {
  try {
    const response = await fetch(audioUrl);
    const audioBlob = await response.blob();
    
    // Convert to base64
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        const filename = `${word}_${Date.now()}.mp3`;
        
        // Store in Anki media folder
        const storeResponse = await fetch('http://localhost:8765', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'storeMediaFile',
            version: 6,
            params: {
              filename: filename,
              data: base64Audio
            }
          })
        });
        
        const result = await storeResponse.json();
        if (result.error) reject(result.error);
        else resolve(filename);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  } catch (error) {
    console.error('Audio download error:', error);
    return null;
  }
}

// ==================== UTILITIES ====================

function detectSourceType(url) {
  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('wikipedia.org')) return 'wikipedia';
  if (url.includes('.pdf')) return 'pdf';
  return 'web';
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message,
    priority: 1
  });
}

async function addSentenceCloze(sentence, tab) {
  // Extract words from sentence
  const words = sentence.trim().split(/\s+/)
    .filter(w => w.length > 3)
    .map(w => w.replace(/[^a-z]/gi, ''));
  
  if (words.length === 0) return { error: 'No valid words found' };
  
  // Add each word to queue
  for (const word of words) {
    await addWordToQueue(word, tab, {
      sentence: sentence,
      tags: ['cloze']
    });
  }
  
  return { success: true, wordsAdded: words.length };
}

// Keyboard shortcut handling
chrome.commands.onCommand.addListener((command) => {
  if (command === 'add-to-queue') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'captureSelection' });
    });
  } else if (command === 'open-library') {
    chrome.tabs.create({ url: chrome.runtime.getURL('library.html') });
  }
});

// Alarm for cache cleanup (daily)
chrome.alarms.create('cleanupCache', { periodInMinutes: 1440 }); // 24 hours

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanupCache') {
    await storage.clearExpiredCache();
  }
});

console.log('Anki Vocabulary Assistant V2 - Background Service Worker loaded');
