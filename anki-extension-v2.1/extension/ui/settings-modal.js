// settings-modal.js - Comprehensive Settings Modal
// Popup settings for AI, triggers, UI preferences

import { createSafeElement } from '../utils/helpers.js';

/**
 * Settings Modal UI
 */
export class SettingsModal {
  constructor() {
    this.modal = null;
    this.settings = {};
    this.onSave = null;
  }

  /**
   * Show settings modal
   */
  async show(currentSettings, onSaveCallback) {
    this.settings = { ...currentSettings };
    this.onSave = onSaveCallback;

    this.close();

    // Create modal
    this.modal = createSafeElement('div', '', 'settings-modal-overlay');
    this.modal.onclick = (e) => {
      if (e.target === this.modal) this.close();
    };

    const modalContent = createSafeElement('div', '', 'settings-modal-content');

    // Header
    const header = createSafeElement('div', '', 'settings-modal-header');
    const title = createSafeElement('h2', '⚙️ Settings', 'settings-modal-title');
    const closeBtn = createSafeElement('button', '×', 'settings-modal-close');
    closeBtn.onclick = () => this.close();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Tabs
    const tabs = this.createTabs();
    const tabContents = this.createTabContents();

    // Footer
    const footer = this.createFooter();

    modalContent.appendChild(header);
    modalContent.appendChild(tabs);
    modalContent.appendChild(tabContents);
    modalContent.appendChild(footer);

    this.modal.appendChild(modalContent);
    document.body.appendChild(this.modal);

    // Show animation
    requestAnimationFrame(() => {
      this.modal.classList.add('show');
    });

    // Initialize first tab
    this.switchTab('ai');
  }

  /**
   * Create tabs navigation
   */
  createTabs() {
    const tabsContainer = createSafeElement('div', '', 'settings-tabs');

    const tabsData = [
      { id: 'ai', label: '🤖 AI Models', icon: '🤖' },
      { id: 'triggers', label: '⌨️ Triggers', icon: '⌨️' },
      { id: 'ui', label: '🎨 UI', icon: '🎨' },
      { id: 'anki', label: '🎴 Anki', icon: '🎴' },
    ];

    tabsData.forEach(tab => {
      const button = createSafeElement('button', tab.label, 'settings-tab');
      button.dataset.tab = tab.id;
      button.onclick = () => this.switchTab(tab.id);
      tabsContainer.appendChild(button);
    });

    return tabsContainer;
  }

  /**
   * Create tab contents
   */
  createTabContents() {
    const container = createSafeElement('div', '', 'settings-tab-contents');

    container.appendChild(this.createAITab());
    container.appendChild(this.createTriggersTab());
    container.appendChild(this.createUITab());
    container.appendChild(this.createAnkiTab());

    return container;
  }

  /**
   * AI Models tab
   */
  createAITab() {
    const tab = createSafeElement('div', '', 'settings-tab-content');
    tab.dataset.tab = 'ai';

    // Description
    const desc = createSafeElement('p', 'Configure AI models for enhanced vocabulary learning. AI can generate examples, mnemonics, and context-aware explanations.', 'settings-description');
    tab.appendChild(desc);

    // Model selection
    const modelSelect = createSafeElement('div', '', 'settings-group');
    const modelLabel = createSafeElement('label', 'Select AI Model:');
    const modelDropdown = document.createElement('select');
    modelDropdown.id = 'aiModel';
    modelDropdown.className = 'settings-select';

    ['claude', 'openai', 'gemini'].forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = {
        claude: 'Claude (Anthropic) - Recommended',
        openai: 'ChatGPT (OpenAI)',
        gemini: 'Gemini (Google)',
      }[model];
      if (this.settings.selectedAIModel === model) option.selected = true;
      modelDropdown.appendChild(option);
    });

    modelSelect.appendChild(modelLabel);
    modelSelect.appendChild(modelDropdown);
    tab.appendChild(modelSelect);

    // API Keys
    const apiKeysSection = createSafeElement('div', '', 'settings-group');
    const apiKeysTitle = createSafeElement('h3', 'API Keys', 'settings-subtitle');
    apiKeysSection.appendChild(apiKeysTitle);

    // Claude API key
    const claudeGroup = this.createAPIKeyInput('claude', 'Claude API Key', 'sk-ant-...');
    apiKeysSection.appendChild(claudeGroup);

    // OpenAI API key
    const openaiGroup = this.createAPIKeyInput('openai', 'OpenAI API Key', 'sk-...');
    apiKeysSection.appendChild(openaiGroup);

    // Gemini API key
    const geminiGroup = this.createAPIKeyInput('gemini', 'Gemini API Key', 'AIza...');
    apiKeysSection.appendChild(geminiGroup);

    tab.appendChild(apiKeysSection);

    // Usage stats (if available)
    if (this.settings.aiUsageStats) {
      const statsSection = createSafeElement('div', '', 'settings-group');
      const statsTitle = createSafeElement('h3', 'Usage Statistics', 'settings-subtitle');
      statsSection.appendChild(statsTitle);

      const statsTable = this.createUsageStatsTable();
      statsSection.appendChild(statsTable);

      tab.appendChild(statsSection);
    }

    return tab;
  }

  /**
   * Create API key input
   */
  createAPIKeyInput(model, label, placeholder) {
    const group = createSafeElement('div', '', 'settings-input-group');

    const labelEl = createSafeElement('label', label);
    labelEl.htmlFor = `api-key-${model}`;

    const input = document.createElement('input');
    input.type = 'password';
    input.id = `api-key-${model}`;
    input.className = 'settings-input';
    input.placeholder = placeholder;
    input.value = this.settings.aiApiKeys?.[model] || '';

    const toggle = createSafeElement('button', '👁️', 'settings-toggle-password');
    toggle.onclick = () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      toggle.textContent = input.type === 'password' ? '👁️' : '🙈';
    };

    const hint = createSafeElement('small', `Get your API key from ${model === 'claude' ? 'console.anthropic.com' : model === 'openai' ? 'platform.openai.com' : 'aistudio.google.com'}`, 'settings-hint');

    group.appendChild(labelEl);
    const inputWrapper = createSafeElement('div', '', 'settings-input-wrapper');
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(toggle);
    group.appendChild(inputWrapper);
    group.appendChild(hint);

    return group;
  }

  /**
   * Create usage stats table
   */
  createUsageStatsTable() {
    const table = document.createElement('table');
    table.className = 'settings-stats-table';

    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Model</th><th>Requests</th><th>Tokens</th><th>Cost ($)</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    ['claude', 'openai', 'gemini'].forEach(model => {
      const stats = this.settings.aiUsageStats?.[model] || { requests: 0, tokens: 0, cost: 0 };
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${model.charAt(0).toUpperCase() + model.slice(1)}</td>
        <td>${stats.requests}</td>
        <td>${stats.tokens.toLocaleString()}</td>
        <td>$${stats.cost.toFixed(4)}</td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    return table;
  }

  /**
   * Triggers tab
   */
  createTriggersTab() {
    const tab = createSafeElement('div', '', 'settings-tab-content');
    tab.dataset.tab = 'triggers';

    const desc = createSafeElement('p', 'Configure how you want to trigger the vocabulary popup.', 'settings-description');
    tab.appendChild(desc);

    // Trigger methods
    const triggersGroup = createSafeElement('div', '', 'settings-group');
    const triggersTitle = createSafeElement('h3', 'Trigger Methods', 'settings-subtitle');
    triggersGroup.appendChild(triggersTitle);

    const triggers = [
      { id: 'doubleClick', label: 'Double-click on word', default: true },
      { id: 'ctrlClick', label: 'Ctrl + Click on word', default: false },
      { id: 'altClick', label: 'Alt + Click on word', default: false },
      { id: 'selection', label: 'Selection + Hotkey (Alt+A)', default: true },
      { id: 'contextMenu', label: 'Right-click context menu', default: false },
    ];

    triggers.forEach(trigger => {
      const checkbox = this.createCheckbox(
        trigger.id,
        trigger.label,
        this.settings.triggers?.[trigger.id] ?? trigger.default
      );
      triggersGroup.appendChild(checkbox);
    });

    tab.appendChild(triggersGroup);

    return tab;
  }

  /**
   * UI Preferences tab
   */
  createUITab() {
    const tab = createSafeElement('div', '', 'settings-tab-content');
    tab.dataset.tab = 'ui';

    const desc = createSafeElement('p', 'Customize the user interface and behavior.', 'settings-description');
    tab.appendChild(desc);

    // Audio settings
    const audioGroup = createSafeElement('div', '', 'settings-group');
    const audioTitle = createSafeElement('h3', 'Audio', 'settings-subtitle');
    audioGroup.appendChild(audioTitle);

    audioGroup.appendChild(this.createCheckbox(
      'autoPlayAudio',
      'Auto-play pronunciation when popup opens',
      this.settings.autoPlayAudio ?? true
    ));

    tab.appendChild(audioGroup);

    // Video settings
    const videoGroup = createSafeElement('div', '', 'settings-group');
    const videoTitle = createSafeElement('h3', 'Video (YouTube)', 'settings-subtitle');
    videoGroup.appendChild(videoTitle);

    videoGroup.appendChild(this.createCheckbox(
      'pauseVideoOnPopup',
      'Auto-pause video when popup opens',
      this.settings.pauseVideoOnPopup ?? true
    ));

    tab.appendChild(videoGroup);

    // Theme settings
    const themeGroup = createSafeElement('div', '', 'settings-group');
    const themeTitle = createSafeElement('h3', 'Theme', 'settings-subtitle');
    themeGroup.appendChild(themeTitle);

    themeGroup.appendChild(this.createCheckbox(
      'darkMode',
      'Enable dark mode',
      this.settings.darkMode ?? false
    ));

    tab.appendChild(themeGroup);

    return tab;
  }

  /**
   * Anki tab
   */
  createAnkiTab() {
    const tab = createSafeElement('div', '', 'settings-tab-content');
    tab.dataset.tab = 'anki';

    const desc = createSafeElement('p', 'Configure Anki integration and field mapping.', 'settings-description');
    tab.appendChild(desc);

    const link = createSafeElement('p', '');
    const linkText = document.createElement('a');
    linkText.href = '#';
    linkText.textContent = 'Open advanced Anki settings in Library →';
    linkText.onclick = (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
      this.close();
    };
    link.appendChild(linkText);
    tab.appendChild(link);

    return tab;
  }

  /**
   * Create checkbox
   */
  createCheckbox(id, label, checked) {
    const wrapper = createSafeElement('div', '', 'settings-checkbox-wrapper');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = checked;

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(labelEl);

    return wrapper;
  }

  /**
   * Create footer with save/cancel buttons
   */
  createFooter() {
    const footer = createSafeElement('div', '', 'settings-modal-footer');

    const cancelBtn = createSafeElement('button', 'Cancel', 'btn btn-secondary');
    cancelBtn.onclick = () => this.close();

    const saveBtn = createSafeElement('button', 'Save Settings', 'btn btn-primary');
    saveBtn.onclick = () => this.save();

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    return footer;
  }

  /**
   * Switch tab
   */
  switchTab(tabId) {
    // Update tab buttons
    const tabs = this.modal.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update tab contents
    const contents = this.modal.querySelectorAll('.settings-tab-content');
    contents.forEach(content => {
      if (content.dataset.tab === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  /**
   * Save settings
   */
  async save() {
    // Collect all settings
    const newSettings = {
      selectedAIModel: document.getElementById('aiModel')?.value,
      aiApiKeys: {
        claude: document.getElementById('api-key-claude')?.value || '',
        openai: document.getElementById('api-key-openai')?.value || '',
        gemini: document.getElementById('api-key-gemini')?.value || '',
      },
      triggers: {
        doubleClick: document.getElementById('doubleClick')?.checked,
        ctrlClick: document.getElementById('ctrlClick')?.checked,
        altClick: document.getElementById('altClick')?.checked,
        selection: document.getElementById('selection')?.checked,
        contextMenu: document.getElementById('contextMenu')?.checked,
      },
      autoPlayAudio: document.getElementById('autoPlayAudio')?.checked,
      pauseVideoOnPopup: document.getElementById('pauseVideoOnPopup')?.checked,
      darkMode: document.getElementById('darkMode')?.checked,
    };

    // Call save callback
    if (this.onSave) {
      await this.onSave(newSettings);
    }

    this.close();
  }

  /**
   * Close modal
   */
  close() {
    if (this.modal) {
      this.modal.classList.remove('show');
      setTimeout(() => {
        if (this.modal) {
          this.modal.remove();
          this.modal = null;
        }
      }, 300);
    }
  }
}

export default SettingsModal;
