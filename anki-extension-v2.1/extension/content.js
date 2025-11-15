// content.js - Enhanced Content Script with Security Fixes
import StorageManager from './utils/storage-manager.js';
import APIManager from './utils/api-manager.js';
import {
  validateWord,
  validateSentence,
  sanitizeHTML,
  createSafeElement,
  debounce,
  throttle,
  cleanText,
  VocabError,
  logError,
} from './utils/helpers.js';
import {
  CSS_CLASSES,
  TIMING,
  SOURCE_TYPES,
  LIMITS,
} from './utils/constants.js';

const storage = new StorageManager();
const apiManager = new APIManager();

let selectedWord = '';
let selectedSentence = '';
let popup = null;
let youtubeObserver = null; // Track observer for cleanup

// ==================== INITIALIZATION ====================

async function init() {
  try {
    await storage.init();
    await apiManager.init();

    // Event listeners with debouncing
    document.addEventListener('dblclick', throttle(handleDoubleClick, TIMING.DEBOUNCE_CLICK));
    document.addEventListener('mouseup', debounce(handleSelection, TIMING.DEBOUNCE_INPUT));

    // YouTube-specific enhancements
    if (window.location.hostname.includes('youtube.com')) {
      initYouTubeEnhancements();
    }

    // Listen for messages from background
    chrome.runtime.onMessage.addListener(handleMessage);

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    console.log('Vocab Assistant - Content Script initialized');
  } catch (error) {
    logError('Content Init', error);
  }
}

// ==================== CLEANUP ====================

function cleanup() {
  // Disconnect YouTube observer to prevent memory leak
  if (youtubeObserver) {
    youtubeObserver.disconnect();
    youtubeObserver = null;
  }

  // Remove popup if exists
  closePopup();

  console.log('Vocab Assistant - Content Script cleaned up');
}

// ==================== DOUBLE-CLICK HANDLER ====================

function handleDoubleClick(e) {
  try {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (!text) return;

    // Validate it's a single word
    const words = text.split(/\s+/);
    if (words.length !== 1) return;

    try {
      selectedWord = validateWord(text);
      selectedSentence = getSentenceContext(selection);
      showQuickAddPopup(e.pageX, e.pageY, selectedWord);
    } catch (error) {
      if (error instanceof VocabError) {
        showToast(error.message, 'warning');
      }
    }
  } catch (error) {
    logError('Double Click Handler', error);
  }
}

// ==================== SELECTION HANDLER ====================

function handleSelection(e) {
  try {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Check if it's a multi-word selection (potential sentence)
    if (text && text.split(/\s+/).length > 1 && text.length < LIMITS.MAX_SENTENCE_LENGTH) {
      try {
        selectedSentence = validateSentence(text);
        showSentencePopup(e.pageX, e.pageY, selectedSentence);
      } catch (error) {
        if (error instanceof VocabError) {
          showToast(error.message, 'warning');
        }
      }
    }
  } catch (error) {
    logError('Selection Handler', error);
  }
}

// ==================== GET SENTENCE CONTEXT ====================

function getSentenceContext(selection) {
  try {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const text = cleanText(container.textContent || container.innerText || '');

    // Find sentence boundaries
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const selectedWord = selection.toString();

    for (let sentence of sentences) {
      if (sentence.includes(selectedWord)) {
        return sentence.trim().substring(0, LIMITS.MAX_SENTENCE_LENGTH);
      }
    }

    // Fallback: get surrounding context
    const wordIndex = text.indexOf(selectedWord);
    return text.substring(
      Math.max(0, wordIndex - LIMITS.MAX_CONTEXT_LENGTH),
      Math.min(text.length, wordIndex + selectedWord.length + LIMITS.MAX_CONTEXT_LENGTH)
    ).trim();
  } catch (error) {
    logError('Get Sentence Context', error);
    return '';
  }
}

// ==================== POPUP CREATION (XSS SAFE) ====================

function showQuickAddPopup(x, y, word) {
  closePopup();

  // Create popup container
  popup = createSafeElement('div', '', CSS_CLASSES.POPUP);
  popup.style.left = `${x}px`;
  popup.style.top = `${y + 20}px`;

  // Create header
  const header = createSafeElement('div', '', 'popup-header');
  const title = createSafeElement('h3', word); // Safe: using textContent
  const closeBtn = createSafeElement('button', '×', 'close-btn');
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.onclick = closePopup;

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Create body
  const body = createSafeElement('div', '', 'popup-body');
  const loading = createSafeElement('div', 'Loading...', 'loading');
  body.appendChild(loading);

  // Create actions
  const actions = createSafeElement('div', '', 'popup-actions');

  const addToQueueBtn = createSafeElement('button', '📝 Add to Queue', 'btn btn-primary');
  addToQueueBtn.id = 'addToQueueBtn';
  addToQueueBtn.setAttribute('aria-label', 'Add word to queue');
  addToQueueBtn.onclick = () => addToQueue(word);

  const addNowBtn = createSafeElement('button', '⚡ Add to Anki Now', 'btn btn-secondary');
  addNowBtn.id = 'addNowBtn';
  addNowBtn.setAttribute('aria-label', 'Add word to Anki immediately');
  addNowBtn.onclick = () => addToAnkiNow(word);

  actions.appendChild(addToQueueBtn);
  actions.appendChild(addNowBtn);

  // Assemble popup
  popup.appendChild(header);
  popup.appendChild(body);
  popup.appendChild(actions);

  document.body.appendChild(popup);

  // Fetch quick preview
  fetchQuickPreview(word, body);
}

// ==================== SENTENCE POPUP (XSS SAFE) ====================

function showSentencePopup(x, y, sentence) {
  closePopup();

  popup = createSafeElement('div', '', `${CSS_CLASSES.POPUP} sentence-popup`);
  popup.style.left = `${x}px`;
  popup.style.top = `${y + 20}px`;

  // Header
  const header = createSafeElement('div', '', 'popup-header');
  const title = createSafeElement('h3', 'Sentence Capture');
  const closeBtn = createSafeElement('button', '×', 'close-btn');
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.onclick = closePopup;
  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = createSafeElement('div', '', 'popup-body');
  const sentenceText = createSafeElement('p', sentence.substring(0, 100) + (sentence.length > 100 ? '...' : ''), 'sentence-text');
  body.appendChild(sentenceText);

  // Word selection
  const wordSelect = createSafeElement('div', '', 'word-select');
  const label = createSafeElement('label', 'Select words to add:');
  wordSelect.appendChild(label);

  const wordList = createSafeElement('div', '', 'word-list');
  const words = sentence.split(/\s+/)
    .filter(w => w.length > 3)
    .map(w => w.replace(/[^a-zA-Z]/g, ''))
    .filter(w => w);

  // Create checkboxes safely
  words.forEach(w => {
    const checkLabel = createSafeElement('label', '');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = w;
    const wordSpan = createSafeElement('span', ` ${w}`);

    checkLabel.appendChild(checkbox);
    checkLabel.appendChild(wordSpan);
    wordList.appendChild(checkLabel);
  });

  wordSelect.appendChild(wordList);
  body.appendChild(wordSelect);

  // Actions
  const actions = createSafeElement('div', '', 'popup-actions');
  const addSelectedBtn = createSafeElement('button', 'Add Selected to Queue', 'btn btn-primary');
  addSelectedBtn.id = 'addSelectedBtn';
  addSelectedBtn.setAttribute('aria-label', 'Add selected words to queue');
  addSelectedBtn.onclick = () => addSelectedWords(wordList);
  actions.appendChild(addSelectedBtn);

  // Assemble
  popup.appendChild(header);
  popup.appendChild(body);
  popup.appendChild(actions);

  document.body.appendChild(popup);
}

// ==================== FETCH QUICK PREVIEW ====================

async function fetchQuickPreview(word, bodyElement) {
  try {
    // Check cache first
    const cached = await storage.getCachedData(word);
    if (cached) {
      displayPreview(cached, bodyElement);
      return;
    }

    // Fetch from free dictionary API
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
      vietnamese: await apiManager.getVietnameseTranslation(word),
    };

    displayPreview(preview, bodyElement);
    await storage.cacheData(word, preview, 'quick-preview');
  } catch (error) {
    bodyElement.textContent = '';
    const errorDiv = createSafeElement('div', 'Definition not found', 'error');
    bodyElement.appendChild(errorDiv);
  }
}

// ==================== DISPLAY PREVIEW (XSS SAFE) ====================

function displayPreview(data, bodyElement) {
  if (!popup) return;

  // Clear body
  bodyElement.textContent = '';

  // Create preview container
  const preview = createSafeElement('div', '', 'preview');

  if (data.ipa) {
    const ipa = createSafeElement('div', data.ipa, 'ipa');
    preview.appendChild(ipa);
  }

  if (data.definition) {
    const defDiv = createSafeElement('div', '', 'definition');
    const defLabel = createSafeElement('strong', 'Definition: ');
    const defText = createSafeElement('span', data.definition);
    defDiv.appendChild(defLabel);
    defDiv.appendChild(defText);
    preview.appendChild(defDiv);
  }

  if (data.example) {
    const exDiv = createSafeElement('div', '', 'example');
    const exLabel = createSafeElement('strong', 'Example: ');
    const exText = createSafeElement('span', `"${data.example}"`);
    exDiv.appendChild(exLabel);
    exDiv.appendChild(exText);
    preview.appendChild(exDiv);
  }

  if (data.vietnamese) {
    const vnDiv = createSafeElement('div', '', 'vietnamese');
    const vnLabel = createSafeElement('strong', 'Vietnamese: ');
    const vnText = createSafeElement('span', data.vietnamese);
    vnDiv.appendChild(vnLabel);
    vnDiv.appendChild(vnText);
    preview.appendChild(vnDiv);
  }

  bodyElement.appendChild(preview);
}

// ==================== ADD TO QUEUE ====================

async function addToQueue(word) {
  try {
    const context = {
      sentence: selectedSentence,
      source: {
        type: detectPageType(),
        url: window.location.href,
        title: document.title,
        timestamp: isYouTube() ? getCurrentTimestamp() : null,
      },
    };

    const response = await chrome.runtime.sendMessage({
      action: 'addToQueue',
      word: word,
      context: context,
    });

    if (response.error) throw new Error(response.error);

    showToast(`✅ "${word}" added to queue`, 'success');
    closePopup();
  } catch (error) {
    showToast(`❌ Error: ${error.message}`, 'error');
    logError('Add To Queue', error, { word });
  }
}

// ==================== ADD SELECTED WORDS ====================

async function addSelectedWords(wordListElement) {
  try {
    const checkboxes = wordListElement.querySelectorAll('input[type="checkbox"]:checked');
    const words = Array.from(checkboxes).map(cb => cb.value);

    if (words.length === 0) {
      showToast('Please select at least one word', 'warning');
      return;
    }

    let successCount = 0;
    for (const word of words) {
      try {
        await addToQueue(word);
        successCount++;
      } catch (error) {
        logError('Add Selected Word', error, { word });
      }
    }

    showToast(`✅ Added ${successCount}/${words.length} words to queue`, 'success');
    closePopup();
  } catch (error) {
    showToast(`❌ Error: ${error.message}`, 'error');
    logError('Add Selected Words', error);
  }
}

// ==================== ADD TO ANKI NOW ====================

async function addToAnkiNow(word) {
  try {
    // First add to queue
    const context = {
      sentence: selectedSentence,
      source: {
        type: detectPageType(),
        url: window.location.href,
        title: document.title,
      },
    };

    const addResponse = await chrome.runtime.sendMessage({
      action: 'addToQueue',
      word: word,
      context: context,
    });

    if (addResponse.error) throw new Error(addResponse.error);

    const itemId = addResponse.item.id;
    showToast('⏳ Processing...', 'info');

    // Enrich
    await chrome.runtime.sendMessage({
      action: 'enrichWord',
      itemId: itemId,
    });

    // Add to Anki
    const ankiResponse = await chrome.runtime.sendMessage({
      action: 'addToAnki',
      itemId: itemId,
    });

    if (ankiResponse.error) throw new Error(ankiResponse.error);

    showToast(`✅ "${word}" added to Anki!`, 'success');
    closePopup();
  } catch (error) {
    showToast(`❌ Error: ${error.message}`, 'error');
    logError('Add To Anki Now', error, { word });
  }
}

// ==================== YOUTUBE ENHANCEMENTS ====================

function initYouTubeEnhancements() {
  console.log('YouTube enhancements initialized');

  // Use MutationObserver to watch for subtitle changes
  youtubeObserver = new MutationObserver(debounce(enhanceSubtitles, 500));
  youtubeObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial enhancement
  setTimeout(enhanceSubtitles, TIMING.SUBTITLE_ENHANCE_DELAY);
}

function enhanceSubtitles() {
  const subtitles = document.querySelectorAll('.ytp-caption-segment');

  subtitles.forEach(subtitle => {
    if (subtitle.classList.contains(CSS_CLASSES.VOCAB_ENHANCED)) return;

    subtitle.classList.add(CSS_CLASSES.VOCAB_ENHANCED);
    subtitle.style.cursor = 'pointer';

    // Store original text
    const originalText = subtitle.textContent;

    // Clear and rebuild with clickable words
    subtitle.textContent = '';

    originalText.split(/\s+/).forEach((word, index) => {
      const clean = word.replace(/[^a-zA-Z'-]/g, '');

      if (clean.length < 3) {
        subtitle.appendChild(document.createTextNode(word + ' '));
        return;
      }

      const wordSpan = createSafeElement('span', word, CSS_CLASSES.CLICKABLE_WORD);
      wordSpan.dataset.word = clean;
      wordSpan.setAttribute('role', 'button');
      wordSpan.setAttribute('tabindex', '0');
      wordSpan.setAttribute('aria-label', `Add ${clean} to vocabulary`);

      wordSpan.onclick = (e) => {
        e.stopPropagation();
        const clickedWord = wordSpan.dataset.word;
        selectedWord = clickedWord;
        selectedSentence = subtitle.textContent;
        addToQueue(clickedWord);
      };

      subtitle.appendChild(wordSpan);
      if (index < originalText.split(/\s+/).length - 1) {
        subtitle.appendChild(document.createTextNode(' '));
      }
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

  return Math.floor(video.currentTime);
}

// ==================== UTILITIES ====================

function detectPageType() {
  const hostname = window.location.hostname;
  if (hostname.includes('youtube.com')) return SOURCE_TYPES.YOUTUBE;
  if (hostname.includes('wikipedia.org')) return SOURCE_TYPES.WIKIPEDIA;
  if (hostname.includes('medium.com')) return SOURCE_TYPES.ARTICLE;
  if (window.location.pathname.endsWith('.pdf')) return SOURCE_TYPES.PDF;
  return SOURCE_TYPES.WEB;
}

function closePopup() {
  if (popup) {
    popup.remove();
    popup = null;
  }
}

function showToast(message, type = 'success') {
  const toast = createSafeElement('div', message, `${CSS_CLASSES.TOAST} toast-${type}`);
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, TIMING.TOAST_FADE_DELAY);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), TIMING.TOAST_FADE_OUT);
  }, TIMING.TOAST_DURATION);
}

function handleMessage(request, sender, sendResponse) {
  if (request.action === 'captureSelection') {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      try {
        const word = validateWord(selection);
        addToQueue(word);
      } catch (error) {
        if (error instanceof VocabError) {
          showToast(error.message, 'warning');
        }
      }
    }
  }

  return true;
}

// ==================== START ====================

init();
