// Artifact Manager Popup Script

// Cross-browser API compatibility
const browser = globalThis.browser || globalThis.chrome;

// Star characters as constants (safe — no user content)
const STAR_FILLED = '\u2605';
const STAR_EMPTY = '\u2606';

// State
const state = {
  tab: 'artifacts',
  artifacts: [],
  tags: [],
  collections: [],
  stats: null,
  connected: false,
  loading: true,
  filters: { search: '', type: '', favorite: false, tag: '', collection: '' }
};

// Type icon map
const TYPE_ICONS = {
  code: { label: '<>', cls: 'code' },
  html: { label: '</>', cls: 'html' },
  image: { label: 'img', cls: 'image' },
  document: { label: 'doc', cls: 'document' }
};

let searchTimer = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Display version from manifest
  const manifest = browser.runtime.getManifest();
  const versionEl = document.getElementById('version-text');
  if (versionEl && manifest.version) {
    versionEl.textContent = `v${manifest.version}`;
  }

  // Setup tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Setup search with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = searchInput.value.trim();
      applyFilters();
    }, 300);
  });

  // Setup type pills
  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => handleTypeFilter(pill.dataset.type));
  });

  // Setup favorites toggle
  document.getElementById('fav-toggle').addEventListener('click', handleFavoriteToggle);

  // Setup tag filter
  document.getElementById('tag-filter').addEventListener('change', (e) => {
    state.filters.tag = e.target.value;
    applyFilters();
  });

  // Setup collection filter
  document.getElementById('collection-filter').addEventListener('change', (e) => {
    state.filters.collection = e.target.value;
    applyFilters();
  });

  // Setup "Open" links
  document.getElementById('auth-open-link').addEventListener('click', openApp);
  document.getElementById('footer-open-link').addEventListener('click', openApp);

  // Settings tab listeners
  document.getElementById('test-btn').addEventListener('click', testConnection);
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('open-btn').addEventListener('click', openApp);

  // Load settings for settings tab
  const settings = await browser.runtime.sendMessage({ action: 'getSettings' });
  document.getElementById('api-url').value = settings.apiUrl || '';

  // Load artifact data
  await loadData();
}

async function loadData(preConnResult) {
  state.loading = true;
  showArtifactsLoading(true);

  // If connection already tested, skip re-testing
  const requests = [
    preConnResult ? Promise.resolve(preConnResult) : browser.runtime.sendMessage({ action: 'testConnection' }),
    browser.runtime.sendMessage({ action: 'getArtifacts', filters: state.filters }),
    browser.runtime.sendMessage({ action: 'getTags' }),
    browser.runtime.sendMessage({ action: 'getCollections' })
  ];

  const [connResult, artifactsResult, tagsResult, collectionsResult] = await Promise.allSettled(requests);

  // Connection
  const conn = connResult.status === 'fulfilled' ? connResult.value : { success: false };
  state.connected = conn.success;
  state.stats = conn.success ? conn.stats : null;

  // Update settings tab connection status
  updateConnectionStatus(conn);

  if (!state.connected) {
    showAuthState();
    state.loading = false;
    return;
  }

  // Artifacts
  const artResult = artifactsResult.status === 'fulfilled' ? artifactsResult.value : { success: false };
  state.artifacts = artResult.success ? (artResult.data || []) : [];

  // Tags
  const tagResult = tagsResult.status === 'fulfilled' ? tagsResult.value : { success: false };
  state.tags = tagResult.success ? (tagResult.data || []) : [];

  // Collections
  const colResult = collectionsResult.status === 'fulfilled' ? collectionsResult.value : { success: false };
  state.collections = colResult.success ? (colResult.data || []) : [];

  state.loading = false;
  populateFilterDropdowns();
  renderArtifactGrid();
}

function switchTab(tabName) {
  state.tab = tabName;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

function showAuthState() {
  document.getElementById('auth-state').style.display = 'block';
  document.getElementById('artifacts-content').style.display = 'none';
}

function showArtifactsLoading(show) {
  document.getElementById('auth-state').style.display = 'none';
  document.getElementById('artifacts-content').style.display = 'block';
  document.getElementById('artifacts-loading').style.display = show ? 'grid' : 'none';
  document.getElementById('artifacts-grid').style.display = show ? 'none' : 'grid';
}

function populateFilterDropdowns() {
  const tagSelect = document.getElementById('tag-filter');
  const colSelect = document.getElementById('collection-filter');

  // Preserve current selection
  const currentTag = state.filters.tag;
  const currentCol = state.filters.collection;

  // Tags
  tagSelect.textContent = '';
  const tagDefault = document.createElement('option');
  tagDefault.value = '';
  tagDefault.textContent = 'All Tags';
  tagSelect.appendChild(tagDefault);
  state.tags.forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag.name;
    opt.textContent = `${tag.name} (${tag.usage_count})`;
    tagSelect.appendChild(opt);
  });
  tagSelect.value = currentTag;
  tagSelect.classList.toggle('hidden', state.tags.length === 0);

  // Collections
  colSelect.textContent = '';
  const colDefault = document.createElement('option');
  colDefault.value = '';
  colDefault.textContent = 'All Collections';
  colSelect.appendChild(colDefault);
  state.collections.forEach(col => {
    const opt = document.createElement('option');
    opt.value = col.slug;
    opt.textContent = `${col.name} (${col.artifact_count})`;
    colSelect.appendChild(opt);
  });
  colSelect.value = currentCol;
  colSelect.classList.toggle('hidden', state.collections.length === 0);
}

function renderArtifactGrid() {
  showArtifactsLoading(false);

  const grid = document.getElementById('artifacts-grid');
  const emptyState = document.getElementById('empty-state');
  const countEl = document.getElementById('artifacts-count');

  grid.textContent = '';

  if (state.artifacts.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';

    // Contextual empty text
    const hasFilters = state.filters.search || state.filters.type ||
      state.filters.favorite || state.filters.tag || state.filters.collection;
    document.getElementById('empty-text').textContent = hasFilters
      ? 'No artifacts match your filters'
      : 'No artifacts yet. Save some from Claude!';

    countEl.textContent = 'Showing 0';
    return;
  }

  emptyState.style.display = 'none';
  grid.style.display = 'grid';

  state.artifacts.forEach(artifact => {
    grid.appendChild(createArtifactCard(artifact));
  });

  const total = state.stats ? state.stats.total_artifacts : state.artifacts.length;
  countEl.textContent = state.artifacts.length === total
    ? `Showing ${state.artifacts.length}`
    : `Showing ${state.artifacts.length} of ${total}`;
}

function createArtifactCard(artifact) {
  const card = document.createElement('div');
  card.className = 'artifact-card';

  const typeKey = artifact.artifact_type || 'other';
  const typeInfo = TYPE_ICONS[typeKey] || { label: '?', cls: 'other' };
  const isFav = artifact.is_favorite === 1;

  // Card header: type icon + fav button
  const header = document.createElement('div');
  header.className = 'card-header';

  const typeIcon = document.createElement('div');
  typeIcon.className = `card-type-icon ${typeInfo.cls}`;
  typeIcon.textContent = typeInfo.label;

  const favBtn = document.createElement('button');
  favBtn.className = `card-fav-btn${isFav ? ' favorited' : ''}`;
  favBtn.textContent = isFav ? STAR_FILLED : STAR_EMPTY;
  favBtn.title = isFav ? 'Unfavorite' : 'Favorite';
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggleFavorite(artifact.id, favBtn);
  });

  header.appendChild(typeIcon);
  header.appendChild(favBtn);

  // Name
  const name = document.createElement('div');
  name.className = 'card-name';
  name.textContent = artifact.name || 'Untitled';
  name.title = artifact.name || 'Untitled';

  // Meta row: collection dot + language badge
  const meta = document.createElement('div');
  meta.className = 'card-meta';

  if (artifact.collection_name) {
    const dot = document.createElement('span');
    dot.className = 'card-collection-dot';
    dot.style.background = artifact.collection_color || '#6366f1';

    const colName = document.createElement('span');
    colName.className = 'card-collection-name';
    colName.textContent = artifact.collection_name;
    colName.title = artifact.collection_name;

    meta.appendChild(dot);
    meta.appendChild(colName);
  }

  if (artifact.language) {
    const badge = document.createElement('span');
    badge.className = 'card-lang-badge';
    badge.textContent = artifact.language;
    meta.appendChild(badge);
  }

  // Action buttons row
  const actions = document.createElement('div');
  actions.className = 'card-actions';

  actions.appendChild(createActionBtn(
    'Copy code',
    'M9 9h13v13H9zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1',
    (e) => { e.stopPropagation(); handleCopyCode(artifact.id); }
  ));

  actions.appendChild(createActionBtn(
    'Copy published link',
    'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
    (e) => { e.stopPropagation(); handleCopyLink(artifact.published_url); },
    !artifact.published_url
  ));

  actions.appendChild(createActionBtn(
    'Open conversation',
    'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
    (e) => { e.stopPropagation(); handleOpenConversation(artifact.conversation_url); },
    !artifact.conversation_url
  ));

  card.appendChild(header);
  card.appendChild(name);
  if (meta.childNodes.length > 0) {
    card.appendChild(meta);
  }
  card.appendChild(actions);

  // Click card to open in web app
  card.addEventListener('click', () => {
    openArtifact(artifact.id);
  });

  return card;
}

function handleTypeFilter(type) {
  state.filters.type = type;

  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.type === type);
  });

  applyFilters();
}

function handleFavoriteToggle() {
  state.filters.favorite = !state.filters.favorite;
  document.getElementById('fav-toggle').classList.toggle('active', state.filters.favorite);
  applyFilters();
}

async function handleToggleFavorite(id, btnEl) {
  // Optimistic update
  const wasFavorited = btnEl.classList.contains('favorited');
  btnEl.classList.toggle('favorited');
  btnEl.textContent = wasFavorited ? STAR_EMPTY : STAR_FILLED;

  // Immutable state update
  state.artifacts = state.artifacts.map(a =>
    a.id === id ? { ...a, is_favorite: wasFavorited ? 0 : 1 } : a
  );

  const result = await browser.runtime.sendMessage({ action: 'toggleFavorite', id });

  if (!result.success) {
    // Revert on failure (immutable)
    btnEl.classList.toggle('favorited');
    btnEl.textContent = wasFavorited ? STAR_FILLED : STAR_EMPTY;
    state.artifacts = state.artifacts.map(a =>
      a.id === id ? { ...a, is_favorite: wasFavorited ? 1 : 0 } : a
    );
  } else if (state.filters.favorite && wasFavorited) {
    // Un-favorited while favorites filter active — re-fetch to remove card
    applyFilters();
  }
}

async function applyFilters() {
  showArtifactsLoading(true);

  const result = await browser.runtime.sendMessage({
    action: 'getArtifacts',
    filters: state.filters
  });

  if (result.success) {
    state.artifacts = result.data || [];
  }

  renderArtifactGrid();
}

function openApp() {
  browser.runtime.sendMessage({ action: 'openArtifactManager' });
}

async function openArtifact(id) {
  const settings = await browser.runtime.sendMessage({ action: 'getSettings' });
  const baseUrl = (settings.apiUrl || '').replace(/\/$/, '');
  browser.tabs.create({ url: `${baseUrl}#artifact-${id}` });
}

// --- Settings Tab Functions (preserved from original) ---

function updateConnectionStatus(result) {
  const statusCard = document.getElementById('status-card');
  const statusText = document.getElementById('status-text');
  const stats = document.getElementById('stats');

  if (result.success) {
    statusCard.className = 'status-card connected';
    statusText.textContent = 'Connected and authenticated';
    stats.style.display = 'grid';

    const s = result.stats || {};
    document.getElementById('stat-total').textContent = s.total_artifacts || 0;
    document.getElementById('stat-favorites').textContent = s.favorites_count || 0;
    document.getElementById('stat-collections').textContent = s.total_collections || 0;
  } else if (result.needsAuth) {
    statusCard.className = 'status-card disconnected';
    statusText.textContent = 'Not authenticated. Open Artifact Manager to log in.';
    stats.style.display = 'none';
  } else {
    statusCard.className = 'status-card disconnected';
    statusText.textContent = `Connection failed: ${result.error}`;
    stats.style.display = 'none';
  }
}

async function testConnection() {
  const testBtn = document.getElementById('test-btn');
  const statusText = document.getElementById('status-text');
  const statusCard = document.getElementById('status-card');

  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  statusText.textContent = 'Checking connection...';
  statusCard.className = 'status-card';
  document.getElementById('stats').style.display = 'none';

  try {
    const result = await browser.runtime.sendMessage({ action: 'testConnection' });
    state.connected = result.success;
    state.stats = result.success ? result.stats : null;
    updateConnectionStatus(result);

    // If connection state changed, reload artifacts tab (pass result to avoid re-testing)
    if (result.success) {
      await loadData(result);
    }
  } catch (error) {
    updateConnectionStatus({ success: false, error: error.message });
  }

  testBtn.disabled = false;
  testBtn.textContent = 'Test Connection';
}

async function saveSettings() {
  const saveBtn = document.getElementById('save-btn');
  const settings = {
    apiUrl: document.getElementById('api-url').value.trim()
  };

  if (!settings.apiUrl) {
    showMessage('Please enter the Artifact Manager URL', 'error');
    return;
  }

  try {
    new URL(settings.apiUrl);
  } catch {
    showMessage('Please enter a valid URL', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    await browser.runtime.sendMessage({ action: 'saveSettings', settings });
    showMessage('Settings saved!', 'success');
    await testConnection();
  } catch (error) {
    showMessage(`Failed to save: ${error.message}`, 'error');
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Settings';
}

function showMessage(text, type) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.className = `message ${type}`;

  setTimeout(() => {
    message.className = 'message';
  }, 5000);
}

// --- Card Action Helpers ---

function createActionBtn(title, svgPath, onClick, hidden) {
  const btn = document.createElement('button');
  btn.className = `card-action-btn${hidden ? ' hidden' : ''}`;
  btn.title = title;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', svgPath);
  svg.appendChild(path);

  btn.appendChild(svg);
  btn.addEventListener('click', onClick);
  return btn;
}

async function handleCopyCode(id) {
  try {
    const result = await browser.runtime.sendMessage({ action: 'getArtifact', id });
    if (!result.success) {
      showPopupToast(result.error || 'Failed to fetch artifact', 'error');
      return;
    }
    const content = result.data.file_content;
    if (!content) {
      showPopupToast('No code content available', 'error');
      return;
    }
    await navigator.clipboard.writeText(content);
    showPopupToast('Code copied to clipboard', 'success');
  } catch (error) {
    showPopupToast('Copy failed', 'error');
  }
}

async function handleCopyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    showPopupToast('Link copied to clipboard', 'success');
  } catch {
    showPopupToast('Copy failed', 'error');
  }
}

function handleOpenConversation(url) {
  browser.tabs.create({ url });
}

function showPopupToast(msg, type) {
  const existing = document.querySelector('.popup-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `popup-toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}
