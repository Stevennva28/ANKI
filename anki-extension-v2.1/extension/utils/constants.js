// constants.js - Centralized constants and configuration

// ==================== TIMING CONSTANTS ====================
export const TIMING = {
  // Delays
  ENRICH_DELAY: 2000,              // Auto-enrich delay (2 seconds)
  BATCH_DELAY: 1000,               // Delay between batch items (1 second)
  ANKI_DELAY: 500,                 // Delay between Anki operations (0.5 seconds)
  TOAST_DURATION: 3000,            // Toast notification duration (3 seconds)
  TOAST_FADE_DELAY: 10,            // Toast fade-in delay (10ms)
  TOAST_FADE_OUT: 300,             // Toast fade-out duration (300ms)
  DEBOUNCE_CLICK: 300,             // Debounce for click events (300ms)
  DEBOUNCE_INPUT: 500,             // Debounce for input events (500ms)
  POPUP_REFRESH: 10000,            // Popup auto-refresh interval (10 seconds)
  SUBTITLE_ENHANCE_DELAY: 2000,    // YouTube subtitle enhancement delay (2 seconds)

  // Cache
  CACHE_TTL: 7 * 24 * 60 * 60 * 1000,  // Cache TTL (7 days)
  CACHE_CLEANUP_INTERVAL: 1440,         // Cache cleanup interval (24 hours in minutes)

  // Retry
  RETRY_MAX_ATTEMPTS: 4,           // Max retry attempts
  RETRY_BASE_DELAY: 2000,          // Base delay for exponential backoff (2 seconds)
  RETRY_MAX_DELAY: 16000,          // Max retry delay (16 seconds)

  // Rate limiting
  RATE_LIMIT_WINDOW: 60000,        // Rate limit window (1 minute)
  RATE_LIMIT_MAX_REQUESTS: 30,     // Max requests per window
};

// ==================== SIZE LIMITS ====================
export const LIMITS = {
  MAX_WORD_LENGTH: 50,             // Maximum word length
  MAX_WORDS_IN_PHRASE: 5,          // Maximum words in a phrase
  MAX_SENTENCE_LENGTH: 500,        // Maximum sentence length
  MIN_WORD_LENGTH: 2,              // Minimum word length
  MAX_BATCH_SIZE: 10,              // Maximum batch size
  MAX_QUEUE_DISPLAY: 10,           // Maximum queue items in popup
  MAX_HISTORY_DISPLAY: 50,         // Maximum history items to display
  MAX_SYNONYMS: 5,                 // Maximum synonyms to fetch
  MAX_ANTONYMS: 5,                 // Maximum antonyms to fetch
  MAX_EXAMPLES: 3,                 // Maximum example sentences
  MAX_AUDIO_FILES: 3,              // Maximum audio files per word
  MAX_CONTEXT_LENGTH: 200,         // Maximum context length (chars)
};

// ==================== ERROR CODES ====================
export const ERROR_CODES = {
  // Validation errors (1xxx)
  INVALID_WORD: 1001,
  WORD_TOO_SHORT: 1002,
  WORD_TOO_LONG: 1003,
  INVALID_CHARACTERS: 1004,
  TOO_MANY_WORDS: 1005,
  SENTENCE_TOO_LONG: 1006,
  MISSING_REQUIRED_FIELD: 1007,

  // Storage errors (2xxx)
  STORAGE_INIT_FAILED: 2001,
  ITEM_NOT_FOUND: 2002,
  STORAGE_QUOTA_EXCEEDED: 2003,
  DATABASE_ERROR: 2004,

  // API errors (3xxx)
  API_KEY_MISSING: 3001,
  API_REQUEST_FAILED: 3002,
  API_RATE_LIMIT: 3003,
  API_TIMEOUT: 3004,
  API_INVALID_RESPONSE: 3005,
  NETWORK_ERROR: 3006,

  // Anki errors (4xxx)
  ANKI_NOT_CONNECTED: 4001,
  ANKI_DECK_NOT_FOUND: 4002,
  ANKI_NOTE_TYPE_NOT_FOUND: 4003,
  ANKI_ADD_NOTE_FAILED: 4004,
  ANKI_DUPLICATE_NOTE: 4005,

  // Enrichment errors (5xxx)
  ENRICHMENT_FAILED: 5001,
  NO_DEFINITION_FOUND: 5002,
  NO_AUDIO_FOUND: 5003,
  TRANSLATION_FAILED: 5004,

  // AI errors (6xxx)
  AI_NOT_CONFIGURED: 6001,
  AI_REQUEST_FAILED: 6002,
  AI_RATE_LIMIT: 6003,
  AI_INVALID_RESPONSE: 6004,
  INVALID_CONFIG: 6005,

  // General errors (9xxx)
  UNKNOWN_ERROR: 9001,
  OPERATION_CANCELLED: 9002,
  PERMISSION_DENIED: 9003,
};

// ==================== ERROR MESSAGES ====================
export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_WORD]: 'Invalid word format',
  [ERROR_CODES.WORD_TOO_SHORT]: 'Word is too short (minimum {min} characters)',
  [ERROR_CODES.WORD_TOO_LONG]: 'Word is too long (maximum {max} characters)',
  [ERROR_CODES.INVALID_CHARACTERS]: 'Word contains invalid characters',
  [ERROR_CODES.TOO_MANY_WORDS]: 'Too many words (maximum {max} words)',
  [ERROR_CODES.SENTENCE_TOO_LONG]: 'Sentence is too long (maximum {max} characters)',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Missing required field: {field}',

  [ERROR_CODES.STORAGE_INIT_FAILED]: 'Failed to initialize storage',
  [ERROR_CODES.ITEM_NOT_FOUND]: 'Item not found',
  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded',
  [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',

  [ERROR_CODES.API_KEY_MISSING]: 'API key not configured: {api}',
  [ERROR_CODES.API_REQUEST_FAILED]: 'API request failed: {api}',
  [ERROR_CODES.API_RATE_LIMIT]: 'Rate limit exceeded for {api}',
  [ERROR_CODES.API_TIMEOUT]: 'API request timeout: {api}',
  [ERROR_CODES.API_INVALID_RESPONSE]: 'Invalid API response from {api}',
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection error',

  [ERROR_CODES.ANKI_NOT_CONNECTED]: 'Cannot connect to Anki. Please ensure Anki is running with AnkiConnect installed.',
  [ERROR_CODES.ANKI_DECK_NOT_FOUND]: 'Deck not found: {deck}',
  [ERROR_CODES.ANKI_NOTE_TYPE_NOT_FOUND]: 'Note type not found: {noteType}',
  [ERROR_CODES.ANKI_ADD_NOTE_FAILED]: 'Failed to add note to Anki',
  [ERROR_CODES.ANKI_DUPLICATE_NOTE]: 'This note already exists in Anki',

  [ERROR_CODES.ENRICHMENT_FAILED]: 'Failed to enrich word',
  [ERROR_CODES.NO_DEFINITION_FOUND]: 'No definition found for this word',
  [ERROR_CODES.NO_AUDIO_FOUND]: 'No audio pronunciation found',
  [ERROR_CODES.TRANSLATION_FAILED]: 'Translation failed',

  [ERROR_CODES.AI_NOT_CONFIGURED]: 'AI is not configured. Please add your API key in settings.',
  [ERROR_CODES.AI_REQUEST_FAILED]: 'AI request failed. Please check your API key and try again.',
  [ERROR_CODES.AI_RATE_LIMIT]: 'AI rate limit exceeded. Please wait and try again.',
  [ERROR_CODES.AI_INVALID_RESPONSE]: 'Invalid response from AI',
  [ERROR_CODES.INVALID_CONFIG]: 'Invalid configuration',

  [ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error occurred',
  [ERROR_CODES.OPERATION_CANCELLED]: 'Operation was cancelled',
  [ERROR_CODES.PERMISSION_DENIED]: 'Permission denied',
};

// ==================== ANKI CONSTANTS ====================
export const ANKI = {
  CONNECT_URL: 'http://localhost:8765',
  VERSION: 6,
  DEFAULT_DECK: 'English::Vocabulary',

  // Field names that extension generates
  EXTENSION_FIELDS: {
    WORD: 'word',
    IPA: 'ipa',
    VIETNAMESE: 'vietnamese',
    PART_OF_SPEECH: 'partOfSpeech',
    AUDIO: 'audio',
    EXAMPLE_EN: 'exampleEn',
    EXAMPLE_VN: 'exampleVn',
    DEFINITION: 'definition',
    IMAGE: 'image',
    SYNONYMS: 'synonyms',
    ANTONYMS: 'antonyms',
    COLLOCATIONS: 'collocations',
    WORD_FAMILY: 'wordFamily',
    ETYMOLOGY: 'etymology',
    HINTS: 'hints',
  },
};

// ==================== API SOURCES ====================
export const API_SOURCES = {
  DICTIONARY: {
    OXFORD: 'oxford',
    CAMBRIDGE: 'cambridge',
    MERRIAM_WEBSTER: 'merriam-webster',
    FREE: 'free',
  },
  AUDIO: {
    FORVO: 'forvo',
    OXFORD: 'oxford',
    CAMBRIDGE: 'cambridge',
    GOOGLE_TTS: 'google-tts',
  },
};

// ==================== SOURCE TYPES ====================
export const SOURCE_TYPES = {
  YOUTUBE: 'youtube',
  WIKIPEDIA: 'wikipedia',
  ARTICLE: 'article',
  PDF: 'pdf',
  WEB: 'web',
};

// ==================== SOURCE ICONS ====================
export const SOURCE_ICONS = {
  [SOURCE_TYPES.YOUTUBE]: '🎥',
  [SOURCE_TYPES.WIKIPEDIA]: '📖',
  [SOURCE_TYPES.ARTICLE]: '📰',
  [SOURCE_TYPES.PDF]: '📄',
  [SOURCE_TYPES.WEB]: '🌐',
};

// ==================== STATUS TYPES ====================
export const STATUS = {
  PENDING: 'pending',
  ENRICHING: 'enriching',
  ENRICHED: 'enriched',
  ADDING: 'adding',
  ADDED: 'added',
  ERROR: 'error',
};

// ==================== PRIORITY LEVELS ====================
export const PRIORITY = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
};

// ==================== REGEX PATTERNS ====================
export const PATTERNS = {
  WORD: /^[a-zA-Z'-]+$/,
  PHRASE: /^[a-zA-Z\s'-]+$/,
  SENTENCE_END: /[.!?]+/g,
  SPECIAL_CHARS: /[^a-zA-Z\s'-]/g,
  HTML_TAGS: /<[^>]*>/g,
  MULTIPLE_SPACES: /\s+/g,
};

// ==================== NOTIFICATION TYPES ====================
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// ==================== CSS CLASSES ====================
export const CSS_CLASSES = {
  POPUP: 'vocab-assistant-popup',
  TOAST: 'vocab-assistant-toast',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
  CLICKABLE_WORD: 'clickable-word',
  VOCAB_ENHANCED: 'vocab-enhanced',
};

// ==================== STORAGE KEYS ====================
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  QUEUE: 'queue',
  HISTORY: 'history',
  CACHE: 'cache',
};

// ==================== DEFAULT FIELD MAPPING ====================
export const DEFAULT_FIELD_MAPPING = {
  'Word': 'word',
  'IPA': 'ipa',
  'Vietnamese': 'vietnamese',
  'Part_of_Speech': 'partOfSpeech',
  'Audio': 'audio',
  'Example_EN': 'exampleEn',
  'Example_VN': 'exampleVn',
  'English_Definition': 'definition',
  'Image': 'image',
  'Synonyms': 'synonyms',
  'Antonyms': 'antonyms',
  'Collocations': 'collocations',
  'Word_Family': 'wordFamily',
  'Etymology': 'etymology',
  'Hints': 'hints',
};
