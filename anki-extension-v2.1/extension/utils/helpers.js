// helpers.js - Utility helper functions

import {
  TIMING,
  LIMITS,
  ERROR_CODES,
  ERROR_MESSAGES,
  PATTERNS,
} from './constants.js';

// ==================== ERROR HANDLING ====================

/**
 * Custom error class with error code
 */
export class VocabError extends Error {
  constructor(code, params = {}) {
    const template = ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
    const message = Object.keys(params).reduce(
      (msg, key) => msg.replace(`{${key}}`, params[key]),
      template
    );
    super(message);
    this.code = code;
    this.params = params;
    this.name = 'VocabError';
  }
}

/**
 * Format error for user display
 */
export function formatError(error) {
  if (error instanceof VocabError) {
    return {
      code: error.code,
      message: error.message,
      params: error.params,
    };
  }
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: error.message || 'Unknown error occurred',
  };
}

/**
 * Log error with context
 */
export function logError(context, error, data = {}) {
  console.error(`[${context}]`, {
    error: formatError(error),
    timestamp: new Date().toISOString(),
    ...data,
  });
}

// ==================== INPUT VALIDATION ====================

/**
 * Validate word input
 * @throws {VocabError} If validation fails
 */
export function validateWord(word) {
  if (!word || typeof word !== 'string') {
    throw new VocabError(ERROR_CODES.INVALID_WORD);
  }

  const trimmed = word.trim();

  if (trimmed.length < LIMITS.MIN_WORD_LENGTH) {
    throw new VocabError(ERROR_CODES.WORD_TOO_SHORT, { min: LIMITS.MIN_WORD_LENGTH });
  }

  if (trimmed.length > LIMITS.MAX_WORD_LENGTH) {
    throw new VocabError(ERROR_CODES.WORD_TOO_LONG, { max: LIMITS.MAX_WORD_LENGTH });
  }

  const words = trimmed.split(/\s+/);
  if (words.length > LIMITS.MAX_WORDS_IN_PHRASE) {
    throw new VocabError(ERROR_CODES.TOO_MANY_WORDS, { max: LIMITS.MAX_WORDS_IN_PHRASE });
  }

  if (!PATTERNS.PHRASE.test(trimmed)) {
    throw new VocabError(ERROR_CODES.INVALID_CHARACTERS);
  }

  return trimmed.toLowerCase();
}

/**
 * Validate sentence input
 */
export function validateSentence(sentence) {
  if (!sentence || typeof sentence !== 'string') {
    return '';
  }

  const trimmed = sentence.trim();

  if (trimmed.length > LIMITS.MAX_SENTENCE_LENGTH) {
    throw new VocabError(ERROR_CODES.SENTENCE_TOO_LONG, { max: LIMITS.MAX_SENTENCE_LENGTH });
  }

  return trimmed;
}

/**
 * Validate object has required fields
 */
export function validateRequiredFields(obj, fields) {
  for (const field of fields) {
    if (!(field in obj) || obj[field] === null || obj[field] === undefined) {
      throw new VocabError(ERROR_CODES.MISSING_REQUIRED_FIELD, { field });
    }
  }
}

// ==================== SANITIZATION ====================

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(str) {
  if (!str) return '';

  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create safe DOM element with text content
 */
export function createSafeElement(tag, text, className = '') {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

/**
 * Strip HTML tags from string
 */
export function stripHTML(str) {
  if (!str) return '';
  return str.replace(PATTERNS.HTML_TAGS, '');
}

/**
 * Clean and normalize text
 */
export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(PATTERNS.HTML_TAGS, '')
    .replace(PATTERNS.MULTIPLE_SPACES, ' ')
    .trim();
}

// ==================== ASYNC UTILITIES ====================

/**
 * Delay/sleep function
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff(fn, maxAttempts = TIMING.RETRY_MAX_ATTEMPTS) {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on validation errors
      if (error instanceof VocabError && error.code < 2000) {
        throw error;
      }

      if (attempt < maxAttempts - 1) {
        const delayMs = Math.min(
          TIMING.RETRY_BASE_DELAY * Math.pow(2, attempt),
          TIMING.RETRY_MAX_DELAY
        );
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Debounce function
 */
export function debounce(func, wait = TIMING.DEBOUNCE_INPUT) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit = TIMING.DEBOUNCE_CLICK) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Process array in batches with concurrency limit
 */
export async function processBatch(items, processor, concurrency = 3, delayMs = TIMING.BATCH_DELAY) {
  const results = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );

    results.push(...batchResults.map((result, idx) => ({
      item: batch[idx],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    })));

    // Delay between batches (except for last batch)
    if (i + concurrency < items.length) {
      await delay(delayMs);
    }
  }

  return results;
}

// ==================== RATE LIMITING ====================

class RateLimiter {
  constructor(maxRequests = TIMING.RATE_LIMIT_MAX_REQUESTS, windowMs = TIMING.RATE_LIMIT_WINDOW) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // key -> [timestamps]
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(key) {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = validRequests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      throw new VocabError(ERROR_CODES.API_RATE_LIMIT, {
        api: key,
        waitTime: Math.ceil(waitTime / 1000) + 's'
      });
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  /**
   * Reset rate limit for key
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll() {
    this.requests.clear();
  }
}

export const rateLimiter = new RateLimiter();

// ==================== FETCH UTILITIES ====================

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new VocabError(ERROR_CODES.API_TIMEOUT, { api: url });
    }
    throw error;
  }
}

/**
 * Fetch with retry and rate limiting
 */
export async function fetchWithRetry(url, options = {}, rateLimitKey = null) {
  // Check rate limit
  if (rateLimitKey) {
    await rateLimiter.checkLimit(rateLimitKey);
  }

  return retryWithBackoff(async () => {
    const response = await fetchWithTimeout(url, options);

    if (!response.ok) {
      if (response.status === 429) {
        throw new VocabError(ERROR_CODES.API_RATE_LIMIT, { api: rateLimitKey || url });
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  });
}

// ==================== STRING UTILITIES ====================

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str, maxLength, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Format time duration (seconds to MM:SS)
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==================== ARRAY UTILITIES ====================

/**
 * Remove duplicates from array
 */
export function unique(arr) {
  return [...new Set(arr)];
}

/**
 * Shuffle array
 */
export function shuffle(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Group array by key
 */
export function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const value = typeof key === 'function' ? key(item) : item[key];
    (groups[value] = groups[value] || []).push(item);
    return groups;
  }, {});
}

// ==================== OBJECT UTILITIES ====================

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge objects deeply
 */
export function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Pick specific keys from object
 */
export function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) result[key] = obj[key];
    return result;
  }, {});
}

/**
 * Omit specific keys from object
 */
export function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VocabError,
    formatError,
    logError,
    validateWord,
    validateSentence,
    validateRequiredFields,
    sanitizeHTML,
    createSafeElement,
    stripHTML,
    cleanText,
    delay,
    retryWithBackoff,
    debounce,
    throttle,
    processBatch,
    rateLimiter,
    fetchWithTimeout,
    fetchWithRetry,
    capitalize,
    truncate,
    formatTimestamp,
    formatDuration,
    unique,
    shuffle,
    groupBy,
    deepClone,
    deepMerge,
    pick,
    omit,
  };
}
