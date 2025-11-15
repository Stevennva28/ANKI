// storage-manager.js - Unified storage management with IndexedDB + Chrome Storage
class StorageManager {
  constructor() {
    this.db = null;
    this.DB_NAME = 'AnkiVocabDB';
    this.DB_VERSION = 1;
    this.initialized = false;
  }

  // Initialize IndexedDB
  async init() {
    if (this.initialized) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Queue store
        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('addedAt', 'addedAt', { unique: false });
          queueStore.createIndex('source', 'metadata.source.type', { unique: false });
          queueStore.createIndex('priority', 'metadata.priority', { unique: false });
        }
        
        // History store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('addedToAnkiAt', 'addedToAnkiAt', { unique: false });
          historyStore.createIndex('deck', 'targetDeck', { unique: false });
          historyStore.createIndex('word', 'word', { unique: false });
        }
        
        // Cache store (for offline definitions/audio)
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'word' });
          cacheStore.createIndex('accessedAt', 'accessedAt', { unique: false });
          cacheStore.createIndex('source', 'source', { unique: false });
        }
      };
    });
  }

  // ==================== QUEUE OPERATIONS ====================
  
  // Add item to queue
  async addToQueue(item) {
    await this.init();
    
    const queueItem = {
      id: this.generateId(),
      word: item.word.toLowerCase().trim(),
      context: {
        sentence: item.sentence || '',
        source: item.source || {},
        surroundingText: item.surroundingText || ''
      },
      status: 'pending', // pending | enriching | enriched | adding | added | error
      enrichedData: null,
      metadata: {
        addedAt: Date.now(),
        priority: item.priority || 'normal',
        tags: item.tags || [],
        userNotes: ''
      },
      targetDeck: await this.getDefaultDeck(),
      error: null
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.add(queueItem);
      
      request.onsuccess = () => {
        this.updateBadge();
        resolve(queueItem);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get all queue items
  async getQueue(options = {}) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        let items = request.result;
        
        // Apply filters
        if (options.status) {
          items = items.filter(item => item.status === options.status);
        }
        
        // Apply sorting
        if (options.sortBy === 'recent') {
          items.sort((a, b) => b.metadata.addedAt - a.metadata.addedAt);
        } else if (options.sortBy === 'priority') {
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          items.sort((a, b) => 
            priorityOrder[b.metadata.priority] - priorityOrder[a.metadata.priority]
          );
        }
        
        // Apply limit
        if (options.limit) {
          items = items.slice(0, options.limit);
        }
        
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get queue item by ID
  async getQueueItem(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Update queue item
  async updateQueueItem(id, updates) {
    await this.init();
    
    const item = await this.getQueueItem(id);
    if (!item) throw new Error('Item not found');
    
    const updatedItem = { ...item, ...updates };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.put(updatedItem);
      
      request.onsuccess = () => {
        this.updateBadge();
        resolve(updatedItem);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Delete queue item
  async deleteQueueItem(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.delete(id);
      
      request.onsuccess = () => {
        this.updateBadge();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all queue items
  async clearQueue() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.clear();
      
      request.onsuccess = () => {
        this.updateBadge();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get queue count
  async getQueueCount(status = null) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      
      if (status) {
        const index = store.index('status');
        const request = index.count(status);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }

  // ==================== HISTORY OPERATIONS ====================
  
  // Add to history (when added to Anki)
  async addToHistory(queueItem) {
    await this.init();
    
    const historyItem = {
      ...queueItem,
      addedToAnkiAt: Date.now(),
      id: this.generateId() // New ID for history
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.add(historyItem);
      
      request.onsuccess = () => resolve(historyItem);
      request.onerror = () => reject(request.error);
    });
  }

  // Get history
  async getHistory(options = {}) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const request = store.getAll();
      
      request.onsuccess = () => {
        let items = request.result;
        
        // Apply filters
        if (options.deck) {
          items = items.filter(item => item.targetDeck === options.deck);
        }
        
        if (options.dateFrom) {
          items = items.filter(item => item.addedToAnkiAt >= options.dateFrom);
        }
        
        if (options.dateTo) {
          items = items.filter(item => item.addedToAnkiAt <= options.dateTo);
        }
        
        // Sort by most recent
        items.sort((a, b) => b.addedToAnkiAt - a.addedToAnkiAt);
        
        // Apply limit
        if (options.limit) {
          items = items.slice(0, options.limit);
        }
        
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Search history
  async searchHistory(query) {
    const history = await this.getHistory();
    const lowerQuery = query.toLowerCase();
    
    return history.filter(item => 
      item.word.toLowerCase().includes(lowerQuery) ||
      item.enrichedData?.definition?.toLowerCase().includes(lowerQuery) ||
      item.context.sentence?.toLowerCase().includes(lowerQuery)
    );
  }

  // ==================== CACHE OPERATIONS ====================
  
  // Cache definition/audio
  async cacheData(word, data, source) {
    await this.init();
    
    const cacheItem = {
      word: word.toLowerCase().trim(),
      data: data,
      source: source,
      accessedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(cacheItem);
      
      request.onsuccess = () => resolve(cacheItem);
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached data
  async getCachedData(word) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(word.toLowerCase().trim());
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiresAt > Date.now()) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear expired cache
  async clearExpiredCache() {
    await this.init();
    const now = Date.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.expiresAt < now) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== SETTINGS (Chrome Storage) ====================
  
  // Get settings
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('settings', (result) => {
        resolve(result.settings || this.getDefaultSettings());
      });
    });
  }

  // Save settings
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ settings }, resolve);
    });
  }

  // Get default settings
  getDefaultSettings() {
    return {
      // API Keys
      oxfordAppId: '',
      oxfordAppKey: '',
      forvoApiKey: '',
      
      // Default deck
      defaultDeck: 'English::Vocabulary',
      
      // Dictionary preferences
      dictionaryPriority: ['oxford', 'cambridge', 'merriam-webster', 'free'],
      
      // Audio preferences
      audioPriority: ['forvo', 'oxford', 'cambridge', 'google-tts'],
      preferUsAudio: true,
      downloadBothAccents: false,
      
      // Auto-enrich settings
      autoEnrichOnAdd: true,
      enrichDelay: 2000, // 2 seconds
      
      // Card types to create
      cardTypes: {
        recognition: true,
        production: true,
        audio: true,
        cloze: true,
        visual: false,
        listening: false,
        spelling: false
      },
      
      // UI preferences
      showNotifications: true,
      autoPlayAudio: true,
      highlightSubtitles: true,
      darkMode: 'auto', // auto | light | dark
      
      // Advanced
      cacheEnabled: true,
      offlineMode: false,
      batchSize: 10,
      
      // Statistics
      trackStatistics: true
    };
  }

  // Get default deck
  async getDefaultDeck() {
    const settings = await this.getSettings();
    return settings.defaultDeck;
  }

  // ==================== STATISTICS ====================
  
  // Get statistics
  async getStatistics() {
    const queue = await this.getQueue();
    const history = await this.getHistory();
    const today = new Date().setHours(0, 0, 0, 0);
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    return {
      queue: {
        total: queue.length,
        pending: queue.filter(i => i.status === 'pending').length,
        enriched: queue.filter(i => i.status === 'enriched').length
      },
      history: {
        total: history.length,
        today: history.filter(i => i.addedToAnkiAt >= today).length,
        week: history.filter(i => i.addedToAnkiAt >= weekAgo).length
      },
      sources: this.calculateSourceStats(queue.concat(history)),
      decks: this.calculateDeckStats(history),
      streak: await this.calculateStreak(history)
    };
  }

  // Calculate source statistics
  calculateSourceStats(items) {
    const sources = {};
    items.forEach(item => {
      const source = item.context?.source?.type || 'unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    return sources;
  }

  // Calculate deck statistics
  calculateDeckStats(items) {
    const decks = {};
    items.forEach(item => {
      const deck = item.targetDeck || 'Unknown';
      decks[deck] = (decks[deck] || 0) + 1;
    });
    return decks;
  }

  // Calculate learning streak
  async calculateStreak(history) {
    if (!history || history.length === 0) return 0;
    
    const days = new Set();
    history.forEach(item => {
      const date = new Date(item.addedToAnkiAt).toDateString();
      days.add(date);
    });
    
    let streak = 0;
    let currentDate = new Date();
    
    while (true) {
      const dateStr = currentDate.toDateString();
      if (days.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (streak === 0 && dateStr === new Date().toDateString()) {
        // Today might not have activity yet
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  // ==================== UTILITIES ====================
  
  // Generate unique ID
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update extension badge
  async updateBadge() {
    try {
      const count = await this.getQueueCount('pending');
      if (typeof chrome !== 'undefined' && chrome.action) {
        chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
        chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
      }
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }

  // Export data (for backup)
  async exportData() {
    await this.init();
    
    const queue = await this.getQueue();
    const history = await this.getHistory();
    const settings = await this.getSettings();
    
    return {
      version: '2.0.0',
      exportedAt: Date.now(),
      queue,
      history,
      settings
    };
  }

  // Import data (from backup)
  async importData(data) {
    await this.init();
    
    // Clear existing data
    await this.clearQueue();
    
    // Import queue
    if (data.queue) {
      for (const item of data.queue) {
        await this.addToQueue(item);
      }
    }
    
    // Import history
    if (data.history) {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      for (const item of data.history) {
        store.add(item);
      }
    }
    
    // Import settings
    if (data.settings) {
      await this.saveSettings(data.settings);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
