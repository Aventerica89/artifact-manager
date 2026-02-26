// Artifact Manager Background Script
// Handles API communication with the Artifact Manager

// Cross-browser API compatibility
const browser = globalThis.browser || globalThis.chrome;

// Default settings
const DEFAULT_SETTINGS = {
  apiUrl: 'https://artifact-manager.jbmd-creations.workers.dev',
  defaultCollection: '',
  autoDetect: true
};

// Get settings from storage
async function getSettings() {
  const result = await browser.storage.sync.get(DEFAULT_SETTINGS);
  return result;
}

// Save settings to storage
async function saveSettings(settings) {
  await browser.storage.sync.set(settings);
}

// Shared API fetch helper — handles auth redirects, CORS, and error normalization
async function apiFetch(path, options = {}) {
  const settings = await getSettings();
  const apiUrl = settings.apiUrl.replace(/\/$/, '');

  const fetchOptions = {
    credentials: 'include',
    ...options,
  };

  // Add JSON content-type for requests with a body
  if (fetchOptions.body) {
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };
  }

  try {
    const response = await fetch(`${apiUrl}${path}`, fetchOptions);

    // Cloudflare Access redirect detection
    if (response.type === 'opaqueredirect' || response.status === 302 || response.status === 303) {
      return { success: false, error: 'Not authenticated', needsAuth: true };
    }

    if (response.status === 0) {
      return { success: false, error: 'Not authenticated', needsAuth: true };
    }

    if (response.status === 401) {
      return { success: false, error: 'Not authenticated', needsAuth: true };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Artifact Manager: API error', error);

    if (error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('did not match')) {
      return { success: false, error: 'Not authenticated', needsAuth: true };
    }

    return { success: false, error: error.message };
  }
}

// Save artifact to Artifact Manager
async function saveArtifact(data) {
  const settings = await getSettings();

  // Add default collection if set
  if (settings.defaultCollection && !data.collection_id) {
    data = { ...data, collection_id: settings.defaultCollection };
  }

  const result = await apiFetch('/api/artifacts', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return { success: true, id: result.data.id };
}

// Test connection to Artifact Manager
async function testConnection() {
  const result = await apiFetch('/api/stats', { redirect: 'manual' });

  if (!result.success) {
    return result;
  }

  return { success: true, stats: result.data };
}

// Fetch artifacts with optional filters
async function getArtifacts(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.type) params.set('type', filters.type);
  if (filters.favorite) params.set('favorite', 'true');
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.collection) params.set('collection', filters.collection);
  params.set('sort', filters.sort || 'newest');

  const qs = params.toString();
  return apiFetch(`/api/artifacts${qs ? `?${qs}` : ''}`);
}

// Toggle favorite on an artifact
async function toggleFavorite(id) {
  return apiFetch(`/api/artifacts/${id}/favorite`, { method: 'POST' });
}

// Fetch all tags
async function getTags() {
  return apiFetch('/api/tags');
}

// Fetch all collections
async function getCollections() {
  return apiFetch('/api/collections');
}

// Fetch a single artifact by ID (includes file_content, published_url, conversation_url)
async function getArtifact(id) {
  return apiFetch(`/api/artifacts/${id}`);
}

// Dispatch table for async message handlers that call sendResponse
const MESSAGE_HANDLERS = {
  saveArtifact:    (req) => saveArtifact(req.data),
  getSettings:     (_)   => getSettings(),
  saveSettings:    (req) => saveSettings(req.settings).then(() => ({ success: true })),
  testConnection:  (_)   => testConnection(),
  getArtifacts:    (req) => getArtifacts(req.filters),
  toggleFavorite:  (req) => toggleFavorite(req.id),
  getTags:         (_)   => getTags(),
  getCollections:  (_)   => getCollections(),
  getArtifact:     (req) => getArtifact(req.id),
};

// Listen for messages from content script and popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handler = MESSAGE_HANDLERS[request.action];
  if (handler) {
    handler(request)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  // openArtifactManager: fire-and-forget, no sendResponse needed
  if (request.action === 'openArtifactManager') {
    getSettings().then(settings => {
      browser.tabs.create({ url: settings.apiUrl });
    });
    return false;
  }
});

// Handle extension icon click - open popup
browser.action.onClicked.addListener((tab) => {
  // Popup is handled by manifest, this is a fallback
});

// Initialize default settings on install
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await saveSettings(DEFAULT_SETTINGS);
  }
});
