// library.js - Vocabulary Library Dashboard with Field Mapping
import StorageManager from './utils/storage-manager.js';
import {
  createSafeElement,
  formatTimestamp,
  truncate,
} from './utils/helpers.js';
import {
  SOURCE_ICONS,
  ANKI,
  DEFAULT_FIELD_MAPPING,
} from './utils/constants.js';

const storage = new StorageManager();
let currentTab = 'queue';
let settings = {};
let ankiModels = [];
let currentModelFields = [];

// ==================== INITIALIZATION ====================

async function init() {
  try {
    await storage.init();

    // Load settings first
    settings = await chrome.runtime.sendMessage({ action: 'getSettings' });

    // Setup tabs
    setupTabs();

    // Load initial data
    await loadQueue();
    await loadHistory();
    await loadAnalytics();
    await loadSettingsUI();

    // Load Anki data for field mapping
    await loadAnkiData();

    console.log('Library initialized');
  } catch (error) {
    console.error('Init error:', error);
    showToast('Failed to initialize library', 'error');
  }
}

// ==================== TABS ====================

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

  // Update content
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tabName)?.classList.add('active');

  currentTab = tabName;

  // Reload data for active tab
  if (tabName === 'queue') loadQueue();
  else if (tabName === 'history') loadHistory();
  else if (tabName === 'analytics') loadAnalytics();
  else if (tabName === 'settings') loadSettingsUI();
}

// ==================== QUEUE TAB ====================

async function loadQueue() {
  try {
    const queue = await chrome.runtime.sendMessage({ action: 'getQueue' });
    renderQueue(queue || []);
  } catch (error) {
    console.error('Error loading queue:', error);
    showError('queueContent', 'Failed to load queue');
  }
}

function renderQueue(queue) {
  const content = document.getElementById('queueContent');
  content.textContent = '';

  if (queue.length === 0) {
    const empty = createSafeElement('div', '', 'empty-state');
    const message = createSafeElement('p', 'No words in queue');
    const hint = createSafeElement('small', 'Double-click words on any webpage to add them');
    empty.appendChild(message);
    empty.appendChild(hint);
    content.appendChild(empty);
    return;
  }

  const grid = createSafeElement('div', '', 'word-grid');

  queue.forEach(item => {
    const card = createQueueCard(item);
    grid.appendChild(card);
  });

  content.appendChild(grid);
}

function createQueueCard(item) {
  const card = createSafeElement('div', '', 'word-card');
  card.dataset.id = item.id;

  // Header
  const header = createSafeElement('div', '', 'card-header');
  const word = createSafeElement('h3', item.word);
  const status = createSafeElement('span', item.status, `badge badge-${item.status}`);
  header.appendChild(word);
  header.appendChild(status);

  // Body
  const body = createSafeElement('div', '', 'card-body');

  if (item.context?.sentence) {
    const sentence = createSafeElement('p', truncate(item.context.sentence, 100), 'sentence');
    body.appendChild(sentence);
  }

  if (item.enrichedData?.vietnamese) {
    const vietnamese = createSafeElement('p', item.enrichedData.vietnamese, 'vietnamese');
    body.appendChild(vietnamese);
  }

  // Source
  const source = createSafeElement('small', '', 'source');
  const icon = document.createTextNode((SOURCE_ICONS[item.context?.source?.type] || '🌐') + ' ');
  const title = createSafeElement('span', truncate(item.context?.source?.title || 'Unknown', 30));
  source.appendChild(icon);
  source.appendChild(title);
  body.appendChild(source);

  // Footer Actions
  const footer = createSafeElement('div', '', 'card-footer');

  if (item.status === 'pending') {
    const enrichBtn = createSafeElement('button', 'Enrich', 'btn btn-sm btn-primary');
    enrichBtn.onclick = () => enrichQueueItem(item.id);
    footer.appendChild(enrichBtn);
  }

  if (item.status === 'enriched') {
    const addBtn = createSafeElement('button', 'Add to Anki', 'btn btn-sm btn-success');
    addBtn.onclick = () => addQueueItemToAnki(item.id);
    footer.appendChild(addBtn);
  }

  const deleteBtn = createSafeElement('button', 'Delete', 'btn btn-sm btn-danger');
  deleteBtn.onclick = () => deleteQueueItem(item.id);
  footer.appendChild(deleteBtn);

  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(footer);

  return card;
}

async function enrichQueueItem(id) {
  try {
    await chrome.runtime.sendMessage({ action: 'enrichWord', itemId: id });
    await loadQueue();
    showToast('✅ Word enriched successfully', 'success');
  } catch (error) {
    showToast('❌ Error enriching word', 'error');
  }
}

async function addQueueItemToAnki(id) {
  try {
    await chrome.runtime.sendMessage({ action: 'addToAnki', itemId: id });
    await Promise.all([loadQueue(), loadHistory(), loadAnalytics()]);
    showToast('✅ Added to Anki successfully', 'success');
  } catch (error) {
    showToast('❌ Error adding to Anki', 'error');
  }
}

async function deleteQueueItem(id) {
  if (!confirm('Delete this word?')) return;

  try {
    await chrome.runtime.sendMessage({ action: 'deleteQueueItem', id });
    await loadQueue();
    showToast('🗑️ Word deleted', 'info');
  } catch (error) {
    showToast('❌ Error deleting word', 'error');
  }
}

// ==================== HISTORY TAB ====================

async function loadHistory() {
  try {
    const history = await chrome.runtime.sendMessage({ action: 'getHistory' });
    renderHistory(history || []);
  } catch (error) {
    console.error('Error loading history:', error);
    showError('historyContent', 'Failed to load history');
  }
}

function renderHistory(history) {
  const content = document.getElementById('historyContent');
  content.textContent = '';

  if (history.length === 0) {
    const empty = createSafeElement('div', '', 'empty-state');
    const message = createSafeElement('p', 'No words in history');
    empty.appendChild(message);
    content.appendChild(empty);
    return;
  }

  const grid = createSafeElement('div', '', 'word-grid');

  history.slice(0, 50).forEach(item => {
    const card = createHistoryCard(item);
    grid.appendChild(card);
  });

  content.appendChild(grid);
}

function createHistoryCard(item) {
  const card = createSafeElement('div', '', 'word-card history-card');

  const word = createSafeElement('h3', item.word);
  const vietnamese = createSafeElement('p', item.enrichedData?.vietnamese || '', 'vietnamese');
  const date = createSafeElement('small', formatTimestamp(item.addedToAnkiAt), 'date');

  card.appendChild(word);
  card.appendChild(vietnamese);
  card.appendChild(date);

  return card;
}

// ==================== ANALYTICS TAB ====================

async function loadAnalytics() {
  try {
    const stats = await chrome.runtime.sendMessage({ action: 'getStatistics' });
    renderAnalytics(stats || {});
  } catch (error) {
    console.error('Error loading analytics:', error);
    showError('statsGrid', 'Failed to load analytics');
  }
}

function renderAnalytics(stats) {
  const grid = document.getElementById('statsGrid');
  grid.textContent = '';

  const statCards = [
    { label: 'In Queue', value: stats.queue?.total || 0, color: 'blue' },
    { label: 'Added Today', value: stats.history?.today || 0, color: 'green' },
    { label: 'This Week', value: stats.history?.week || 0, color: 'purple' },
    { label: 'Day Streak', value: stats.streak || 0, color: 'orange' },
    { label: 'Total Words', value: stats.history?.total || 0, color: 'teal' },
  ];

  statCards.forEach(stat => {
    const card = createStatCard(stat);
    grid.appendChild(card);
  });
}

function createStatCard(stat) {
  const card = createSafeElement('div', '', `stat-card stat-${stat.color}`);
  const value = createSafeElement('div', stat.value.toString(), 'stat-value');
  const label = createSafeElement('div', stat.label, 'stat-label');

  card.appendChild(value);
  card.appendChild(label);

  return card;
}

// ==================== SETTINGS TAB ====================

async function loadSettingsUI() {
  try {
    settings = await chrome.runtime.sendMessage({ action: 'getSettings' });

    // Load API settings
    document.getElementById('oxfordAppId').value = settings.oxfordAppId || '';
    document.getElementById('oxfordAppKey').value = settings.oxfordAppKey || '';
    document.getElementById('forvoApiKey').value = settings.forvoApiKey || '';

    // Load Anki settings
    document.getElementById('defaultDeck').value = settings.defaultDeck || ANKI.DEFAULT_DECK;
    document.getElementById('noteType').value = settings.noteType || '';

    // Load UI preferences
    document.getElementById('darkMode').checked = settings.darkMode || false;
    document.getElementById('showNotifications').checked = settings.showNotifications !== false;
    document.getElementById('autoEnrich').checked = settings.autoEnrichOnAdd || false;

  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  try {
    const button = document.getElementById('saveSettingsBtn');
    button.disabled = true;
    button.textContent = 'Saving...';

    const newSettings = {
      ...settings,
      // API settings
      oxfordAppId: document.getElementById('oxfordAppId').value,
      oxfordAppKey: document.getElementById('oxfordAppKey').value,
      forvoApiKey: document.getElementById('forvoApiKey').value,

      // Anki settings
      defaultDeck: document.getElementById('defaultDeck').value,
      noteType: document.getElementById('noteType').value,

      // UI preferences
      darkMode: document.getElementById('darkMode').checked,
      showNotifications: document.getElementById('showNotifications').checked,
      autoEnrichOnAdd: document.getElementById('autoEnrich').checked,
    };

    await chrome.runtime.sendMessage({ action: 'saveSettings', settings: newSettings });
    settings = newSettings;

    // Apply dark mode
    applyDarkMode(settings.darkMode);

    showToast('✅ Settings saved successfully', 'success');
  } catch (error) {
    showToast('❌ Error saving settings', 'error');
  } finally {
    const button = document.getElementById('saveSettingsBtn');
    button.disabled = false;
    button.textContent = 'Save Settings';
  }
}

// ==================== FIELD MAPPING (KEY FEATURE!) ====================

async function loadAnkiData() {
  try {
    // Load decks
    const deckResult = await chrome.runtime.sendMessage({ action: 'getAnkiDecks' });
    if (deckResult.decks) {
      populateDeckSelect(deckResult.decks);
    }

    // Load models (note types)
    const modelResult = await chrome.runtime.sendMessage({ action: 'getAnkiModels' });
    if (modelResult.models) {
      ankiModels = modelResult.models;
      populateNoteTypeSelect(ankiModels);
    }

    // If note type is already selected, load field mapping
    if (settings.noteType) {
      await loadFieldMapping(settings.noteType);
    }

  } catch (error) {
    console.error('Error loading Anki data:', error);
    showAnkiError();
  }
}

function populateDeckSelect(decks) {
  const select = document.getElementById('defaultDeck');
  if (!select) return;

  select.textContent = '';

  decks.forEach(deck => {
    const option = document.createElement('option');
    option.value = deck;
    option.textContent = deck;
    select.appendChild(option);
  });

  if (settings.defaultDeck) {
    select.value = settings.defaultDeck;
  }
}

function populateNoteTypeSelect(models) {
  const select = document.getElementById('noteType');
  if (!select) return;

  select.textContent = '';

  // Add empty option
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '-- Select Note Type --';
  select.appendChild(emptyOption);

  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    select.appendChild(option);
  });

  if (settings.noteType) {
    select.value = settings.noteType;
  }

  // Listen for changes
  select.addEventListener('change', async (e) => {
    const modelName = e.target.value;
    if (modelName) {
      await loadFieldMapping(modelName);
    } else {
      clearFieldMapping();
    }
  });
}

async function loadFieldMapping(modelName) {
  try {
    const result = await chrome.runtime.sendMessage({
      action: 'getModelFields',
      modelName
    });

    if (result.error) {
      showToast('❌ Error loading fields', 'error');
      return;
    }

    currentModelFields = result.fields;

    // Use saved mapping or create new one
    const mapping = settings.fieldMapping || {};

    renderFieldMapping(currentModelFields, mapping);
  } catch (error) {
    console.error('Error loading field mapping:', error);
    showToast('❌ Error loading field mapping', 'error');
  }
}

function renderFieldMapping(fields, currentMapping) {
  const container = document.getElementById('fieldMappingContainer');
  const tbody = document.getElementById('fieldMappingBody');

  if (!container || !tbody) return;

  // Show container
  container.style.display = 'block';

  // Clear table
  tbody.textContent = '';

  // Extension fields that can be mapped
  const extensionFields = {
    '': '-- Not Mapped --',
    'word': 'Word (English)',
    'ipa': 'IPA Pronunciation',
    'vietnamese': 'Vietnamese Translation',
    'partOfSpeech': 'Part of Speech',
    'audio': 'Audio File',
    'exampleEn': 'English Example',
    'exampleVn': 'Vietnamese Example',
    'definition': 'English Definition',
    'image': 'Image',
    'synonyms': 'Synonyms',
    'antonyms': 'Antonyms',
    'collocations': 'Collocations',
    'wordFamily': 'Word Family',
    'etymology': 'Etymology',
    'hints': 'Memory Hints',
  };

  fields.forEach(ankiField => {
    const row = document.createElement('tr');

    // Anki field name
    const nameCell = document.createElement('td');
    nameCell.textContent = ankiField;
    nameCell.className = 'field-name';

    // Arrow
    const arrowCell = document.createElement('td');
    arrowCell.textContent = '→';
    arrowCell.className = 'arrow';

    // Extension field dropdown
    const selectCell = document.createElement('td');
    const select = document.createElement('select');
    select.className = 'field-select';
    select.dataset.ankiField = ankiField;

    Object.entries(extensionFields).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;

      // Select current mapping
      if (currentMapping[ankiField] === value) {
        option.selected = true;
      }

      select.appendChild(option);
    });

    selectCell.appendChild(select);

    // Preview
    const previewCell = document.createElement('td');
    const preview = createSafeElement('span', getFieldPreview(currentMapping[ankiField]), 'field-preview');
    previewCell.appendChild(preview);

    // Update preview on change
    select.addEventListener('change', () => {
      preview.textContent = getFieldPreview(select.value);
    });

    row.appendChild(nameCell);
    row.appendChild(arrowCell);
    row.appendChild(selectCell);
    row.appendChild(previewCell);

    tbody.appendChild(row);
  });
}

function getFieldPreview(fieldType) {
  const previews = {
    'word': 'example',
    'ipa': '/ɪɡˈzæmpəl/',
    'vietnamese': 'ví dụ',
    'partOfSpeech': 'noun',
    'audio': '[sound:example.mp3]',
    'exampleEn': 'This is an example sentence.',
    'exampleVn': 'Đây là một câu ví dụ.',
    'definition': 'A representative form or pattern.',
    'image': '[image]',
    'synonyms': 'instance, case, sample',
    'antonyms': 'rule, law',
    'collocations': 'for example, give example',
    'wordFamily': 'exemplify (v), exemplary (adj)',
    'etymology': 'From Latin exemplum',
    'hints': 'Prefix "ex-" = out',
  };

  return previews[fieldType] || '';
}

function clearFieldMapping() {
  const container = document.getElementById('fieldMappingContainer');
  const tbody = document.getElementById('fieldMappingBody');

  if (container) container.style.display = 'none';
  if (tbody) tbody.textContent = '';
}

async function autoDetectFieldMapping() {
  if (currentModelFields.length === 0) {
    showToast('⚠️ Please select a note type first', 'warning');
    return;
  }

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'suggestFieldMapping',
      modelFields: currentModelFields
    });

    if (result.error) {
      showToast('❌ Error auto-detecting fields', 'error');
      return;
    }

    // Update dropdowns
    const tbody = document.getElementById('fieldMappingBody');
    const selects = tbody.querySelectorAll('select');

    selects.forEach(select => {
      const ankiField = select.dataset.ankiField;
      const suggestedValue = result.mapping[ankiField];

      if (suggestedValue) {
        select.value = suggestedValue;
        // Trigger change event to update preview
        select.dispatchEvent(new Event('change'));
      }
    });

    showToast('✅ Field mapping auto-detected!', 'success');
  } catch (error) {
    console.error('Error auto-detecting:', error);
    showToast('❌ Error auto-detecting fields', 'error');
  }
}

function resetFieldMapping() {
  if (!confirm('Reset field mapping to default?')) return;

  renderFieldMapping(currentModelFields, DEFAULT_FIELD_MAPPING);
  showToast('↺ Field mapping reset', 'info');
}

async function saveFieldMapping() {
  const noteType = document.getElementById('noteType').value;

  if (!noteType) {
    showToast('⚠️ Please select a note type', 'warning');
    return;
  }

  try {
    // Collect mapping from table
    const mapping = {};
    const selects = document.querySelectorAll('#fieldMappingBody select');

    selects.forEach(select => {
      const ankiField = select.dataset.ankiField;
      const extensionField = select.value;

      if (extensionField) {
        mapping[ankiField] = extensionField;
      }
    });

    // Validate mapping
    const validation = await chrome.runtime.sendMessage({
      action: 'validateFieldMapping',
      mapping,
      modelFields: currentModelFields
    });

    if (!validation.valid) {
      showToast(`❌ Invalid mapping: ${validation.error}`, 'error');
      return;
    }

    // Save to settings
    settings.fieldMapping = mapping;
    settings.noteType = noteType;

    await chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings
    });

    showToast('✅ Field mapping saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving field mapping:', error);
    showToast('❌ Error saving field mapping', 'error');
  }
}

function showAnkiError() {
  const container = document.getElementById('ankiConfigSection');
  if (!container) return;

  const error = createSafeElement('div', '', 'alert alert-error');
  const message = createSafeElement('p', '⚠️ Cannot connect to Anki');
  const hint = createSafeElement('small', 'Please ensure Anki is running with AnkiConnect installed');

  error.appendChild(message);
  error.appendChild(hint);

  container.prepend(error);
}

// ==================== UTILITIES ====================

function showToast(message, type = 'info') {
  const toast = createSafeElement('div', message, `toast toast-${type}`);
  toast.setAttribute('role', 'alert');

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.textContent = '';
  const error = createSafeElement('div', message, 'error-message');
  container.appendChild(error);
}

function applyDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

// ==================== EVENT LISTENERS ====================

// Settings buttons
document.addEventListener('DOMContentLoaded', () => {
  init();

  // Save settings button
  const saveBtn = document.getElementById('saveSettingsBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveSettings);

  // Field mapping buttons
  const autoDetectBtn = document.getElementById('autoDetectBtn');
  if (autoDetectBtn) autoDetectBtn.addEventListener('click', autoDetectFieldMapping);

  const resetBtn = document.getElementById('resetMappingBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetFieldMapping);

  const saveMappingBtn = document.getElementById('saveMappingBtn');
  if (saveMappingBtn) saveMappingBtn.addEventListener('click', saveFieldMapping);

  // Refresh Anki data
  const refreshBtn = document.getElementById('refreshAnkiBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', loadAnkiData);
});
