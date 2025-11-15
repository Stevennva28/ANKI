// content-premium.js - Enhanced Content Script with Premium Popup
import StorageManager from './utils/storage-manager.js';
import APIManager from './utils/api-manager.js';
import PremiumPopupUI from './ui/popup-ui.js';
import {
  validateWord,
  validateSentence,
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
const premiumPopup = new PremiumPopupUI();

let selectedWord = '';
let selectedSentence = '';
let youtubeObserver = null;

// ==================== INITIALIZATION ====================

async function init() {
  try {
    await storage.init();
    await apiManager.init();

    // Load premium CSS
    loadPremiumCSS();

    // Event listeners
    document.addEventListener('dblclick', throttle(handleDoubleClick, TIMING.DEBOUNCE_CLICK));
    document.addEventListener('mouseup', debounce(handleSelection, TIMING.DEBOUNCE_INPUT));

    // YouTube enhancements
    if (window.location.hostname.includes('youtube.com')) {
      initYouTubeEnhancements();
    }

    // Message listener
    chrome.runtime.onMessage.addListener(handleMessage);

    // Cleanup
    window.addEventListener('beforeunload', cleanup);

    console.log('✅ Anki Vocabulary Assistant Pro - Premium UI loaded');
  } catch (error) {
    logError('Content Init', error);
  }
}

// ==================== LOAD PREMIUM CSS ====================

function loadPremiumCSS() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('styles/premium-popup.css');
  document.head.appendChild(link);
}

// ==================== CLEANUP ====================

function cleanup() {
  if (youtubeObserver) {
    youtubeObserver.disconnect();
    youtubeObserver = null;
  }

  premiumPopup.close();

  console.log('Vocab Assistant - Cleaned up');
}

// ==================== DOUBLE-CLICK HANDLER ====================

async function handleDoubleClick(e) {
  try {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (!text) return;

    // Single word only
    const words = text.split(/\s+/);
    if (words.length !== 1) return;

    try {
      selectedWord = validateWord(text);
      selectedSentence = getSentenceContext(selection);

      // Show premium popup with loading
      await showPremiumPopup(e.pageX, e.pageY, selectedWord);
    } catch (error) {
      if (error instanceof VocabError) {
        showToast(error.message, 'warning');
      }
    }
  } catch (error) {
    logError('Double Click Handler', error);
  }
}

// ==================== SHOW PREMIUM POPUP ====================

async function showPremiumPopup(x, y, word) {
  try {
    // Fetch comprehensive word data
    const data = await fetchComprehensiveData(word);

    // Add context sentence
    data.sentence = selectedSentence;

    // Show premium UI
    await premiumPopup.show(x, y, word, data);
  } catch (error) {
    logError('Show Premium Popup', error);
    showToast('Failed to load word data', 'error');
  }
}

// ==================== FETCH COMPREHENSIVE DATA ====================

async function fetchComprehensiveData(word) {
  try {
    // Check cache first
    const cacheKey = `premium_${word}`;
    const cached = await storage.getCachedData(cacheKey);
    if (cached) {
      console.log(`Using cached data for "${word}"`);
      return cached;
    }

    // Fetch from dictionary API
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

    if (!response.ok) {
      throw new Error('Word not found');
    }

    const apiData = await response.json();
    const entry = apiData[0];

    // Process multiple meanings
    const meanings = [];

    entry.meanings.forEach(meaning => {
      meaning.definitions.forEach((def, index) => {
        if (index < 3) { // Limit to 3 definitions per part of speech
          meanings.push({
            partOfSpeech: meaning.partOfSpeech,
            definition: def.definition,
            example: def.example || '',
            synonyms: def.synonyms || meaning.synonyms || [],
            antonyms: def.antonyms || meaning.antonyms || [],
          });
        }
      });
    });

    // Get Vietnamese translation
    const vietnamese = await apiManager.getVietnameseTranslation(word);

    // Get audio URLs
    const audio = entry.phonetics
      .filter(p => p.audio)
      .map(p => ({
        url: p.audio,
        accent: detectAccent(p.audio),
      }));

    // Extract word family
    const wordFamily = extractWordFamily(meanings);

    const comprehensiveData = {
      word,
      ipa: entry.phonetic || entry.phonetics[0]?.text || '',
      vietnamese,
      meanings,
      audio,
      synonyms: [...new Set(meanings.flatMap(m => m.synonyms))].slice(0, 5),
      antonyms: [...new Set(meanings.flatMap(m => m.antonyms))].slice(0, 5),
      wordFamily,
    };

    // Cache for 7 days
    await storage.cacheData(cacheKey, comprehensiveData, 'premium', 7 * 24 * 60 * 60 * 1000);

    return comprehensiveData;
  } catch (error) {
    logError('Fetch Comprehensive Data', error);

    // Fallback to basic data
    return {
      word,
      ipa: '',
      vietnamese: await apiManager.getVietnameseTranslation(word).catch(() => ''),
      meanings: [{
        partOfSpeech: '',
        definition: 'Definition not available',
        example: '',
      }],
      audio: [],
      synonyms: [],
      antonyms: [],
      wordFamily: {},
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

function detectAccent(audioUrl) {
  if (audioUrl.includes('-us.') || audioUrl.includes('/us/')) return 'US';
  if (audioUrl.includes('-uk.') || audioUrl.includes('/uk/')) return 'UK';
  if (audioUrl.includes('-au.') || audioUrl.includes('/au/')) return 'AU';
  return '';
}

function extractWordFamily(meanings) {
  const family = {};

  meanings.forEach(m => {
    const pos = m.partOfSpeech.toLowerCase();
    if (pos.includes('noun')) family.noun = m.definition.split(' ')[0];
    if (pos.includes('verb')) family.verb = m.definition.split(' ')[0];
    if (pos.includes('adjective')) family.adjective = m.definition.split(' ')[0];
    if (pos.includes('adverb')) family.adverb = m.definition.split(' ')[0];
  });

  return family;
}

function getSentenceContext(selection) {
  try {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const text = cleanText(container.textContent || container.innerText || '');

    // Find sentence containing the word
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const selectedWord = selection.toString();

    for (let sentence of sentences) {
      if (sentence.includes(selectedWord)) {
        return sentence.trim().substring(0, LIMITS.MAX_SENTENCE_LENGTH);
      }
    }

    // Fallback
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

// ==================== SELECTION HANDLER ====================

function handleSelection(e) {
  try {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Multi-word selection (sentence)
    if (text && text.split(/\s+/).length > 1 && text.length < LIMITS.MAX_SENTENCE_LENGTH) {
      try {
        selectedSentence = validateSentence(text);
        // Could show sentence popup here
        console.log('Sentence selected:', selectedSentence);
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

// ==================== YOUTUBE ENHANCEMENTS ====================

function initYouTubeEnhancements() {
  console.log('YouTube enhancements initialized');

  youtubeObserver = new MutationObserver(debounce(enhanceSubtitles, 500));
  youtubeObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setTimeout(enhanceSubtitles, TIMING.SUBTITLE_ENHANCE_DELAY);
}

function enhanceSubtitles() {
  const subtitles = document.querySelectorAll('.ytp-caption-segment');

  subtitles.forEach(subtitle => {
    if (subtitle.classList.contains(CSS_CLASSES.VOCAB_ENHANCED)) return;

    subtitle.classList.add(CSS_CLASSES.VOCAB_ENHANCED);
    subtitle.style.cursor = 'pointer';

    const originalText = subtitle.textContent;
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

      wordSpan.onclick = async (e) => {
        e.stopPropagation();
        const clickedWord = wordSpan.dataset.word;
        selectedWord = clickedWord;
        selectedSentence = subtitle.textContent;

        // Show premium popup
        const rect = wordSpan.getBoundingClientRect();
        await showPremiumPopup(rect.left, rect.bottom, clickedWord);
      };

      subtitle.appendChild(wordSpan);
      if (index < originalText.split(/\s+/).length - 1) {
        subtitle.appendChild(document.createTextNode(' '));
      }
    });
  });
}

// ==================== UTILITIES ====================

function isYouTube() {
  return window.location.hostname.includes('youtube.com');
}

function detectPageType() {
  const hostname = window.location.hostname;
  if (hostname.includes('youtube.com')) return SOURCE_TYPES.YOUTUBE;
  if (hostname.includes('wikipedia.org')) return SOURCE_TYPES.WIKIPEDIA;
  if (hostname.includes('medium.com')) return SOURCE_TYPES.ARTICLE;
  if (window.location.pathname.endsWith('.pdf')) return SOURCE_TYPES.PDF;
  return SOURCE_TYPES.WEB;
}

function showToast(message, type = 'success') {
  const toast = createSafeElement('div', message, `toast toast-${type}`);
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, TIMING.TOAST_DURATION);
}

function handleMessage(request, sender, sendResponse) {
  if (request.action === 'captureSelection') {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      try {
        const word = validateWord(selection);
        // Send to background to add to queue
        chrome.runtime.sendMessage({
          action: 'addToQueue',
          word,
          context: {
            sentence: selectedSentence,
            url: window.location.href,
            title: document.title,
          },
        });
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
