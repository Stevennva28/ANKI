// popup.js - Quick Queue View (XSS Safe)
import StorageManager from './utils/storage-manager.js';
import {
  createSafeElement,
  truncate,
  formatTimestamp,
} from './utils/helpers.js';
import {
  SOURCE_ICONS,
  TIMING,
} from './utils/constants.js';

const storage = new StorageManager();
let queue = [];
let statistics = null;

// ==================== INITIALIZATION ====================

async function init() {
  try {
    await storage.init();

    // Load data
    await Promise.all([
      loadQueue(),
      loadStatistics(),
      checkAnkiConnection(),
    ]);

    // Setup event listeners
    setupEventListeners();

    // Auto-refresh every 10 seconds
    setInterval(async () => {
      await loadQueue();
      await loadStatistics();
    }, TIMING.POPUP_REFRESH);

    console.log('Popup initialized');
  } catch (error) {
    console.error('Init error:', error);
    showError('Failed to initialize popup');
  }
}

// ==================== DATA LOADING ====================

async function loadQueue() {
  try {
    const result = await chrome.runtime.sendMessage({
      action: 'getQueue',
      options: { sortBy: 'recent', limit: 10 }
    });

    queue = result || [];
    renderQueue();
  } catch (error) {
    console.error('Error loading queue:', error);
    showError('Failed to load queue');
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

// ==================== RENDERING (XSS SAFE) ====================

function renderQueue() {
  const list = document.getElementById('queueList');
  const countEl = document.getElementById('queueCount');

  // Update count
  countEl.textContent = queue.length.toString();

  // Clear list
  list.textContent = '';

  // Empty state
  if (queue.length === 0) {
    const emptyState = createSafeElement('div', '', 'empty-state');

    const message = createSafeElement('p', 'No words in queue');
    const hint = createSafeElement('small', 'Double-click any word on a webpage to add it');

    emptyState.appendChild(message);
    emptyState.appendChild(hint);
    list.appendChild(emptyState);
    return;
  }

  // Render each queue item
  queue.forEach(item => {
    const itemElement = renderQueueItem(item);
    list.appendChild(itemElement);
  });
}

function renderQueueItem(item) {
  // Main container
  const itemDiv = createSafeElement('div', '', 'queue-item');
  itemDiv.dataset.id = item.id;

  // Header
  const header = createSafeElement('div', '', 'item-header');

  const wordDiv = createSafeElement('div', item.word, 'word');
  const statusDiv = createSafeElement('div', item.status, `status status-${item.status}`);

  header.appendChild(wordDiv);
  header.appendChild(statusDiv);

  // Body
  const body = createSafeElement('div', '', 'item-body');

  // Source
  const sourceDiv = createSafeElement('div', '', 'source');
  const sourceIcon = document.createTextNode(getSourceIcon(item.context?.source?.type) + ' ');
  const sourceTitle = createSafeElement('span', truncate(item.context?.source?.title || 'Unknown', 40));

  sourceDiv.appendChild(sourceIcon);
  sourceDiv.appendChild(sourceTitle);
  body.appendChild(sourceDiv);

  // Preview (if enriched)
  if (item.enrichedData) {
    const preview = createSafeElement('div', '', 'preview');
    const vietnamese = createSafeElement('div', item.enrichedData.vietnamese || '', 'vietnamese');
    preview.appendChild(vietnamese);
    body.appendChild(preview);
  }

  // Actions
  const actions = createSafeElement('div', '', 'item-actions');

  if (item.status === 'pending') {
    const enrichBtn = createSafeElement('button', 'Enrich', 'btn-small btn-primary');
    enrichBtn.setAttribute('aria-label', `Enrich ${item.word}`);
    enrichBtn.onclick = () => enrichItem(item.id);
    actions.appendChild(enrichBtn);
  }

  if (item.status === 'enriched') {
    const addBtn = createSafeElement('button', 'Add to Anki', 'btn-small btn-success');
    addBtn.setAttribute('aria-label', `Add ${item.word} to Anki`);
    addBtn.onclick = () => addItemToAnki(item.id);
    actions.appendChild(addBtn);
  }

  const deleteBtn = createSafeElement('button', 'Delete', 'btn-small btn-danger');
  deleteBtn.setAttribute('aria-label', `Delete ${item.word}`);
  deleteBtn.onclick = () => deleteItem(item.id);
  actions.appendChild(deleteBtn);

  // Assemble
  itemDiv.appendChild(header);
  itemDiv.appendChild(body);
  itemDiv.appendChild(actions);

  return itemDiv;
}

function renderStatistics() {
  if (!statistics) return;

  const todayCount = document.getElementById('todayCount');
  const weekCount = document.getElementById('weekCount');
  const streakCount = document.getElementById('streakCount');

  if (todayCount) todayCount.textContent = (statistics.history?.today || 0).toString();
  if (weekCount) weekCount.textContent = (statistics.history?.week || 0).toString();
  if (streakCount) streakCount.textContent = (statistics.streak || 0).toString();
}

// ==================== ANKI CONNECTION ====================

async function checkAnkiConnection() {
  try {
    const result = await chrome.runtime.sendMessage({
      action: 'checkAnkiConnection'
    });

    const statusEl = document.getElementById('connectionStatus');
    if (!statusEl) return;

    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');

    if (result.connected) {
      dot?.classList.add('connected');
      if (text) text.textContent = `Anki Connected (v${result.version})`;
    } else {
      dot?.classList.remove('connected');
      if (text) text.textContent = 'Anki Not Connected';
    }
  } catch (error) {
    console.error('Error checking Anki:', error);
  }
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  const enrichAllBtn = document.getElementById('enrichAllBtn');
  const addAllBtn = document.getElementById('addAllBtn');
  const openLibraryBtn = document.getElementById('openLibraryBtn');

  if (enrichAllBtn) {
    enrichAllBtn.onclick = enrichAll;
    enrichAllBtn.setAttribute('aria-label', 'Enrich all pending words');
  }

  if (addAllBtn) {
    addAllBtn.onclick = addAllToAnki;
    addAllBtn.setAttribute('aria-label', 'Add all enriched words to Anki');
  }

  if (openLibraryBtn) {
    openLibraryBtn.onclick = openLibrary;
    openLibraryBtn.setAttribute('aria-label', 'Open vocabulary library');
  }
}

// ==================== ACTIONS ====================

async function enrichItem(id) {
  try {
    setButtonLoading(id, 'Enriching...', true);

    const result = await chrome.runtime.sendMessage({
      action: 'enrichWord',
      itemId: id
    });

    if (result.error) {
      throw new Error(result.error.message || result.error);
    }

    await loadQueue();
    showToast('✅ Word enriched successfully', 'success');
  } catch (error) {
    console.error('Error enriching word:', error);
    showToast(`❌ Error: ${error.message}`, 'error');
  }
}

async function addItemToAnki(id) {
  try {
    setButtonLoading(id, 'Adding...', true);

    const result = await chrome.runtime.sendMessage({
      action: 'addToAnki',
      itemId: id
    });

    if (result.error) {
      throw new Error(result.error.message || result.error);
    }

    await Promise.all([loadQueue(), loadStatistics()]);
    showToast('✅ Added to Anki successfully', 'success');
  } catch (error) {
    console.error('Error adding to Anki:', error);
    showToast(`❌ Error: ${error.message}`, 'error');
  }
}

async function deleteItem(id) {
  if (!confirm('Delete this word from queue?')) return;

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'deleteQueueItem',
      id: id
    });

    if (result.error) {
      throw new Error(result.error.message || result.error);
    }

    await loadQueue();
    showToast('🗑️ Word deleted', 'info');
  } catch (error) {
    console.error('Error deleting:', error);
    showToast(`❌ Error: ${error.message}`, 'error');
  }
}

async function enrichAll() {
  const pending = queue.filter(item => item.status === 'pending');
  if (pending.length === 0) {
    showToast('ℹ️ No pending words to enrich', 'warning');
    return;
  }

  const button = document.getElementById('enrichAllBtn');
  if (!button) return;

  button.textContent = '⏳ Enriching...';
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'batchEnrich',
      itemIds: pending.map(item => item.id)
    });

    if (result.error) {
      throw new Error(result.error.message || result.error);
    }

    await loadQueue();

    const { successful, failed, total } = result.summary || {};
    if (failed > 0) {
      showToast(`⚠️ Enriched ${successful}/${total} words (${failed} failed)`, 'warning');
    } else {
      showToast(`✅ Enriched ${successful} words successfully!`, 'success');
    }
  } catch (error) {
    console.error('Error enriching all:', error);
    showToast(`❌ Error: ${error.message}`, 'error');
  } finally {
    button.textContent = '⚡ Enrich All';
    button.disabled = false;
    button.setAttribute('aria-busy', 'false');
  }
}

async function addAllToAnki() {
  const enriched = queue.filter(item => item.status === 'enriched');
  if (enriched.length === 0) {
    showToast('ℹ️ No enriched words to add. Please enrich first.', 'warning');
    return;
  }

  if (!confirm(`Add ${enriched.length} words to Anki?`)) return;

  const button = document.getElementById('addAllBtn');
  if (!button) return;

  button.textContent = '⏳ Adding...';
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'batchAddToAnki',
      itemIds: enriched.map(item => item.id)
    });

    if (result.error) {
      throw new Error(result.error.message || result.error);
    }

    await Promise.all([loadQueue(), loadStatistics()]);

    const { successful, failed, total } = result.summary || {};
    if (failed > 0) {
      showToast(`⚠️ Added ${successful}/${total} words (${failed} failed)`, 'warning');
    } else {
      showToast(`✅ Added ${successful} words to Anki!`, 'success');
    }
  } catch (error) {
    console.error('Error adding all to Anki:', error);
    showToast(`❌ Error: ${error.message}`, 'error');
  } finally {
    button.textContent = '✅ Add All to Anki';
    button.disabled = false;
    button.setAttribute('aria-busy', 'false');
  }
}

function openLibrary() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('library.html')
  });
}

// ==================== UTILITIES ====================

function getSourceIcon(type) {
  return SOURCE_ICONS[type] || SOURCE_ICONS.web;
}

function setButtonLoading(itemId, text, loading) {
  const item = document.querySelector(`[data-id="${itemId}"]`);
  if (!item) return;

  const buttons = item.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.disabled = loading;
    if (loading && btn.textContent.includes('Enrich') || btn.textContent.includes('Add')) {
      btn.textContent = text;
    }
  });
}

function showToast(message, type = 'info') {
  // Create toast element
  const toast = createSafeElement('div', message, `toast toast-${type}`);
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => toast.classList.add('show'), 10);

  // Hide and remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showError(message) {
  const container = document.getElementById('queueList');
  if (!container) return;

  container.textContent = '';
  const errorDiv = createSafeElement('div', message, 'error-message');
  container.appendChild(errorDiv);
}

// ==================== INITIALIZE ====================

document.addEventListener('DOMContentLoaded', init);
