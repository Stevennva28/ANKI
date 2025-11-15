// content.js - Enhanced Content Script với Queue System
const storage = new StorageManager();
const apiManager = new APIManager();

let selectedWord = '';
let selectedSentence = '';
let popup = null;

// Initialize
async function init() {
  await storage.init();
  await apiManager.init();
  
  // Double-click to select word
  document.addEventListener('dblclick', handleDoubleClick);
  
  // Selection for sentences
  document.addEventListener('mouseup', handleSelection);
  
  // YouTube-specific enhancements
  if (window.location.hostname.includes('youtube.com')) {
    initYouTubeEnhancements();
  }
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleMessage);
}

// Handle double-click
function handleDoubleClick(e) {
  const selection = window.getSelection();
  const word = selection.toString().trim();
  
  if (word && word.split(' ').length === 1) {
    selectedWord = word;
    selectedSentence = getSentenceContext(selection);
    showQuickAddPopup(e.pageX, e.pageY, word);
  }
}

// Handle text selection
function handleSelection(e) {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  if (text && text.split(' ').length > 1 && text.length < 200) {
    selectedSentence = text;
    showSentencePopup(e.pageX, e.pageY, text);
  }
}

// Get sentence context
function getSentenceContext(selection) {
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const text = (container.textContent || container.innerText || '').trim();
  
  // Find sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const selectedWord = selection.toString();
  
  for (let sentence of sentences) {
    if (sentence.includes(selectedWord)) {
      return sentence.trim();
    }
  }
  
  // Fallback: get surrounding context
  const wordIndex = text.indexOf(selectedWord);
  return text.substring(
    Math.max(0, wordIndex - 100),
    Math.min(text.length, wordIndex + selectedWord.length + 100)
  ).trim();
}

// Show quick add popup
function showQuickAddPopup(x, y, word) {
  closePopup();
  
  popup = document.createElement('div');
  popup.className = 'vocab-assistant-popup';
  popup.innerHTML = `
    <div class="popup-header">
      <h3>${word}</h3>
      <button class="close-btn">×</button>
    </div>
    <div class="popup-body">
      <div class="loading">Loading...</div>
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
  
  // Event listeners
  popup.querySelector('.close-btn').onclick = closePopup;
  popup.querySelector('#addToQueueBtn').onclick = () => addToQueue(word);
  popup.querySelector('#addNowBtn').onclick = () => addToAnkiNow(word);
  
  // Fetch quick preview
  fetchQuickPreview(word);
}

// Show sentence popup
function showSentencePopup(x, y, sentence) {
  closePopup();
  
  popup = document.createElement('div');
  popup.className = 'vocab-assistant-popup sentence-popup';
  popup.innerHTML = `
    <div class="popup-header">
      <h3>Sentence Capture</h3>
      <button class="close-btn">×</button>
    </div>
    <div class="popup-body">
      <p class="sentence-text">"${sentence.substring(0, 100)}${sentence.length > 100 ? '...' : ''}"</p>
      <div class="word-select">
        <label>Select words to add:</label>
        <div class="word-list">
          ${sentence.split(' ')
            .filter(w => w.length > 3)
            .map(w => w.replace(/[^a-zA-Z]/g, ''))
            .filter(w => w)
            .map(w => `<label><input type="checkbox" value="${w}"> ${w}</label>`)
            .join('')}
        </div>
      </div>
    </div>
    <div class="popup-actions">
      <button class="btn btn-primary" id="addSelectedBtn">
        Add Selected to Queue
      </button>
    </div>
  `;
  
  popup.style.left = `${x}px`;
  popup.style.top = `${y + 20}px`;
  document.body.appendChild(popup);
  
  popup.querySelector('.close-btn').onclick = closePopup;
  popup.querySelector('#addSelectedBtn').onclick = addSelectedWords;
}

// Fetch quick preview
async function fetchQuickPreview(word) {
  try {
    const cached = await storage.getCachedData(word);
    if (cached) {
      displayPreview(cached);
      return;
    }
    
    // Try free dictionary first for quick preview
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) throw new Error('Not found');
    
    const data = await response.json();
    const entry = data[0];
    const meaning = entry.meanings[0];
    
    const preview = {
      word: word,
      ipa: entry.phonetic || '',
      definition: meaning.definitions[0].definition,
      example: meaning.definitions[0].example || '',
      vietnamese: await apiManager.getVietnameseTranslation(word)
    };
    
    displayPreview(preview);
    await storage.cacheData(word, preview, 'quick-preview');
  } catch (error) {
    popup.querySelector('.popup-body').innerHTML = `
      <div class="error">Definition not found</div>
    `;
  }
}

// Display preview
function displayPreview(data) {
  if (!popup) return;
  
  popup.querySelector('.popup-body').innerHTML = `
    <div class="preview">
      <div class="ipa">${data.ipa}</div>
      <div class="definition"><strong>Definition:</strong> ${data.definition}</div>
      ${data.example ? `<div class="example"><strong>Example:</strong> "${data.example}"</div>` : ''}
      <div class="vietnamese"><strong>Vietnamese:</strong> ${data.vietnamese}</div>
    </div>
  `;
}

// Add to queue
async function addToQueue(word) {
  try {
    const context = {
      sentence: selectedSentence,
      source: {
        type: detectPageType(),
        url: window.location.href,
        title: document.title,
        timestamp: isYouTube() ? getCurrentTimestamp() : null
      }
    };
    
    const response = await chrome.runtime.sendMessage({
      action: 'addToQueue',
      word: word,
      context: context
    });
    
    if (response.error) throw new Error(response.error);
    
    showToast(`✅ "${word}" added to queue`);
    closePopup();
  } catch (error) {
    showToast(`❌ Error: ${error.message}`, 'error');
  }
}

// Add selected words from sentence
async function addSelectedWords() {
  const checkboxes = popup.querySelectorAll('input[type="checkbox"]:checked');
  const words = Array.from(checkboxes).map(cb => cb.value);
  
  if (words.length === 0) {
    showToast('Please select at least one word', 'warning');
    return;
  }
  
  for (const word of words) {
    await addToQueue(word);
  }
  
  showToast(`✅ Added ${words.length} words to queue`);
  closePopup();
}

// Add to Anki immediately
async function addToAnkiNow(word) {
  try {
    // First add to queue
    const addResponse = await chrome.runtime.sendMessage({
      action: 'addToQueue',
      word: word,
      context: {
        sentence: selectedSentence,
        source: {
          type: detectPageType(),
          url: window.location.href,
          title: document.title
        }
      }
    });
    
    if (addResponse.error) throw new Error(addResponse.error);
    
    // Then enrich and add
    const itemId = addResponse.item.id;
    
    showToast('Processing...', 'info');
    
    // Enrich
    await chrome.runtime.sendMessage({
      action: 'enrichWord',
      itemId: itemId
    });
    
    // Add to Anki
    const ankiResponse = await chrome.runtime.sendMessage({
      action: 'addToAnki',
      itemId: itemId
    });
    
    if (ankiResponse.error) throw new Error(ankiResponse.error);
    
    showToast(`✅ "${word}" added to Anki!`);
    closePopup();
  } catch (error) {
    showToast(`❌ Error: ${error.message}`, 'error');
  }
}

// ==================== YOUTUBE ENHANCEMENTS ====================

function initYouTubeEnhancements() {
  console.log('YouTube enhancements initialized');
  
  // Watch for subtitle changes
  const observer = new MutationObserver(enhanceSubtitles);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial enhancement
  setTimeout(enhanceSubtitles, 2000);
}

function enhanceSubtitles() {
  const subtitles = document.querySelectorAll('.ytp-caption-segment');
  
  subtitles.forEach(subtitle => {
    if (subtitle.classList.contains('vocab-enhanced')) return;
    
    subtitle.classList.add('vocab-enhanced');
    subtitle.style.cursor = 'pointer';
    
    // Split into clickable words
    const text = subtitle.textContent;
    subtitle.innerHTML = text
      .split(' ')
      .map(word => {
        const clean = word.replace(/[^a-zA-Z'-]/g, '');
        if (clean.length < 3) return word;
        
        return `<span class="clickable-word" data-word="${clean}">${word}</span>`;
      })
      .join(' ');
    
    // Add click handlers
    subtitle.querySelectorAll('.clickable-word').forEach(wordSpan => {
      wordSpan.onclick = (e) => {
        e.stopPropagation();
        const word = wordSpan.dataset.word;
        const sentence = subtitle.textContent;
        
        selectedWord = word;
        selectedSentence = sentence;
        
        addToQueue(word);
      };
    });
  });
}

function isYouTube() {
  return window.location.hostname.includes('youtube.com');
}

function getCurrentTimestamp() {
  if (!isYouTube()) return null;
  
  const video = document.querySelector('video');
  if (!video) return null;
  
  const seconds = Math.floor(video.currentTime);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ==================== UTILITIES ====================

function detectPageType() {
  const hostname = window.location.hostname;
  if (hostname.includes('youtube.com')) return 'youtube';
  if (hostname.includes('wikipedia.org')) return 'wikipedia';
  if (hostname.includes('medium.com')) return 'article';
  if (window.location.pathname.endsWith('.pdf')) return 'pdf';
  return 'web';
}

function closePopup() {
  if (popup) {
    popup.remove();
    popup = null;
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `vocab-assistant-toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function handleMessage(request, sender, sendResponse) {
  if (request.action === 'captureSelection') {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      addToQueue(selection);
    }
  }
  
  return true;
}

// Start
init();

console.log('Anki Vocabulary Assistant V2 - Content Script loaded');
