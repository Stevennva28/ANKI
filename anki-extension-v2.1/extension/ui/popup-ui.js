// popup-ui.js - Premium Popup UI with Multiple Meanings
// Material Design 3 inspired UI with advanced features

import { createSafeElement } from '../utils/helpers.js';
import { CSS_CLASSES, TIMING } from '../utils/constants.js';

/**
 * Premium Popup UI Manager
 * Features:
 * - Multiple meanings with context categories
 * - Checkbox selection for meanings
 * - Auto-pronunciation
 * - Visual feedback & animations
 * - Video controls (for YouTube)
 * - Settings panel
 */
export class PremiumPopupUI {
  constructor() {
    this.popup = null;
    this.currentWord = null;
    this.currentData = null;
    this.selectedMeanings = new Set();
    this.audioPlayer = null;
    this.settings = {
      autoPlayAudio: true,
      pauseVideoOnPopup: true,
      showAllMeanings: true,
    };
  }

  /**
   * Show premium popup with word data
   */
  async show(x, y, word, data, options = {}) {
    this.currentWord = word;
    this.currentData = data;
    this.close();

    // Create popup container
    this.popup = createSafeElement('div', '', `${CSS_CLASSES.POPUP} premium-popup`);
    this.popup.style.left = `${Math.min(x, window.innerWidth - 450)}px`;
    this.popup.style.top = `${Math.min(y + 20, window.innerHeight - 600)}px`;

    // Add animation class
    requestAnimationFrame(() => {
      this.popup.classList.add('popup-appear');
    });

    // Build popup structure
    this.popup.appendChild(this.createHeader(word));
    this.popup.appendChild(this.createBody(data));
    this.popup.appendChild(this.createFooter());

    document.body.appendChild(this.popup);

    // Auto-play pronunciation if enabled
    if (this.settings.autoPlayAudio && data.audio) {
      setTimeout(() => this.playAudio(data.audio[0]), 300);
    }

    // Pause video if on YouTube and setting enabled
    if (this.settings.pauseVideoOnPopup && this.isYouTube()) {
      this.pauseVideo();
    }
  }

  /**
   * Create popup header with word, phonetics, and controls
   */
  createHeader(word) {
    const header = createSafeElement('div', '', 'premium-header');

    // Word title
    const titleRow = createSafeElement('div', '', 'title-row');
    const wordTitle = createSafeElement('h2', word, 'word-title');
    const closeBtn = createSafeElement('button', '×', 'close-btn');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.onclick = () => this.close();

    titleRow.appendChild(wordTitle);
    titleRow.appendChild(closeBtn);

    // Phonetics row
    const phoneticsRow = createSafeElement('div', '', 'phonetics-row');

    if (this.currentData.ipa) {
      const ipaSpan = createSafeElement('span', this.currentData.ipa, 'ipa-text');
      phoneticsRow.appendChild(ipaSpan);
    }

    // Audio play buttons (multiple accents if available)
    if (this.currentData.audio && this.currentData.audio.length > 0) {
      const audioButtons = createSafeElement('div', '', 'audio-buttons');

      this.currentData.audio.forEach((audioData, index) => {
        const btn = createSafeElement('button', '', 'audio-btn');
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.5 6.5v3h2.5L9 12V4L6 6.5H3.5zm8.5 1.5c0-1.2-.7-2.2-1.6-2.7v5.4c.9-.5 1.6-1.5 1.6-2.7z"/>
        </svg>`;
        btn.setAttribute('aria-label', `Play pronunciation ${audioData.accent || index + 1}`);
        btn.onclick = () => this.playAudio(audioData);

        if (audioData.accent) {
          const accent = createSafeElement('span', audioData.accent, 'accent-label');
          btn.appendChild(accent);
        }

        audioButtons.appendChild(btn);
      });

      phoneticsRow.appendChild(audioButtons);
    }

    header.appendChild(titleRow);
    if (phoneticsRow.children.length > 0) {
      header.appendChild(phoneticsRow);
    }

    return header;
  }

  /**
   * Create popup body with multiple meanings
   */
  createBody(data) {
    const body = createSafeElement('div', '', 'premium-body');

    // Quick translation
    if (data.vietnamese) {
      const translationCard = createSafeElement('div', '', 'translation-card');
      const translationLabel = createSafeElement('span', '🇻🇳 Vietnamese:', 'translation-label');
      const translationText = createSafeElement('strong', data.vietnamese, 'translation-text');

      translationCard.appendChild(translationLabel);
      translationCard.appendChild(translationText);
      body.appendChild(translationCard);
    }

    // Context sentence (from page)
    if (data.sentence) {
      const contextCard = createSafeElement('div', '', 'context-card');
      const contextLabel = createSafeElement('div', '📝 Context from page:', 'context-label');
      const contextText = createSafeElement('div', this.highlightWord(data.sentence, this.currentWord), 'context-text');

      contextCard.appendChild(contextLabel);
      contextCard.appendChild(contextText);
      body.appendChild(contextCard);
    }

    // Multiple meanings section
    const meaningsSection = this.createMeaningsSection(data.meanings || []);
    body.appendChild(meaningsSection);

    // Additional info (synonyms, antonyms, etc.)
    if (data.synonyms || data.antonyms || data.wordFamily) {
      const additionalInfo = this.createAdditionalInfo(data);
      body.appendChild(additionalInfo);
    }

    return body;
  }

  /**
   * Create meanings section with checkboxes
   */
  createMeaningsSection(meanings) {
    const section = createSafeElement('div', '', 'meanings-section');

    const header = createSafeElement('div', '', 'section-header');
    const title = createSafeElement('h3', 'Select meanings to add:', 'section-title');
    const selectAllBtn = createSafeElement('button', 'Select All', 'select-all-btn');

    selectAllBtn.onclick = () => this.toggleAllMeanings();

    header.appendChild(title);
    header.appendChild(selectAllBtn);
    section.appendChild(header);

    // Group meanings by category/context
    const groupedMeanings = this.groupMeaningsByContext(meanings);

    Object.entries(groupedMeanings).forEach(([category, categoryMeanings]) => {
      const categoryGroup = this.createCategoryGroup(category, categoryMeanings);
      section.appendChild(categoryGroup);
    });

    return section;
  }

  /**
   * Group meanings by context (legal, daily, financial, etc.)
   */
  groupMeaningsByContext(meanings) {
    const groups = {
      'Daily Usage': [],
      'Legal': [],
      'Business/Financial': [],
      'Technical/Scientific': [],
      'Medical': [],
      'Informal/Slang': [],
      'Other': [],
    };

    meanings.forEach(meaning => {
      // Detect category from definition, examples, or tags
      const text = (meaning.definition + ' ' + (meaning.example || '') + ' ' + (meaning.tags || [])).toLowerCase();

      let category = 'Other';

      if (text.match(/\b(law|legal|court|statute|regulation|contract)\b/)) {
        category = 'Legal';
      } else if (text.match(/\b(business|financial|market|economy|trade|invest)\b/)) {
        category = 'Business/Financial';
      } else if (text.match(/\b(technical|scientific|computer|software|algorithm|data)\b/)) {
        category = 'Technical/Scientific';
      } else if (text.match(/\b(medical|health|disease|symptom|treatment|clinical)\b/)) {
        category = 'Medical';
      } else if (text.match(/\b(informal|slang|colloquial|casual)\b/) || meaning.register === 'informal') {
        category = 'Informal/Slang';
      } else if (meaning.register !== 'formal' && !meaning.specialized) {
        category = 'Daily Usage';
      }

      groups[category].push(meaning);
    });

    // Remove empty categories
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }

  /**
   * Create category group with meanings
   */
  createCategoryGroup(category, meanings) {
    const group = createSafeElement('div', '', 'category-group');

    const categoryHeader = createSafeElement('div', '', 'category-header');
    const icon = this.getCategoryIcon(category);
    const categoryTitle = createSafeElement('h4', `${icon} ${category}`, 'category-title');
    const count = createSafeElement('span', `(${meanings.length})`, 'meaning-count');

    categoryHeader.appendChild(categoryTitle);
    categoryHeader.appendChild(count);
    group.appendChild(categoryHeader);

    const meaningsList = createSafeElement('div', '', 'meanings-list');

    meanings.forEach((meaning, index) => {
      const meaningCard = this.createMeaningCard(meaning, `${category}-${index}`);
      meaningsList.appendChild(meaningCard);
    });

    group.appendChild(meaningsList);

    return group;
  }

  /**
   * Create individual meaning card with checkbox
   */
  createMeaningCard(meaning, meaningId) {
    const card = createSafeElement('div', '', 'meaning-card');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = meaningId;
    checkbox.className = 'meaning-checkbox';
    checkbox.checked = true; // Default: all selected
    this.selectedMeanings.add(meaningId);

    checkbox.onchange = () => {
      if (checkbox.checked) {
        this.selectedMeanings.add(meaningId);
        card.classList.add('selected');
      } else {
        this.selectedMeanings.delete(meaningId);
        card.classList.remove('selected');
      }
    };

    const label = document.createElement('label');
    label.htmlFor = meaningId;
    label.className = 'meaning-label';

    const content = createSafeElement('div', '', 'meaning-content');

    // Part of speech badge
    if (meaning.partOfSpeech) {
      const posBadge = createSafeElement('span', meaning.partOfSpeech, 'pos-badge');
      content.appendChild(posBadge);
    }

    // Definition
    const definition = createSafeElement('div', meaning.definition, 'definition-text');
    content.appendChild(definition);

    // Example
    if (meaning.example) {
      const example = createSafeElement('div', '', 'example-text');
      example.innerHTML = `<em>"${meaning.example}"</em>`;
      content.appendChild(example);
    }

    // Vietnamese translation for this meaning
    if (meaning.vietnamese) {
      const vnTranslation = createSafeElement('div', `🇻🇳 ${meaning.vietnamese}`, 'vn-translation');
      content.appendChild(vnTranslation);
    }

    label.appendChild(content);
    card.appendChild(checkbox);
    card.appendChild(label);
    card.classList.add('selected'); // Default state

    return card;
  }

  /**
   * Create additional info section
   */
  createAdditionalInfo(data) {
    const section = createSafeElement('div', '', 'additional-info');

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = '📚 More Information';
    details.appendChild(summary);

    const infoContent = createSafeElement('div', '', 'info-content');

    if (data.synonyms && data.synonyms.length > 0) {
      const synsDiv = createSafeElement('div', '', 'info-item');
      const synsLabel = createSafeElement('strong', 'Synonyms: ');
      const synsText = createSafeElement('span', data.synonyms.join(', '));
      synsDiv.appendChild(synsLabel);
      synsDiv.appendChild(synsText);
      infoContent.appendChild(synsDiv);
    }

    if (data.antonyms && data.antonyms.length > 0) {
      const antsDiv = createSafeElement('div', '', 'info-item');
      const antsLabel = createSafeElement('strong', 'Antonyms: ');
      const antsText = createSafeElement('span', data.antonyms.join(', '));
      antsDiv.appendChild(antsLabel);
      antsDiv.appendChild(antsText);
      infoContent.appendChild(antsDiv);
    }

    if (data.wordFamily) {
      const familyDiv = createSafeElement('div', '', 'info-item');
      const familyLabel = createSafeElement('strong', 'Word Family: ');
      const familyText = createSafeElement('span', Object.values(data.wordFamily).filter(Boolean).join(', '));
      familyDiv.appendChild(familyLabel);
      familyDiv.appendChild(familyText);
      infoContent.appendChild(familyDiv);
    }

    details.appendChild(infoContent);
    section.appendChild(details);

    return section;
  }

  /**
   * Create footer with action buttons
   */
  createFooter() {
    const footer = createSafeElement('div', '', 'premium-footer');

    // Video controls (if on YouTube)
    if (this.isYouTube()) {
      const videoControls = this.createVideoControls();
      footer.appendChild(videoControls);
    }

    // Main action buttons
    const actions = createSafeElement('div', '', 'action-buttons');

    const addQueueBtn = createSafeElement('button', '', 'btn btn-secondary');
    addQueueBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/>
    </svg> Add to Queue`;
    addQueueBtn.onclick = () => this.addToQueue();

    const addAnkiBtn = createSafeElement('button', '', 'btn btn-primary');
    addAnkiBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0L0 8l8 8 8-8-8-8zm0 12l-4-4h8l-4 4z"/>
    </svg> Add to Anki Now`;
    addAnkiBtn.onclick = () => this.addToAnki();

    actions.appendChild(addQueueBtn);
    actions.appendChild(addAnkiBtn);
    footer.appendChild(actions);

    return footer;
  }

  /**
   * Create video controls for YouTube
   */
  createVideoControls() {
    const controls = createSafeElement('div', '', 'video-controls');

    const pauseBtn = createSafeElement('button', '⏸️ Pause', 'video-btn');
    pauseBtn.onclick = () => this.pauseVideo();

    const playBtn = createSafeElement('button', '▶️ Play', 'video-btn');
    playBtn.onclick = () => this.playVideo();

    const rewindBtn = createSafeElement('button', '↩️ -5s', 'video-btn');
    rewindBtn.onclick = () => this.rewindVideo(5);

    const forwardBtn = createSafeElement('button', '↪️ +5s', 'video-btn');
    forwardBtn.onclick = () => this.forwardVideo(5);

    controls.appendChild(pauseBtn);
    controls.appendChild(playBtn);
    controls.appendChild(rewindBtn);
    controls.appendChild(forwardBtn);

    return controls;
  }

  /**
   * Helper functions
   */
  getCategoryIcon(category) {
    const icons = {
      'Daily Usage': '💬',
      'Legal': '⚖️',
      'Business/Financial': '💼',
      'Technical/Scientific': '🔬',
      'Medical': '⚕️',
      'Informal/Slang': '😎',
      'Other': '📖',
    };
    return icons[category] || '📖';
  }

  highlightWord(sentence, word) {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    return sentence.replace(regex, '<mark>$1</mark>');
  }

  toggleAllMeanings() {
    const checkboxes = this.popup.querySelectorAll('.meaning-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(cb => {
      cb.checked = !allChecked;
      cb.dispatchEvent(new Event('change'));
    });
  }

  /**
   * Audio playback
   */
  playAudio(audioData) {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
    }

    this.audioPlayer = new Audio(audioData.url || audioData);
    this.audioPlayer.volume = 0.8;
    this.audioPlayer.play().catch(err => {
      console.log('Audio playback failed:', err);
    });
  }

  /**
   * Video controls
   */
  isYouTube() {
    return window.location.hostname.includes('youtube.com');
  }

  pauseVideo() {
    const video = document.querySelector('video');
    if (video) video.pause();
  }

  playVideo() {
    const video = document.querySelector('video');
    if (video) video.play();
  }

  rewindVideo(seconds) {
    const video = document.querySelector('video');
    if (video) video.currentTime = Math.max(0, video.currentTime - seconds);
  }

  forwardVideo(seconds) {
    const video = document.querySelector('video');
    if (video) video.currentTime = Math.min(video.duration, video.currentTime + seconds);
  }

  /**
   * Actions
   */
  async addToQueue() {
    const selectedData = this.getSelectedMeaningsData();

    // Show loading state
    const btn = this.popup.querySelector('.btn-secondary');
    this.setButtonLoading(btn, true);

    try {
      await chrome.runtime.sendMessage({
        action: 'addToQueue',
        word: this.currentWord,
        data: selectedData,
        context: {
          sentence: this.currentData.sentence,
          url: window.location.href,
          title: document.title,
        },
      });

      this.showSuccess('Added to queue!');
      setTimeout(() => this.close(), 1500);
    } catch (error) {
      this.showError('Failed to add to queue');
      this.setButtonLoading(btn, false);
    }
  }

  async addToAnki() {
    const selectedData = this.getSelectedMeaningsData();

    const btn = this.popup.querySelector('.btn-primary');
    this.setButtonLoading(btn, true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'addToAnkiNow',
        word: this.currentWord,
        data: selectedData,
        context: {
          sentence: this.currentData.sentence,
          url: window.location.href,
          title: document.title,
        },
      });

      if (response.error) throw new Error(response.error);

      this.showSuccess('Added to Anki!');
      setTimeout(() => this.close(), 1500);
    } catch (error) {
      this.showError(error.message || 'Failed to add to Anki');
      this.setButtonLoading(btn, false);
    }
  }

  getSelectedMeaningsData() {
    const selected = [];
    this.selectedMeanings.forEach(id => {
      const checkbox = this.popup.querySelector(`#${CSS.escape(id)}`);
      if (checkbox && checkbox.checked) {
        const card = checkbox.closest('.meaning-card');
        const definition = card.querySelector('.definition-text').textContent;
        const example = card.querySelector('.example-text')?.textContent.replace(/"/g, '') || '';
        const vietnamese = card.querySelector('.vn-translation')?.textContent.replace('🇻🇳 ', '') || '';

        selected.push({ definition, example, vietnamese });
      }
    });

    return {
      ...this.currentData,
      selectedMeanings: selected,
    };
  }

  /**
   * UI feedback
   */
  setButtonLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
      button.setAttribute('aria-busy', 'true');
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      button.setAttribute('aria-busy', 'false');
    }
  }

  showSuccess(message) {
    const toast = createSafeElement('div', `✅ ${message}`, 'toast toast-success');
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  showError(message) {
    const toast = createSafeElement('div', `❌ ${message}`, 'toast toast-error');
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Close popup
   */
  close() {
    if (this.popup) {
      this.popup.classList.remove('popup-appear');
      this.popup.classList.add('popup-disappear');

      setTimeout(() => {
        if (this.popup) {
          this.popup.remove();
          this.popup = null;
        }
      }, 200);
    }

    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
  }
}

export default PremiumPopupUI;
