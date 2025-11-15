// content-loader.js - Dynamic Module Loader for Content Script
// This file loads the main content script as an ES6 module
// Workaround for Manifest V3 content_scripts limitation

(async function() {
  try {
    // Dynamically import the premium content script as a module
    await import(chrome.runtime.getURL('content-premium.js'));
    console.log('✅ Anki Vocabulary Assistant Pro - Premium UI loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Anki Vocabulary Assistant content script:', error);
    console.error('Please reload the page or reinstall the extension');
  }
})();
