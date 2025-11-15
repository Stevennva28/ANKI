// popup.js - Quick Queue View
const storage = new StorageManager();
let queue = [];
let statistics = null;

async function init() {
  await storage.init();
  
  // Load data
  await loadQueue();
  await loadStatistics();
  await checkAnkiConnection();
  
  // Setup event listeners
  setupEventListeners();
  
  // Auto-refresh every 10 seconds
  setInterval(loadQueue, 10000);
}

async function loadQueue() {
  try {
    queue = await chrome.runtime.sendMessage({
      action: 'getQueue',
      options: { sortBy: 'recent', limit: 10 }
    });
    
    renderQueue();
  } catch (error) {
    console.error('Error loading queue:', error);
  }
}

async function loadStatistics() {
  try {
    statistics = await chrome.runtime.sendMessage({
      action: 'getStatistics'
    });
    
    renderStatistics();
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

function renderQueue() {
  const list = document.getElementById('queueList');
  document.getElementById('queueCount').textContent = queue.length;
  
  if (queue.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No words in queue</p>
        <small>Double-click any word on a webpage to add it</small>
      </div>
    `;
    return;
  }
  
  list.innerHTML = queue.map(item => `
    <div class="queue-item" data-id="${item.id}">
      <div class="item-header">
        <div class="word">${item.word}</div>
        <div class="status status-${item.status}">${item.status}</div>
      </div>
      <div class="item-body">
        <div class="source">
          ${getSourceIcon(item.context.source.type)} ${item.context.source.title.substring(0, 40)}...
        </div>
        ${item.enrichedData ? `
          <div class="preview">
            <div class="vietnamese">${item.enrichedData.vietnamese}</div>
          </div>
        ` : ''}
      </div>
      <div class="item-actions">
        ${item.status === 'pending' ? `
          <button class="btn-small btn-primary" onclick="enrichItem('${item.id}')">Enrich</button>
        ` : ''}
        ${item.status === 'enriched' ? `
          <button class="btn-small btn-success" onclick="addItemToAnki('${item.id}')">Add to Anki</button>
        ` : ''}
        <button class="btn-small btn-danger" onclick="deleteItem('${item.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderStatistics() {
  if (!statistics) return;
  
  document.getElementById('todayCount').textContent = statistics.history.today;
  document.getElementById('weekCount').textContent = statistics.history.week;
  document.getElementById('streakCount').textContent = statistics.streak;
}

async function checkAnkiConnection() {
  try {
    const result = await chrome.runtime.sendMessage({
      action: 'checkAnkiConnection'
    });
    
    const statusEl = document.getElementById('connectionStatus');
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');
    
    if (result.connected) {
      dot.classList.add('connected');
      text.textContent = `Anki Connected (v${result.version})`;
    } else {
      dot.classList.remove('connected');
      text.textContent = 'Anki Not Connected';
    }
  } catch (error) {
    console.error('Error checking Anki:', error);
  }
}

function setupEventListeners() {
  document.getElementById('enrichAllBtn').onclick = enrichAll;
  document.getElementById('addAllBtn').onclick = addAllToAnki;
  document.getElementById('openLibraryBtn').onclick = openLibrary;
}

async function enrichItem(id) {
  try {
    await chrome.runtime.sendMessage({
      action: 'enrichWord',
      itemId: id
    });
    
    await loadQueue();
  } catch (error) {
    alert('Error enriching word: ' + error.message);
  }
}

async function addItemToAnki(id) {
  try {
    await chrome.runtime.sendMessage({
      action: 'addToAnki',
      itemId: id
    });
    
    await loadQueue();
    await loadStatistics();
  } catch (error) {
    alert('Error adding to Anki: ' + error.message);
  }
}

async function deleteItem(id) {
  if (!confirm('Delete this word from queue?')) return;
  
  try {
    await chrome.runtime.sendMessage({
      action: 'deleteQueueItem',
      id: id
    });
    
    await loadQueue();
  } catch (error) {
    alert('Error deleting: ' + error.message);
  }
}

async function enrichAll() {
  const pending = queue.filter(item => item.status === 'pending');
  if (pending.length === 0) {
    alert('No pending words to enrich');
    return;
  }
  
  document.getElementById('enrichAllBtn').textContent = 'Enriching...';
  document.getElementById('enrichAllBtn').disabled = true;
  
  try {
    await chrome.runtime.sendMessage({
      action: 'batchEnrich',
      itemIds: pending.map(item => item.id)
    });
    
    await loadQueue();
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    document.getElementById('enrichAllBtn').textContent = '⚡ Enrich All';
    document.getElementById('enrichAllBtn').disabled = false;
  }
}

async function addAllToAnki() {
  const enriched = queue.filter(item => item.status === 'enriched');
  if (enriched.length === 0) {
    alert('No enriched words to add. Please enrich first.');
    return;
  }
  
  if (!confirm(`Add ${enriched.length} words to Anki?`)) return;
  
  document.getElementById('addAllBtn').textContent = 'Adding...';
  document.getElementById('addAllBtn').disabled = true;
  
  try {
    await chrome.runtime.sendMessage({
      action: 'batchAddToAnki',
      itemIds: enriched.map(item => item.id)
    });
    
    await loadQueue();
    await loadStatistics();
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    document.getElementById('addAllBtn').textContent = '✅ Add All to Anki';
    document.getElementById('addAllBtn').disabled = false;
  }
}

function openLibrary() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('library.html')
  });
}

function getSourceIcon(type) {
  const icons = {
    youtube: '🎥',
    wikipedia: '📖',
    article: '📰',
    pdf: '📄',
    web: '🌐'
  };
  return icons[type] || icons.web;
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
