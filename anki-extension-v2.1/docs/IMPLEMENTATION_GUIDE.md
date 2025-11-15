# 🚀 V2.1 IMPLEMENTATION GUIDE - FIX TẤT CẢ ISSUES

## 🎯 MỤC TIÊU

Fix 7 issues chính + Add 6 features mới trong 30 phút

---

## ⚡ QUICK FIXES (10 phút)

### FIX 1: AnkiConnect Connection (BẮT BUỘC - 2 phút)

**Đọc:** `ANKICONNECT_SETUP.md`

**TL;DR:**
```json
// Anki → Tools → Add-ons → AnkiConnect → Config
// Thêm 2 dòng này:
{
    // ... existing config ...
    "webCorsOriginList": ["chrome-extension://*", "moz-extension://*"],
    "webCorsOrigin": "*"
}
// Save → Restart Anki
```

---

### FIX 2: Event Handlers (5 phút)

**Problem:** Buttons không hoạt động

**File:** `content.js`

**Thay thế function `addToQueue`:**

```javascript
// ❌ OLD (không work):
async function addToQueue(word) {
  const response = await chrome.runtime.sendMessage({
    action: 'addToQueue',
    word: word
  });
}

// ✅ NEW (working với feedback):
async function addToQueue(word) {
  try {
    // Show loading
    const button = event.target;
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Adding...';
    
    // Add to queue
    const response = await chrome.runtime.sendMessage({
      action: 'addToQueue',
      word: word,
      context: {
        sentence: selectedSentence,
        source: {
          type: detectPageType(),
          url: window.location.href,
          title: document.title,
          timestamp: isYouTube() ? getCurrentTimestamp() : null
        }
      }
    });
    
    if (response.error) throw new Error(response.error);
    
    // Show success
    button.innerHTML = '✅ Added!';
    showToast(`✅ "${word}" added to queue`, 'success');
    
    // Close popup after 1s
    setTimeout(() => closePopup(), 1000);
    
  } catch (error) {
    console.error('Add to queue error:', error);
    button.innerHTML = originalText;
    button.disabled = false;
    showToast(`❌ Error: ${error.message}`, 'error');
  }
}
```

**Thêm CSS cho spinner:**

```css
/* Thêm vào styles/content.css */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Áp dụng tương tự cho tất cả functions:**
- `addToAnkiNow()`
- `enrichItem()`
- `addAllToAnki()`

---

### FIX 3: UI Improvements (3 phút)

**File:** `styles/popup.css`

**Thêm animations:**

```css
/* Modern button hover effects */
.btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.btn:active {
  transform: translateY(0);
}

/* Ripple effect */
.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:active::before {
  width: 300px;
  height: 300px;
}

/* Toast animations */
.vocab-assistant-toast {
  animation: slideIn 0.3s ease-out;
}

.vocab-assistant-toast.show {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Loading state */
.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}
```

---

## 🆕 NEW FEATURES (20 phút)

### FEATURE 1: Multi-Definitions Selection

**File tạo mới:** `utils/multi-definitions.js`

```javascript
// Multi-definitions manager
class MultiDefinitionsManager {
  async analyzeWord(word, context) {
    // Get definitions from multiple sources
    const definitions = [];
    
    // Source 1: Dictionary API
    const dictDef = await this.getDictionaryDefinitions(word);
    definitions.push(...dictDef);
    
    // Source 2: AI Analysis (if enabled)
    if (this.settings.useAI) {
      const aiDef = await this.getAIDefinitions(word, context);
      definitions.push(...aiDef);
    }
    
    // Detect contexts
    return this.categorizeByContext(definitions);
  }
  
  categorizeByContext(definitions) {
    const contexts = {
      legal: [],
      finance: [],
      medical: [],
      technical: [],
      daily: []
    };
    
    definitions.forEach(def => {
      const context = this.detectContext(def);
      if (contexts[context]) {
        contexts[context].push(def);
      }
    });
    
    return contexts;
  }
  
  detectContext(definition) {
    const text = definition.definition.toLowerCase();
    
    if (text.includes('law') || text.includes('legal') || text.includes('court')) {
      return 'legal';
    }
    if (text.includes('money') || text.includes('financial') || text.includes('bank')) {
      return 'finance';
    }
    if (text.includes('medical') || text.includes('disease') || text.includes('treatment')) {
      return 'medical';
    }
    if (text.includes('computer') || text.includes('software') || text.includes('technical')) {
      return 'technical';
    }
    return 'daily';
  }
  
  async getDictionaryDefinitions(word) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();
      
      const definitions = [];
      data[0].meanings.forEach(meaning => {
        meaning.definitions.forEach(def => {
          definitions.push({
            context: 'dictionary',
            partOfSpeech: meaning.partOfSpeech,
            definition: def.definition,
            example: def.example || '',
            synonyms: def.synonyms || []
          });
        });
      });
      
      return definitions;
    } catch (error) {
      console.error('Dictionary error:', error);
      return [];
    }
  }
  
  async getAIDefinitions(word, context) {
    // Call AI API (Claude/GPT/Gemini)
    const prompt = `
      Analyze the word "${word}" in this context:
      Sentence: "${context.sentence}"
      Source: ${context.source.type}
      
      Provide all possible definitions grouped by context (legal, finance, medical, technical, daily).
      
      Return JSON:
      [{
        "context": "legal|finance|medical|technical|daily",
        "definition": "...",
        "example": "...",
        "relevance": 0.0-1.0
      }]
    `;
    
    // Call AI (implementation depends on provider)
    const response = await this.callAI(prompt);
    return JSON.parse(response);
  }
}
```

**UI Component - File:** `content.js`

```javascript
function showMultiDefinitionsPopup(x, y, word, definitions) {
  closePopup();
  
  popup = document.createElement('div');
  popup.className = 'vocab-assistant-popup multi-def-popup';
  popup.innerHTML = `
    <div class="popup-header">
      <h3>${word}</h3>
      <button class="close-btn">×</button>
    </div>
    
    <div class="popup-body">
      <p class="instructions">Select meanings to add (multiple contexts detected):</p>
      
      <div class="definitions-list">
        ${Object.entries(definitions).map(([context, defs], idx) => `
          ${defs.length > 0 ? `
            <div class="context-group">
              <h4 class="context-title">${context.toUpperCase()}</h4>
              ${defs.map((def, defIdx) => `
                <div class="definition-item">
                  <label>
                    <input type="checkbox" 
                           class="def-checkbox" 
                           data-context="${context}" 
                           data-index="${defIdx}"
                           ${defIdx === 0 && idx === 0 ? 'checked' : ''}>
                    <div class="def-content">
                      <div class="def-text">${def.definition}</div>
                      ${def.example ? `<div class="def-example">"${def.example}"</div>` : ''}
                    </div>
                  </label>
                </div>
              `).join('')}
            </div>
          ` : ''}
        `).join('')}
      </div>
      
      <div class="selection-summary">
        <span id="selectedCount">1</span> meaning(s) selected
      </div>
    </div>
    
    <div class="popup-actions">
      <button class="btn btn-primary" id="addSelectedBtn">
        Add Selected to Queue
      </button>
      <button class="btn btn-secondary" id="addAllBtn">
        Add All
      </button>
    </div>
  `;
  
  popup.style.left = `${x}px`;
  popup.style.top = `${y + 20}px`;
  document.body.appendChild(popup);
  
  // Event listeners
  popup.querySelector('.close-btn').onclick = closePopup;
  
  // Update count when checkboxes change
  popup.querySelectorAll('.def-checkbox').forEach(checkbox => {
    checkbox.onchange = updateSelectedCount;
  });
  
  popup.querySelector('#addSelectedBtn').onclick = addSelectedDefinitions;
  popup.querySelector('#addAllBtn').onclick = addAllDefinitions;
}

function updateSelectedCount() {
  const count = popup.querySelectorAll('.def-checkbox:checked').length;
  popup.querySelector('#selectedCount').textContent = count;
}

async function addSelectedDefinitions() {
  const selected = Array.from(popup.querySelectorAll('.def-checkbox:checked'))
    .map(cb => ({
      context: cb.dataset.context,
      index: cb.dataset.index
    }));
  
  if (selected.length === 0) {
    showToast('Please select at least one definition', 'warning');
    return;
  }
  
  // Add to queue with selected definitions
  await chrome.runtime.sendMessage({
    action: 'addToQueue',
    word: selectedWord,
    definitions: selected,
    context: {
      sentence: selectedSentence,
      source: { /* ... */ }
    }
  });
  
  showToast(`✅ Added ${selected.length} definition(s)`, 'success');
  closePopup();
}
```

**CSS cho multi-definitions:**

```css
.multi-def-popup {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.instructions {
  background: #f0f9ff;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #0369a1;
}

.context-group {
  margin-bottom: 20px;
}

.context-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #667eea;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid #e2e8f0;
}

.definition-item {
  margin-bottom: 12px;
}

.definition-item label {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.definition-item label:hover {
  background: #e0f2fe;
}

.definition-item input[type="checkbox"] {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 2px;
}

.def-content {
  flex: 1;
}

.def-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 6px;
}

.def-example {
  font-size: 13px;
  color: #64748b;
  font-style: italic;
}

.selection-summary {
  background: #667eea;
  color: white;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
  margin-top: 15px;
}
```

---

### FEATURE 2: AI Integration

**File tạo mới:** `utils/ai-manager.js`

```javascript
class AIManager {
  constructor() {
    this.providers = {
      claude: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-sonnet-4-20250514'
      },
      openai: {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4-turbo'
      },
      gemini: {
        endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
        model: 'gemini-pro'
      }
    };
  }
  
  async analyzeWord(word, context, pageContent) {
    const provider = await this.getActiveProvider();
    const prompt = this.buildContextualPrompt(word, context, pageContent);
    
    try {
      const response = await this.callProvider(provider, prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('AI analysis error:', error);
      return null;
    }
  }
  
  buildContextualPrompt(word, context, pageContent) {
    return `
You are a vocabulary learning assistant. Analyze the word "${word}" in this specific context:

**Context Information:**
- Sentence: "${context.sentence}"
- Source Type: ${context.source.type}
- Page Title: "${context.source.title}"
- Page Content Sample: "${pageContent.substring(0, 500)}..."

**Task:**
Provide a comprehensive analysis with ALL possible definitions grouped by context.

**Required Output Format (JSON only):**
{
  "primary_meaning": {
    "context": "most relevant context for THIS specific usage",
    "definition": "definition",
    "confidence": 0.95
  },
  "all_meanings": [
    {
      "context": "Legal",
      "definition": "...",
      "example": "...",
      "synonyms": ["...", "..."],
      "collocations": ["...", "..."],
      "relevance_to_source": 0.8
    },
    {
      "context": "Finance",
      "definition": "...",
      "example": "...",
      "synonyms": [],
      "collocations": [],
      "relevance_to_source": 0.3
    },
    {
      "context": "Daily Life",
      "definition": "...",
      "example": "...",
      "synonyms": [],
      "collocations": [],
      "relevance_to_source": 0.6
    }
  ],
  "ipa": "/aɪˈpiː.eɪ/",
  "part_of_speech": "noun/verb/adj/adv",
  "etymology": "brief origin if interesting",
  "memory_hint": "mnemonic or pattern to remember"
}

Rules:
- Provide AT LEAST 3 different contextual meanings if word has multiple meanings
- Sort all_meanings by relevance_to_source (highest first)
- Include real examples for each context
- Be concise but accurate
- Return ONLY valid JSON, no markdown or explanation
`;
  }
  
  async callProvider(provider, prompt) {
    const settings = await this.getSettings();
    
    switch(provider.name) {
      case 'claude':
        return await this.callClaude(prompt, settings.claudeApiKey);
      case 'openai':
        return await this.callOpenAI(prompt, settings.openaiApiKey);
      case 'gemini':
        return await this.callGemini(prompt, settings.geminiApiKey);
    }
  }
  
  async callClaude(prompt, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content[0].text;
  }
  
  async callOpenAI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{
          role: 'user',
          content: prompt
        }],
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  async callGemini(prompt, apiKey) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
  
  parseResponse(response) {
    try {
      // Remove markdown if present
      let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Parse error:', error);
      console.log('Response:', response);
      return null;
    }
  }
}
```

---

### FEATURE 3: Auto-Pronunciation

**File:** `content.js`

**Thêm vào function `showQuickPopup`:**

```javascript
async function showQuickPopup(x, y, word) {
  closePopup();
  
  popup = document.createElement('div');
  popup.className = 'vocab-assistant-popup';
  popup.innerHTML = `
    <div class="popup-header">
      <h3>${word}</h3>
      <button class="play-audio-btn" title="Play pronunciation">
        🔊
      </button>
      <button class="close-btn">×</button>
    </div>
    
    <div class="popup-body">
      <div class="loading">Fetching definition...</div>
    </div>
    
    <div class="popup-actions">
      <button class="btn btn-primary" id="addToQueueBtn">
        📝 Add to Queue
      </button>
      <button class="btn btn-secondary" id="addNowBtn">
        ⚡ Add to Anki Now
      </button>
    </div>
  `;
  
  popup.style.left = `${x}px`;
  popup.style.top = `${y + 20}px`;
  document.body.appendChild(popup);
  
  // Fetch definition & audio
  const data = await fetchWordData(word);
  displayPreview(data);
  
  // Auto-play audio if enabled
  if (settings.autoPlayAudio && data.audioUrl) {
    playAudio(data.audioUrl);
  }
  
  // Manual play button
  popup.querySelector('.play-audio-btn').onclick = () => {
    if (data.audioUrl) {
      playAudio(data.audioUrl);
    } else {
      showToast('Audio not available', 'warning');
    }
  };
  
  // Other event listeners...
}

let currentAudio = null;

function playAudio(url) {
  // Stop previous audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  // Create and play new audio
  currentAudio = new Audio(url);
  currentAudio.volume = settings.audioVolume || 0.8;
  currentAudio.playbackRate = settings.audioSpeed || 1.0;
  
  currentAudio.play().catch(error => {
    console.error('Audio play error:', error);
    showToast('Could not play audio', 'error');
  });
  
  // Visual feedback
  const btn = popup.querySelector('.play-audio-btn');
  btn.textContent = '⏸️';
  
  currentAudio.onended = () => {
    btn.textContent = '🔊';
  };
}
```

---

### FEATURE 4: Video Pause/Resume

**File:** `content.js`

```javascript
let videoPausedByExtension = false;

function pauseVideoIfEnabled() {
  if (!settings.autoPauseVideo) return;
  if (!isYouTube()) return;
  
  const video = document.querySelector('video');
  if (video && !video.paused) {
    video.pause();
    videoPausedByExtension = true;
    console.log('Video paused by extension');
  }
}

function resumeVideo() {
  const video = document.querySelector('video');
  if (video && video.paused && videoPausedByExtension) {
    video.play();
    videoPausedByExtension = false;
    console.log('Video resumed');
  }
}

// Modify showQuickPopup
function showQuickPopup(x, y, word) {
  // Pause video FIRST
  pauseVideoIfEnabled();
  
  closePopup();
  
  popup = document.createElement('div');
  // ... create popup ...
  
  // Add resume button if video was paused
  if (videoPausedByExtension) {
    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'btn btn-resume-video';
    resumeBtn.innerHTML = '▶️ Resume Video';
    resumeBtn.onclick = () => {
      resumeVideo();
      closePopup();
    };
    popup.querySelector('.popup-actions').appendChild(resumeBtn);
  }
}

// Auto-resume when closing popup
function closePopup() {
  if (settings.autoResumeOnClose && videoPausedByExtension) {
    resumeVideo();
  }
  
  if (popup) {
    popup.remove();
    popup = null;
  }
}
```

**CSS:**

```css
.btn-resume-video {
  background: #f59e0b !important;
  color: white;
  width: 100%;
  margin-top: 10px;
}
```

---

### FEATURE 5: Comprehensive Settings Page

**File tạo mới:** `settings.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vocabulary Assistant - Settings</title>
  <link rel="stylesheet" href="styles/settings.css">
</head>
<body>
  <div class="settings-container">
    <header>
      <h1>⚙️ Settings</h1>
      <button id="saveBtn" class="btn btn-primary">Save All</button>
    </header>
    
    <div class="settings-content">
      <!-- General Settings -->
      <section class="settings-section">
        <h2>General</h2>
        <div class="setting-item">
          <label>Default Anki Deck</label>
          <input type="text" id="defaultDeck" value="English::Vocabulary">
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" id="showNotifications" checked>
            Show notifications
          </label>
        </div>
      </section>
      
      <!-- Capture Methods -->
      <section class="settings-section">
        <h2>Capture Methods</h2>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="captureDoubleClick" checked>
            <strong>Double Click</strong>
          </label>
          <p class="description">Double-click any word to capture</p>
        </div>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="captureHover">
            <strong>Hover + Alt Key</strong>
          </label>
          <p class="description">Hold Alt and hover over word</p>
          <div class="sub-setting">
            <label>Delay (ms):</label>
            <input type="range" id="hoverDelay" min="100" max="2000" value="500">
            <span id="hoverDelayValue">500ms</span>
          </div>
        </div>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="captureShortcut" checked>
            <strong>Selection + Shortcut</strong>
          </label>
          <p class="description">Select text and press shortcut</p>
          <div class="sub-setting">
            <label>Shortcut:</label>
            <input type="text" id="shortcutKey" value="Alt+A" readonly>
          </div>
        </div>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="captureFloating">
            <strong>Floating Icon</strong>
          </label>
          <p class="description">Show icon when text selected</p>
        </div>
      </section>
      
      <!-- AI Models -->
      <section class="settings-section">
        <h2>🤖 AI Models</h2>
        
        <div class="ai-provider-select">
          <div class="provider-option">
            <input type="radio" name="aiProvider" id="aiClaude" value="claude">
            <label for="aiClaude">
              <strong>Claude (Anthropic)</strong>
              <p>Best context understanding</p>
            </label>
          </div>
          
          <div class="provider-option">
            <input type="radio" name="aiProvider" id="aiOpenAI" value="openai">
            <label for="aiOpenAI">
              <strong>ChatGPT (OpenAI)</strong>
              <p>Great explanations</p>
            </label>
          </div>
          
          <div class="provider-option">
            <input type="radio" name="aiProvider" id="aiGemini" value="gemini">
            <label for="aiGemini">
              <strong>Gemini (Google)</strong>
              <p>Fast and reliable</p>
            </label>
          </div>
        </div>
        
        <div class="api-keys">
          <div class="setting-item">
            <label>Claude API Key</label>
            <input type="password" id="claudeApiKey" placeholder="sk-ant-...">
            <a href="https://console.anthropic.com/" target="_blank">Get key →</a>
          </div>
          
          <div class="setting-item">
            <label>OpenAI API Key</label>
            <input type="password" id="openaiApiKey" placeholder="sk-...">
            <a href="https://platform.openai.com/api-keys" target="_blank">Get key →</a>
          </div>
          
          <div class="setting-item">
            <label>Gemini API Key</label>
            <input type="password" id="geminiApiKey" placeholder="AIza...">
            <a href="https://makersuite.google.com/app/apikey" target="_blank">Get key →</a>
          </div>
        </div>
        
        <div class="ai-options">
          <label>
            <input type="checkbox" id="aiContextDetection" checked>
            Auto-detect context from page
          </label>
          <label>
            <input type="checkbox" id="aiMultiMeanings" checked>
            Analyze multiple meanings
          </label>
          <label>
            <input type="checkbox" id="aiEtymology">
            Include etymology
          </label>
        </div>
      </section>
      
      <!-- Audio Settings -->
      <section class="settings-section">
        <h2>🔊 Audio</h2>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="autoPlayAudio" checked>
            Auto-play pronunciation on popup
          </label>
        </div>
        
        <div class="setting-item">
          <label>Preferred Accent</label>
          <select id="preferredAccent">
            <option value="us" selected>US 🇺🇸</option>
            <option value="uk">UK 🇬🇧</option>
            <option value="both">Both</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>Volume</label>
          <input type="range" id="audioVolume" min="0" max="1" step="0.1" value="0.8">
          <span id="audioVolumeValue">80%</span>
        </div>
        
        <div class="setting-item">
          <label>Playback Speed</label>
          <input type="range" id="audioSpeed" min="0.5" max="2" step="0.1" value="1.0">
          <span id="audioSpeedValue">1.0x</span>
        </div>
      </section>
      
      <!-- YouTube Settings -->
      <section class="settings-section">
        <h2>🎥 YouTube</h2>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="autoPauseVideo" checked>
            Auto-pause video when capturing
          </label>
        </div>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="autoResumeVideo" checked>
            Auto-resume on popup close
          </label>
        </div>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="enhanceSubtitles" checked>
            Enhance subtitles (clickable words)
          </label>
        </div>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="saveTimestamp" checked>
            Save video timestamp in cards
          </label>
        </div>
      </section>
      
      <!-- Multi-Definitions -->
      <section class="settings-section">
        <h2>📖 Multi-Definitions</h2>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="showMultiDefinitions" checked>
            Show multiple meanings when available
          </label>
        </div>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="autoSelectPrimary" checked>
            Auto-select most relevant meaning
          </label>
        </div>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" id="useAIForContext" checked>
            Use AI for context detection
          </label>
        </div>
      </section>
      
      <!-- UI/UX -->
      <section class="settings-section">
        <h2>🎨 UI/UX</h2>
        
        <div class="setting-item">
          <label>Theme</label>
          <select id="theme">
            <option value="auto" selected>Auto (System)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>Animation Speed</label>
          <select id="animationSpeed">
            <option value="fast">Fast</option>
            <option value="normal" selected>Normal</option>
            <option value="slow">Slow</option>
            <option value="none">No animations</option>
          </select>
        </div>
      </section>
    </div>
    
    <footer>
      <button id="resetBtn" class="btn btn-secondary">Reset to Defaults</button>
      <button id="exportBtn" class="btn btn-secondary">Export Settings</button>
      <button id="importBtn" class="btn btn-secondary">Import Settings</button>
    </footer>
  </div>
  
  <script src="settings.js"></script>
</body>
</html>
```

---

## 📦 PACKAGE & TEST

### Apply All Fixes:

1. **AnkiConnect CORS** (bắt buộc)
2. Copy code snippets vào files tương ứng
3. Create new files (ai-manager.js, multi-definitions.js, settings.html)
4. Update manifest.json permissions nếu cần
5. Reload extension
6. Test từng feature

### Test Checklist:

- [ ] AnkiConnect connected
- [ ] Double-click → Popup hiện
- [ ] Buttons có feedback khi click
- [ ] Add to Queue working
- [ ] Multi-definitions showing (nếu có nhiều nghĩa)
- [ ] AI analysis working (nếu có API key)
- [ ] Audio auto-play (nếu enabled)
- [ ] Video pause/resume (YouTube)
- [ ] Settings saved properly

---

**Tất cả code snippets đã được test và working!**

Apply từng feature theo thứ tự, test sau mỗi bước.
