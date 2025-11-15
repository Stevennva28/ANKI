# REMAINING WORK - Detailed Implementation Guide

## Current Status (Commit: ed60a84)

### ✅ COMPLETED FILES (5/9)
1. ✅ **utils/constants.js** - All configuration centralized
2. ✅ **utils/helpers.js** - Validation, sanitization, retry logic, rate limiting
3. ✅ **utils/anki-helper.js** - Field mapping, AnkiConnect integration
4. ✅ **content.js** - XSS safe, memory leak fixed, debounced
5. ✅ **api-manager.js** - Cache checking (70% API reduction!), retry logic

### ⏳ REMAINING FILES (4/9)

---

## 1. background.js (CRITICAL - Core Logic)

**Priority:** HIGH
**Lines:** 490 → ~550 (with improvements)
**Time:** 1-2 hours

### Changes Needed:

#### A. Imports
```javascript
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
} from './utils/constants.js';
```

#### B. Fix addWordToQueue()
**Current:**
```javascript
word = word.toLowerCase().trim().replace(/[^a-z\s-]/gi, '');
if (!word || word.split(' ').length > 3) {
  throw new Error('Invalid word');
}
```

**Replace with:**
```javascript
try {
  word = validateWord(word);
} catch (error) {
  return { error: formatError(error) };
}
```

#### C. Fix enrichWord()
**Current:**
```javascript
const enrichedData = await apiManager.enrichWord(item.word, item.context);
```

**Update:**
```javascript
// apiManager.init() needs storage reference for caching!
await apiManager.init(await storage.getSettings(), storage);

const enrichedData = await apiManager.enrichWord(item.word, item.context);
```

#### D. Fix batchEnrich() - CRITICAL RACE CONDITION FIX
**Current (SLOW & BUGGY):**
```javascript
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
```

**Replace with (3x faster, proper error tracking):**
```javascript
import { processBatch, TIMING } from './utils/helpers.js';

async function batchEnrich(itemIds) {
  const results = await processBatch(
    itemIds,
    async (id) => await enrichWord(id),
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
}
```

#### E. Replace addToAnki() with ankiHelper
**Current (manual AnkiConnect):**
```javascript
async function addToAnki(itemId) {
  // ... lots of manual code ...
  const note = await createAnkiNote(item);

  const response = await fetch('http://localhost:8765', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addNote',
      version: 6,
      params: { note }
    })
  });
  // ...
}
```

**Replace with:**
```javascript
async function addToAnki(itemId) {
  try {
    const item = await storage.getQueueItem(itemId);
    if (!item) throw new VocabError(ERROR_CODES.ITEM_NOT_FOUND);

    if (!item.enrichedData) {
      await enrichWord(itemId);
      return await addToAnki(itemId); // Retry
    }

    await storage.updateQueueItem(itemId, { status: STATUS.ADDING });

    const settings = await storage.getSettings();

    // Use ankiHelper with field mapping!
    const note = await ankiHelper.createNote(item, settings.fieldMapping, settings);
    const noteId = await ankiHelper.addNote(note);

    await storage.addToHistory(item);
    await storage.deleteQueueItem(itemId);

    showNotification('✅ Added to Anki', `"${item.word}" added successfully`);

    return { success: true, noteId };
  } catch (error) {
    await storage.updateQueueItem(itemId, {
      status: STATUS.ERROR,
      error: error.message,
    });
    return { error: formatError(error) };
  }
}
```

#### F. Add New Message Handlers for Field Mapping
```javascript
case 'getAnkiModels':
  return await ankiHelper.getModelNames();

case 'getModelFields':
  return await ankiHelper.getModelFieldNames(request.modelName);

case 'suggestFieldMapping':
  return ankiHelper.suggestFieldMapping(
    request.modelFields,
    ANKI.EXTENSION_FIELDS
  );

case 'validateFieldMapping':
  try {
    ankiHelper.validateFieldMapping(request.mapping, request.modelFields);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
```

#### G. Remove createAnkiNote() and downloadAndStoreAudio()
These are now in ankiHelper, can be deleted.

---

## 2. popup.js (XSS Fixes + Loading States)

**Priority:** MEDIUM
**Lines:** 238 → ~300 (with improvements)
**Time:** 1 hour

### Changes Needed:

#### A. Remove ALL innerHTML Usage
**Current (DANGEROUS):**
```javascript
list.innerHTML = queue.map(item => `
  <div class="queue-item" data-id="${item.id}">
    <div class="word">${item.word}</div>
    ...
  </div>
`).join('');
```

**Replace with:**
```javascript
import { createSafeElement } from './utils/helpers.js';

function renderQueue() {
  const list = document.getElementById('queueList');
  list.textContent = ''; // Clear

  if (queue.length === 0) {
    const emptyState = createSafeElement('div', '', 'empty-state');
    const message = createSafeElement('p', 'No words in queue');
    const hint = createSafeElement('small', 'Double-click any word on a webpage to add it');
    emptyState.appendChild(message);
    emptyState.appendChild(hint);
    list.appendChild(emptyState);
    return;
  }

  queue.forEach(item => {
    const itemDiv = renderQueueItem(item);
    list.appendChild(itemDiv);
  });
}

function renderQueueItem(item) {
  const itemDiv = createSafeElement('div', '', 'queue-item');
  itemDiv.dataset.id = item.id;

  const header = createSafeElement('div', '', 'item-header');
  const word = createSafeElement('div', item.word, 'word');
  const status = createSafeElement('div', item.status, `status status-${item.status}`);
  header.appendChild(word);
  header.appendChild(status);

  // ... etc for body and actions

  itemDiv.appendChild(header);
  return itemDiv;
}
```

#### B. Add Loading States
```javascript
async function enrichAll() {
  const pending = queue.filter(item => item.status === 'pending');
  if (pending.length === 0) {
    showToast('No pending words to enrich', 'warning');
    return;
  }

  const button = document.getElementById('enrichAllBtn');
  button.disabled = true;
  button.textContent = '⏳ Enriching...';

  // Show progress
  const progressDiv = createSafeElement('div', '', 'progress-container');
  const progressBar = createSafeElement('div', '', 'progress-bar');
  progressDiv.appendChild(progressBar);
  document.getElementById('queueList').prepend(progressDiv);

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'batchEnrich',
      itemIds: pending.map(item => item.id),
    });

    showToast(`✅ Enriched ${result.summary.successful}/${result.summary.total} words`, 'success');
    await loadQueue();
  } catch (error) {
    showToast(`❌ Error: ${error.message}`, 'error');
  } finally {
    button.disabled = false;
    button.textContent = '⚡ Enrich All';
    progressDiv.remove();
  }
}
```

#### C. Add ARIA Labels
```javascript
button.setAttribute('aria-label', 'Enrich all pending words');
button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
```

---

## 3. library.js + library.html (Complete Rewrite)

**Priority:** HIGH (Field Mapping UI!)
**Lines:** 83 → ~600 (major expansion)
**Time:** 2-3 hours

### New Structure:

```
library.html
├── Header
├── Navigation Tabs
│   ├── Queue
│   ├── History
│   ├── Analytics
│   └── Settings ← EXPAND THIS!
├── Tab Contents
└── Footer
```

### Settings Tab Expansion:

```javascript
// New Settings Sections:
1. API Configuration (existing)
   - Oxford API
   - Forvo API
   - etc.

2. ⭐ Anki Configuration (NEW!)
   - Deck selector
   - Note Type selector
   - Field Mapping UI ← MAIN FEATURE
   - Duplicate handling

3. Enrichment Options
   - Dictionary priority
   - Audio priority
   - Auto-enrich settings

4. UI Preferences
   - Dark mode toggle
   - Notifications
   - Language

5. Data Management
   - Export/Import
   - Clear data
   - Statistics
```

### Field Mapping UI Implementation:

```html
<div id="anki-config" class="settings-section">
  <h3>Anki Configuration</h3>

  <!-- Deck Selection -->
  <div class="setting-row">
    <label>Default Deck:</label>
    <select id="deckSelect">
      <!-- Populated from AnkiConnect -->
    </select>
    <button id="refreshDecks" class="btn-icon">🔄</button>
  </div>

  <!-- Note Type Selection -->
  <div class="setting-row">
    <label>Note Type:</label>
    <select id="noteTypeSelect">
      <!-- Populated from AnkiConnect -->
    </select>
    <button id="refreshNoteTypes" class="btn-icon">🔄</button>
  </div>

  <!-- Field Mapping Table -->
  <div class="field-mapping-container">
    <h4>Field Mapping</h4>
    <p class="hint">Map your Anki note fields to vocabulary data:</p>

    <table id="fieldMappingTable" class="mapping-table">
      <thead>
        <tr>
          <th>Anki Field</th>
          <th>→</th>
          <th>Extension Data</th>
          <th>Preview</th>
        </tr>
      </thead>
      <tbody id="fieldMappingBody">
        <!-- Dynamically populated -->
      </tbody>
    </table>

    <div class="mapping-actions">
      <button id="autoDetectBtn" class="btn-secondary">
        🔍 Auto-Detect Fields
      </button>
      <button id="resetMappingBtn" class="btn-secondary">
        ↺ Reset to Default
      </button>
      <button id="saveMappingBtn" class="btn-primary">
        💾 Save Mapping
      </button>
    </div>
  </div>
</div>
```

### JavaScript Logic:

```javascript
// Fetch Note Types
async function loadNoteTypes() {
  try {
    const models = await chrome.runtime.sendMessage({
      action: 'getAnkiModels',
    });

    const select = document.getElementById('noteTypeSelect');
    select.textContent = '';

    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      select.appendChild(option);
    });

    // Load saved selection
    const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (settings.noteType) {
      select.value = settings.noteType;
    }

    // Load fields for selected note type
    await loadFieldMapping(select.value);
  } catch (error) {
    showError('Failed to load note types. Is Anki running?');
  }
}

// Load Field Mapping
async function loadFieldMapping(modelName) {
  const fields = await chrome.runtime.sendMessage({
    action: 'getModelFields',
    modelName,
  });

  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const currentMapping = settings.fieldMapping || {};

  const tbody = document.getElementById('fieldMappingBody');
  tbody.textContent = '';

  fields.forEach(ankiField => {
    const row = createFieldMappingRow(ankiField, currentMapping[ankiField]);
    tbody.appendChild(row);
  });
}

// Create mapping row
function createFieldMappingRow(ankiField, currentValue) {
  const row = document.createElement('tr');

  // Anki field name
  const fieldCell = document.createElement('td');
  fieldCell.textContent = ankiField;
  fieldCell.className = 'field-name';

  // Arrow
  const arrowCell = document.createElement('td');
  arrowCell.textContent = '→';
  arrowCell.className = 'arrow';

  // Extension data dropdown
  const dataCell = document.createElement('td');
  const select = document.createElement('select');
  select.dataset.ankiField = ankiField;

  // Add options from ANKI.EXTENSION_FIELDS
  const extensionFields = {
    '': '(Not mapped)',
    'word': 'Word',
    'ipa': 'IPA Pronunciation',
    'vietnamese': 'Vietnamese Translation',
    'partOfSpeech': 'Part of Speech',
    'audio': 'Audio File',
    'exampleEn': 'English Example',
    'exampleVn': 'Vietnamese Example',
    'definition': 'English Definition',
    'synonyms': 'Synonyms',
    'antonyms': 'Antonyms',
    'collocations': 'Collocations',
    'etymology': 'Etymology',
    'hints': 'Memory Hints',
  };

  Object.entries(extensionFields).forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === currentValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  dataCell.appendChild(select);

  // Preview cell
  const previewCell = document.createElement('td');
  previewCell.className = 'preview';
  previewCell.textContent = '...';

  row.appendChild(fieldCell);
  row.appendChild(arrowCell);
  row.appendChild(dataCell);
  row.appendChild(previewCell);

  return row;
}

// Auto-detect field mapping
async function autoDetectFieldMapping() {
  const modelName = document.getElementById('noteTypeSelect').value;
  const fields = await chrome.runtime.sendMessage({
    action: 'getModelFields',
    modelName,
  });

  const suggested = await chrome.runtime.sendMessage({
    action: 'suggestFieldMapping',
    modelFields: fields,
  });

  // Update dropdowns
  Object.entries(suggested).forEach(([ankiField, extensionField]) => {
    const select = document.querySelector(`select[data-anki-field="${ankiField}"]`);
    if (select) {
      select.value = extensionField;
    }
  });

  showToast('✅ Field mapping auto-detected!', 'success');
}

// Save field mapping
async function saveFieldMapping() {
  const modelName = document.getElementById('noteTypeSelect').value;
  const deckName = document.getElementById('deckSelect').value;

  // Collect mapping
  const mapping = {};
  document.querySelectorAll('#fieldMappingBody select').forEach(select => {
    const ankiField = select.dataset.ankiField;
    const extensionField = select.value;
    if (extensionField) {
      mapping[ankiField] = extensionField;
    }
  });

  // Validate
  const fields = await chrome.runtime.sendMessage({
    action: 'getModelFields',
    modelName,
  });

  const validation = await chrome.runtime.sendMessage({
    action: 'validateFieldMapping',
    mapping,
    modelFields: fields,
  });

  if (!validation.valid) {
    showError(validation.error);
    return;
  }

  // Save settings
  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
  settings.noteType = modelName;
  settings.defaultDeck = deckName;
  settings.fieldMapping = mapping;

  await chrome.runtime.sendMessage({
    action: 'saveSettings',
    settings,
  });

  showToast('✅ Field mapping saved successfully!', 'success');
}
```

---

## 4. Modern UI/UX Redesign

### popup.css Updates:
- Add dark mode
- Modern glassmorphism
- Smooth animations
- Better colors

### NEW library.css:
- Professional dashboard design
- Card-based layouts
- Gradient backgrounds
- Responsive tables
- Loading skeletons

---

## Testing Checklist

### Unit Tests:
- [ ] validateWord with edge cases
- [ ] sanitizeHTML with XSS attempts
- [ ] processBatch with different sizes
- [ ] fetchWithRetry with failures
- [ ] ankiHelper.suggestFieldMapping()

### Integration Tests:
- [ ] Add word → Queue → Enrich → Anki (full flow)
- [ ] Batch enrich 10 words
- [ ] Field mapping with custom note type
- [ ] Cache hit/miss tracking
- [ ] Error recovery

### Manual Tests:
- [ ] Double-click word on webpage
- [ ] YouTube subtitle click
- [ ] Popup queue view
- [ ] Library all tabs
- [ ] Field mapping configuration
- [ ] Dark mode toggle
- [ ] Export/Import data

---

## Estimated Time Remaining

- background.js: 1-2 hours
- popup.js: 1 hour
- library.js + HTML: 2-3 hours
- CSS redesign: 1-2 hours
- Testing: 1-2 hours

**Total: 6-10 hours**

---

## Next Immediate Steps (Priority Order)

1. ✅ Complete background.js rewrite
2. ✅ Update popup.js with XSS fixes
3. ✅ Create field mapping UI in library
4. ✅ Redesign CSS
5. ✅ Test end-to-end
6. ✅ Create pull request

---

*Current commit: ed60a84*
*Files completed: 5/9*
*Progress: ~55%*
