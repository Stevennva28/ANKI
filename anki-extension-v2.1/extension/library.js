// library.js
const storage = new StorageManager();

async function init() {
  await storage.init();
  loadQueue();
  loadHistory();
  loadAnalytics();
  loadSettings();
}

async function loadQueue() {
  const queue = await chrome.runtime.sendMessage({ action: 'getQueue' });
  const content = document.getElementById('queueContent');
  content.innerHTML = queue.map(item => `
    <div class="word-card">
      <h3>${item.word}</h3>
      <p>${item.context.sentence}</p>
      <small>Status: ${item.status}</small>
    </div>
  `).join('');
}

async function loadHistory() {
  const history = await chrome.runtime.sendMessage({ action: 'getHistory' });
  const content = document.getElementById('historyContent');
  content.innerHTML = history.slice(0, 50).map(item => `
    <div class="word-card">
      <h3>${item.word}</h3>
      <p>${item.enrichedData?.vietnamese || ''}</p>
      <small>Added: ${new Date(item.addedToAnkiAt).toLocaleDateString()}</small>
    </div>
  `).join('');
}

async function loadAnalytics() {
  const stats = await chrome.runtime.sendMessage({ action: 'getStatistics' });
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.queue.total}</div>
      <div class="stat-label">In Queue</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.history.today}</div>
      <div class="stat-label">Added Today</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.history.week}</div>
      <div class="stat-label">This Week</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.streak}</div>
      <div class="stat-label">Day Streak</div>
    </div>
  `;
}

async function loadSettings() {
  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
  document.getElementById('oxfordAppId').value = settings.oxfordAppId || '';
  document.getElementById('oxfordAppKey').value = settings.oxfordAppKey || '';
  document.getElementById('defaultDeck').value = settings.defaultDeck || 'English::Vocabulary';
}

async function saveSettings() {
  const settings = {
    oxfordAppId: document.getElementById('oxfordAppId').value,
    oxfordAppKey: document.getElementById('oxfordAppKey').value,
    defaultDeck: document.getElementById('defaultDeck').value
  };
  await chrome.runtime.sendMessage({ action: 'saveSettings', settings });
  alert('Settings saved!');
}

function showTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(tabName).classList.add('active');
}

document.addEventListener('DOMContentLoaded', init);
