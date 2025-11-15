// content-loader.js - Dynamic Module Loader for Content Script
// This file loads the main content.js as an ES6 module
// Workaround for Manifest V3 content_scripts limitation

(async function() {
  try {
    // Dynamically import the main content script as a module
    const module = await import(chrome.runtime.getURL('content.js'));

    console.log('✅ Anki Vocabulary Assistant - Content script loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Anki Vocabulary Assistant content script:', error);

    // Fallback: Show user-friendly error
    console.error('Please reload the page or reinstall the extension');
  }
})();
