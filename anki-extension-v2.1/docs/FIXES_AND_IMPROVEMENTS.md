# 🔧 ANKI VOCABULARY ASSISTANT V2.1 - FIXES & IMPROVEMENTS

## ❌ ISSUES IDENTIFIED & SOLUTIONS

### 1. ⚠️ AnkiConnect Connection Failed

**Problem:**
```
"Checking Anki..." → Không kết nối được
```

**Root Cause:**
AnkiConnect cần CORS configuration để allow extension access.

**Solution:**
Thêm config vào AnkiConnect:

```
1. Anki → Tools → Add-ons → AnkiConnect → Config

2. Thêm vào config:
{
    "webCorsOriginList": [
        "chrome-extension://*",
        "moz-extension://*"
    ],
    "webCorsOrigin": "*"
}

3. Restart Anki
4. Test: Extension sẽ connect ngay
```

**File cần thêm:** `ANKICONNECT_SETUP.md` với instructions chi tiết

---

### 2. ❌ Event Handlers Không Hoạt Động

**Problem:**
```
Click "Add to Queue" → Không phản hồi
Click "Add to Anki Now" → Không động
Click "Enrich All" → Không work
```

**Root Causes:**
1. Module imports không đúng trong content script
2. Storage Manager chưa initialize
3. Missing error handling
4. No loading states

**Solutions:**

**A. Fix Module Imports:**
```javascript
// BAD (V2.0):
import StorageManager from './utils/storage-manager.js';
import APIManager from './utils/api-manager.js';
// → Không work trong content script!

// GOOD (V2.1):
// Inject scripts properly
const script = document.createElement('script');
script.src = chrome.runtime.getURL('utils/storage-manager.js');
document.head.appendChild(script);

// Or use messaging to background
chrome.runtime.sendMessage({ action: 'addToQueue', word: word });
```

**B. Add Loading States:**
```javascript
// Before action
button.disabled = true;
button.innerHTML = '<span class="spinner"></span> Processing...';

// After action
button.disabled = false;
button.innerHTML = 'Success!';
```

**C. Add Error Handling:**
```javascript
try {
  await addToQueue(word);
  showSuccess('Added to queue!');
} catch (error) {
  showError('Failed: ' + error.message);
  console.error(error);
}
```

---

### 3. 🎨 UI Improvements Needed

**Problems:**
- Buttons quá basic
- Không có animations
- Không có feedback khi click
- Layout chưa optimal

**Solutions:**

**A. Modern Button Design:**
```css
.btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
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
  background: rgba(255,255,255,0.6);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:active::before {
  width: 300px;
  height: 300px;
}
```

**B. Loading Spinner:**
```css
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

**C. Toast Notifications:**
```javascript
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${getIcon(type)}</div>
    <div class="toast-message">${message}</div>
  `;
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Animate out
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

---

### 4. 📖 Multi-Definitions Feature

**Requirement:**
> "1 từ có thể có nhiều nghĩa: trong ngữ cảnh pháp lý, trong ngữ cảnh đời sống, tài chính,... Người dùng có thể lựa chọn add những nghĩa nào vào"

**Implementation:**

**A. Data Structure:**
```javascript
{
  word: "right",
  definitions: [
    {
      id: 1,
      context: "Legal",
      definition: "A legal entitlement",
      example: "You have the right to remain silent",
      selected: true
    },
    {
      id: 2,
      context: "Direction",
      definition: "The opposite of left",
      example: "Turn right at the corner",
      selected: false
    },
    {
      id: 3,
      context: "Correctness",
      definition: "Morally good or correct",
      example: "That's the right thing to do",
      selected: true
    }
  ]
}
```

**B. UI Component:**
```html
<div class="definitions-list">
  <h3>Select Meanings to Add:</h3>
  
  <div class="definition-item">
    <input type="checkbox" id="def1" checked>
    <label for="def1">
      <div class="def-context">Legal</div>
      <div class="def-text">A legal entitlement</div>
      <div class="def-example">"You have the right to remain silent"</div>
    </label>
  </div>
  
  <div class="definition-item">
    <input type="checkbox" id="def2">
    <label for="def2">
      <div class="def-context">Direction</div>
      <div class="def-text">The opposite of left</div>
      <div class="def-example">"Turn right at the corner"</div>
    </label>
  </div>
  
  <!-- More definitions -->
</div>

<button onclick="addSelectedDefinitions()">
  Add Selected (2)
</button>
```

**C. Context Detection với AI:**
```javascript
async function detectContexts(word, sentence, pageContent) {
  const prompt = `
    Word: "${word}"
    Sentence: "${sentence}"
    Page context: "${pageContent.substring(0, 500)}"
    
    Analyze and return all possible meanings of this word with their contexts.
    Format: JSON array of {context, definition, relevance_score}
  `;
  
  const response = await callAI(prompt);
  return response.definitions;
}
```

---

### 5. 🤖 AI Models Integration

**Requirement:**
> "Cho phép người dùng có thêm tính năng add api của các model như claude, chat gpt, gemini"

**Implementation:**

**A. API Configuration:**
```javascript
const AI_PROVIDERS = {
  claude: {
    name: 'Claude (Anthropic)',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    requiresKey: true,
    features: ['context_analysis', 'definitions', 'examples']
  },
  openai: {
    name: 'ChatGPT (OpenAI)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo',
    requiresKey: true,
    features: ['context_analysis', 'definitions', 'examples']
  },
  gemini: {
    name: 'Gemini (Google)',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    model: 'gemini-pro',
    requiresKey: true,
    features: ['context_analysis', 'definitions']
  }
};
```

**B. Unified AI Interface:**
```javascript
class AIManager {
  async analyzeWord(word, context) {
    const provider = await this.getActiveProvider();
    
    const prompt = this.buildPrompt(word, context);
    const response = await this.callAPI(provider, prompt);
    
    return this.parseResponse(response);
  }
  
  buildPrompt(word, context) {
    return `
      Analyze the word "${word}" in this context:
      
      Sentence: "${context.sentence}"
      Source: ${context.source.type} - ${context.source.title}
      Page content: "${context.pageContent}"
      
      Provide:
      1. All possible definitions with contexts (legal, daily, finance, technical, etc.)
      2. Most relevant definition for THIS specific context
      3. Example sentences for each definition
      4. Synonyms and antonyms
      5. Collocations
      6. Etymology (if interesting)
      7. Memory hints
      
      Format: Valid JSON only
      {
        "primary_context": "...",
        "definitions": [{
          "context": "...",
          "definition": "...",
          "relevance": 0.9,
          "example": "...",
          "synonyms": [...],
          "collocations": [...]
        }],
        "memory_hint": "...",
        "etymology": "..."
      }
    `;
  }
  
  async callAPI(provider, prompt) {
    switch(provider.name) {
      case 'claude':
        return await this.callClaude(prompt);
      case 'openai':
        return await this.callOpenAI(prompt);
      case 'gemini':
        return await this.callGemini(prompt);
    }
  }
  
  async callClaude(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.claudeApiKey,
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
    
    const data = await response.json();
    return JSON.parse(data.content[0].text);
  }
}
```

**C. Settings UI for AI:**
```html
<div class="ai-settings">
  <h3>🤖 AI Models Configuration</h3>
  
  <div class="ai-provider">
    <input type="radio" name="ai-provider" id="claude" checked>
    <label for="claude">
      <strong>Claude (Anthropic)</strong>
      <p>Best for context understanding and natural definitions</p>
      <input type="text" placeholder="Claude API Key" class="api-key">
    </label>
  </div>
  
  <div class="ai-provider">
    <input type="radio" name="ai-provider" id="openai">
    <label for="openai">
      <strong>ChatGPT (OpenAI)</strong>
      <p>Great for examples and explanations</p>
      <input type="text" placeholder="OpenAI API Key" class="api-key">
    </label>
  </div>
  
  <div class="ai-provider">
    <input type="radio" name="ai-provider" id="gemini">
    <label for="gemini">
      <strong>Gemini (Google)</strong>
      <p>Fast and reliable for basic definitions</p>
      <input type="text" placeholder="Gemini API Key" class="api-key">
    </label>
  </div>
  
  <div class="ai-options">
    <label>
      <input type="checkbox" checked>
      Auto-detect context from page content
    </label>
    <label>
      <input type="checkbox" checked>
      Generate contextual examples
    </label>
    <label>
      <input type="checkbox">
      Include etymology
    </label>
  </div>
</div>
```

---

### 6. 🎯 Multiple Capture Methods

**Requirement:**
> "Có thể cho phép người dùng tuỳ chỉnh nhiều loại, thay vì chỉ double click"

**Implementation:**

**A. Capture Modes:**
```javascript
const CAPTURE_MODES = {
  doubleClick: {
    name: 'Double Click',
    enabled: true,
    handler: handleDoubleClick
  },
  hover: {
    name: 'Hover (with Alt key)',
    enabled: true,
    delay: 500, // ms
    handler: handleHoverWithAlt
  },
  selection: {
    name: 'Selection + Shortcut',
    enabled: true,
    shortcut: 'Alt+A',
    handler: handleSelectionShortcut
  },
  rightClick: {
    name: 'Right Click Menu',
    enabled: true,
    handler: handleContextMenu
  },
  clickIcon: {
    name: 'Click Floating Icon',
    enabled: false,
    handler: handleFloatingIcon
  }
};
```

**B. Hover Mode:**
```javascript
let hoverTimeout;

document.addEventListener('mouseover', (e) => {
  if (!e.altKey) return; // Chỉ active khi giữ Alt
  
  const word = getWordAtPosition(e);
  if (!word) return;
  
  hoverTimeout = setTimeout(() => {
    showQuickPopup(e.pageX, e.pageY, word);
  }, settings.hoverDelay);
});

document.addEventListener('mouseout', () => {
  clearTimeout(hoverTimeout);
});
```

**C. Floating Icon Mode:**
```javascript
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection().toString().trim();
  if (!selection || selection.split(' ').length > 3) return;
  
  // Show floating icon
  const icon = document.createElement('div');
  icon.className = 'vocab-floating-icon';
  icon.innerHTML = '📚';
  icon.style.left = `${e.pageX + 10}px`;
  icon.style.top = `${e.pageY - 30}px`;
  document.body.appendChild(icon);
  
  icon.onclick = () => {
    addToQueue(selection);
    icon.remove();
  };
  
  // Auto-hide after 3s
  setTimeout(() => icon.remove(), 3000);
});
```

**D. Settings UI:**
```html
<div class="capture-methods">
  <h3>Capture Methods</h3>
  
  <div class="method-item">
    <label>
      <input type="checkbox" checked>
      <strong>Double Click</strong>
      <p>Double-click any word to capture</p>
    </label>
  </div>
  
  <div class="method-item">
    <label>
      <input type="checkbox" checked>
      <strong>Hover + Alt Key</strong>
      <p>Hold Alt and hover over word</p>
      <input type="range" min="100" max="2000" value="500">
      <span>Delay: 500ms</span>
    </label>
  </div>
  
  <div class="method-item">
    <label>
      <input type="checkbox" checked>
      <strong>Selection + Shortcut</strong>
      <p>Select text and press Alt+A</p>
      <input type="text" value="Alt+A" placeholder="Customize shortcut">
    </label>
  </div>
  
  <div class="method-item">
    <label>
      <input type="checkbox">
      <strong>Floating Icon</strong>
      <p>Show icon when text is selected</p>
    </label>
  </div>
</div>
```

---

### 7. 🔊 Auto-Pronunciation Feature

**Requirement:**
> "Có lựa chọn phát âm ngay sau khi người dùng bấm hiện nó hiện"

**Implementation:**

**A. Auto-Play Audio:**
```javascript
async function showQuickPopup(x, y, word) {
  // ... create popup ...
  
  // Auto-play audio if enabled
  if (settings.autoPlayAudio) {
    const audioUrl = await getAudioUrl(word);
    const audio = new Audio(audioUrl);
    
    // Play immediately
    audio.play().catch(error => {
      console.log('Autoplay blocked:', error);
      // Show play button instead
      showPlayButton(popup, audio);
    });
  }
  
  // Add manual play button anyway
  popup.querySelector('.play-btn').onclick = () => {
    audio.currentTime = 0;
    audio.play();
  };
}
```

**B. Audio Controls:**
```html
<div class="audio-controls">
  <button class="play-btn" onclick="playAudio('us')">
    🔊 US
  </button>
  <button class="play-btn" onclick="playAudio('uk')">
    🔊 UK
  </button>
  <label class="auto-play">
    <input type="checkbox" checked>
    Auto-play on popup
  </label>
</div>
```

**C. Settings:**
```javascript
audioSettings: {
  autoPlay: true,
  preferredAccent: 'us', // us | uk | both
  playbackSpeed: 1.0, // 0.5 - 2.0
  volume: 0.8 // 0.0 - 1.0
}
```

---

### 8. ⏸️ Video Pause Feature

**Requirement:**
> "Có tính năng trực tiếp dịch và dừng lại video sau khi người dùng bấm extension"

**Implementation:**

**A. Auto-Pause YouTube:**
```javascript
function pauseVideoIfEnabled() {
  if (!settings.autoPauseVideo) return;
  if (!isYouTube()) return;
  
  const video = document.querySelector('video');
  if (video && !video.paused) {
    video.pause();
    
    // Show resume button in popup
    showResumeButton();
    
    // Track paused state
    window.videoPausedByExtension = true;
  }
}

function showQuickPopup(x, y, word) {
  // Pause video first
  pauseVideoIfEnabled();
  
  // ... create popup ...
  
  // Add resume button if paused
  if (window.videoPausedByExtension) {
    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'resume-video-btn';
    resumeBtn.innerHTML = '▶️ Resume Video';
    resumeBtn.onclick = resumeVideo;
    popup.appendChild(resumeBtn);
  }
}

function resumeVideo() {
  const video = document.querySelector('video');
  if (video && video.paused && window.videoPausedByExtension) {
    video.play();
    window.videoPausedByExtension = false;
  }
}

// Auto-resume when popup closes
function closePopup() {
  if (settings.autoResumeOnClose && window.videoPausedByExtension) {
    resumeVideo();
  }
  popup.remove();
}
```

**B. Settings:**
```html
<div class="video-settings">
  <h3>YouTube Settings</h3>
  
  <label>
    <input type="checkbox" checked>
    Auto-pause video when capturing word
  </label>
  
  <label>
    <input type="checkbox" checked>
    Auto-resume when closing popup
  </label>
  
  <label>
    <input type="checkbox">
    Show video timestamp in card
  </label>
</div>
```

---

### 9. ⚙️ Comprehensive Settings Page

**New Settings Categories:**

```
Settings Page Structure:
├── General
│   ├── Language preferences
│   ├── Default deck
│   └── Capture behavior
│
├── Capture Methods
│   ├── Double-click (on/off)
│   ├── Hover + Alt (on/off, delay)
│   ├── Selection + Shortcut (on/off, key)
│   ├── Right-click menu (on/off)
│   └── Floating icon (on/off)
│
├── Dictionary Sources
│   ├── Priority order (drag to reorder)
│   ├── API keys (Oxford, Merriam-Webster)
│   └── Fallback behavior
│
├── AI Models
│   ├── Provider (Claude/GPT/Gemini)
│   ├── API keys
│   ├── Context detection (on/off)
│   └── Features (etymology, examples, etc.)
│
├── Audio
│   ├── Auto-play (on/off)
│   ├── Preferred accent (US/UK/Both)
│   ├── Sources priority
│   └── Playback settings
│
├── YouTube
│   ├── Auto-pause (on/off)
│   ├── Auto-resume (on/off)
│   ├── Subtitle enhancement (on/off)
│   └── Timestamp in cards (on/off)
│
├── Multi-Definitions
│   ├── Show all contexts (on/off)
│   ├── Auto-select primary (on/off)
│   └── Context detection via AI (on/off)
│
├── UI/UX
│   ├── Theme (Light/Dark/Auto)
│   ├── Animation speed
│   ├── Notification style
│   └── Popup position
│
├── Card Creation
│   ├── Card types to create
│   ├── Required fields
│   └── Auto-fill preferences
│
└── Advanced
    ├── Cache settings
    ├── Offline mode
    ├── Export/Import
    └── Debug mode
```

---

## 📝 SUMMARY OF CHANGES

### Fixed Issues:
✅ AnkiConnect connection (CORS config)
✅ Event handlers not working
✅ No feedback on actions
✅ UI improvements needed

### New Features:
✨ Multi-definitions selection
✨ AI models integration (Claude/GPT/Gemini)
✨ Multiple capture methods
✨ Auto-pronunciation
✨ Video pause/resume
✨ Comprehensive settings
✨ Context-aware analysis
✨ Loading states & animations

### Files Modified:
- manifest.json (permissions)
- background.js (AI integration)
- content.js (capture methods, video control)
- api-manager.js (AI providers)
- popup.js (multi-definitions UI)
- settings.html (new settings page)
- styles/*.css (modern UI)

---

## 🚀 NEXT STEPS

1. Apply AnkiConnect CORS config
2. Load updated extension
3. Configure AI API keys (optional)
4. Customize capture methods
5. Test all features

**Expected Result:** Fully functional extension với all issues fixed và new features working!
