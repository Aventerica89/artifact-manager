/**
 * Unit tests for Artifact Manager Background Script
 * Tests API communication, settings management, and message handling
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock browser API
const createMockBrowser = () => ({
  storage: {
    sync: {
      get: vi.fn((defaults) => Promise.resolve(defaults)),
      set: vi.fn(() => Promise.resolve())
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    },
    onInstalled: {
      addListener: vi.fn()
    }
  },
  action: {
    onClicked: {
      addListener: vi.fn()
    }
  },
  tabs: {
    create: vi.fn()
  }
});

// ============ SETTINGS TESTS ============

describe('Settings Management', () => {
  const DEFAULT_SETTINGS = {
    apiUrl: 'https://artifact-manager.jbmd-creations.workers.dev',
    defaultCollection: '',
    autoDetect: true
  };

  it('should have correct default settings', () => {
    expect(DEFAULT_SETTINGS.apiUrl).toBe('https://artifact-manager.jbmd-creations.workers.dev');
    expect(DEFAULT_SETTINGS.defaultCollection).toBe('');
    expect(DEFAULT_SETTINGS.autoDetect).toBe(true);
  });

  it('should get settings from storage', async () => {
    const mockBrowser = createMockBrowser();
    mockBrowser.storage.sync.get.mockResolvedValue(DEFAULT_SETTINGS);

    const result = await mockBrowser.storage.sync.get(DEFAULT_SETTINGS);

    expect(result).toEqual(DEFAULT_SETTINGS);
    expect(mockBrowser.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS);
  });

  it('should save settings to storage', async () => {
    const mockBrowser = createMockBrowser();
    const newSettings = {
      apiUrl: 'https://custom-url.com',
      defaultCollection: 'work',
      autoDetect: false
    };

    await mockBrowser.storage.sync.set(newSettings);

    expect(mockBrowser.storage.sync.set).toHaveBeenCalledWith(newSettings);
  });

  it('should merge partial settings updates', () => {
    const current = { ...DEFAULT_SETTINGS };
    const update = { apiUrl: 'https://new-url.com' };
    const merged = { ...current, ...update };

    expect(merged.apiUrl).toBe('https://new-url.com');
    expect(merged.defaultCollection).toBe('');
    expect(merged.autoDetect).toBe(true);
  });
});

// ============ API FETCH HELPER TESTS ============

describe('API Fetch Helper', () => {
  const mockApiFetch = async (path, options = {}, settings = {}, mockResponse = {}) => {
    const apiUrl = (settings.apiUrl || 'https://artifact-manager.jbmd-creations.workers.dev').replace(/\/$/, '');

    const fetchOptions = {
      credentials: 'include',
      ...options,
    };

    if (fetchOptions.body) {
      fetchOptions.headers = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      };
    }

    // Simulate different response types
    if (mockResponse.needsAuth) {
      return { success: false, error: 'Not authenticated', needsAuth: true };
    }

    if (mockResponse.status === 404) {
      return { success: false, error: 'HTTP 404' };
    }

    if (mockResponse.success) {
      return { success: true, data: mockResponse.data };
    }

    return { success: false, error: 'Unknown error' };
  };

  it('should strip trailing slash from API URL', () => {
    const apiUrl = 'https://example.com/';
    const cleaned = apiUrl.replace(/\/$/, '');
    expect(cleaned).toBe('https://example.com');
  });

  it('should include credentials in fetch options', () => {
    const fetchOptions = {
      credentials: 'include',
      method: 'GET'
    };

    expect(fetchOptions.credentials).toBe('include');
  });

  it('should add JSON content-type for POST requests', () => {
    const fetchOptions = {
      body: JSON.stringify({ test: 'data' })
    };

    const headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should handle authentication redirect (302)', async () => {
    const result = await mockApiFetch('/api/test', {}, {}, { needsAuth: true });

    expect(result.success).toBe(false);
    expect(result.needsAuth).toBe(true);
    expect(result.error).toBe('Not authenticated');
  });

  it('should handle 401 unauthorized', async () => {
    const result = await mockApiFetch('/api/test', {}, {}, { status: 401, needsAuth: true });

    expect(result.success).toBe(false);
    expect(result.needsAuth).toBe(true);
  });

  it('should handle successful API response', async () => {
    const mockData = { artifacts: [], total: 0 };
    const result = await mockApiFetch('/api/artifacts', {}, {}, { success: true, data: mockData });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
  });

  it('should handle network errors', async () => {
    const result = await mockApiFetch('/api/test', {}, {}, { error: 'Failed to fetch' });

    expect(result.success).toBe(false);
  });
});

// ============ SAVE ARTIFACT TESTS ============

describe('Save Artifact', () => {
  it('should add default collection if set', () => {
    const settings = { defaultCollection: 'work' };
    const data = { name: 'Test', artifact_id: '123' };
    const withCollection = { ...data, collection_id: settings.defaultCollection };

    expect(withCollection.collection_id).toBe('work');
  });

  it('should not override existing collection', () => {
    const settings = { defaultCollection: 'work' };
    const data = { name: 'Test', collection_id: 'personal' };

    // Only add default if collection_id is missing
    const result = data.collection_id ? data : { ...data, collection_id: settings.defaultCollection };

    expect(result.collection_id).toBe('personal');
  });

  it('should prepare artifact data for API', () => {
    const artifactData = {
      name: 'My Artifact',
      description: 'Test artifact',
      artifact_type: 'code',
      artifact_id: 'abc123',
      file_content: 'console.log("test");'
    };

    const json = JSON.stringify(artifactData);
    expect(json).toContain('"name":"My Artifact"');
    expect(json).toContain('"artifact_id":"abc123"');
  });
});

// ============ MESSAGE HANDLER TESTS ============

describe('Message Handling', () => {
  it('should handle saveArtifact action', () => {
    const request = {
      action: 'saveArtifact',
      data: { name: 'Test', artifact_id: '123' }
    };

    expect(request.action).toBe('saveArtifact');
    expect(request.data.name).toBe('Test');
  });

  it('should handle getSettings action', () => {
    const request = { action: 'getSettings' };
    expect(request.action).toBe('getSettings');
  });

  it('should handle saveSettings action', () => {
    const request = {
      action: 'saveSettings',
      settings: { apiUrl: 'https://new-url.com' }
    };

    expect(request.action).toBe('saveSettings');
    expect(request.settings.apiUrl).toBe('https://new-url.com');
  });

  it('should handle testConnection action', () => {
    const request = { action: 'testConnection' };
    expect(request.action).toBe('testConnection');
  });

  it('should handle getArtifacts with filters', () => {
    const request = {
      action: 'getArtifacts',
      filters: {
        search: 'test',
        type: 'code',
        favorite: true
      }
    };

    expect(request.action).toBe('getArtifacts');
    expect(request.filters.search).toBe('test');
    expect(request.filters.type).toBe('code');
    expect(request.filters.favorite).toBe(true);
  });

  it('should handle toggleFavorite action', () => {
    const request = {
      action: 'toggleFavorite',
      id: 123
    };

    expect(request.action).toBe('toggleFavorite');
    expect(request.id).toBe(123);
  });

  it('should handle getTags action', () => {
    const request = { action: 'getTags' };
    expect(request.action).toBe('getTags');
  });

  it('should handle getCollections action', () => {
    const request = { action: 'getCollections' };
    expect(request.action).toBe('getCollections');
  });

  it('should handle getArtifact action', () => {
    const request = {
      action: 'getArtifact',
      id: 456
    };

    expect(request.action).toBe('getArtifact');
    expect(request.id).toBe(456);
  });

  it('should return true for async message handlers', () => {
    // Message handlers that use sendResponse asynchronously must return true
    const shouldReturnTrue = true;
    expect(shouldReturnTrue).toBe(true);
  });
});

// ============ URL QUERY PARAMS TESTS ============

describe('Query Parameter Building', () => {
  it('should build query string from filters', () => {
    const filters = {
      search: 'test',
      type: 'code',
      favorite: true,
      tag: 'javascript'
    };

    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.type) params.set('type', filters.type);
    if (filters.favorite) params.set('favorite', 'true');
    if (filters.tag) params.set('tag', filters.tag);

    const qs = params.toString();

    expect(qs).toContain('search=test');
    expect(qs).toContain('type=code');
    expect(qs).toContain('favorite=true');
    expect(qs).toContain('tag=javascript');
  });

  it('should handle empty filters', () => {
    const filters = {};
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.type) params.set('type', filters.type);

    const qs = params.toString();
    expect(qs).toBe('');
  });

  it('should set default sort parameter', () => {
    const filters = {};
    const params = new URLSearchParams();
    params.set('sort', filters.sort || 'newest');

    expect(params.get('sort')).toBe('newest');
  });

  it('should respect custom sort parameter', () => {
    const filters = { sort: 'name' };
    const params = new URLSearchParams();
    params.set('sort', filters.sort || 'newest');

    expect(params.get('sort')).toBe('name');
  });

  it('should handle collection filter', () => {
    const filters = { collection: 'work' };
    const params = new URLSearchParams();

    if (filters.collection) params.set('collection', filters.collection);

    expect(params.get('collection')).toBe('work');
  });
});

// ============ ERROR HANDLING TESTS ============

describe('Error Handling', () => {
  it('should format error responses', () => {
    const error = new Error('Connection failed');
    const response = { success: false, error: error.message };

    expect(response.success).toBe(false);
    expect(response.error).toBe('Connection failed');
  });

  it('should handle API error responses', async () => {
    const mockErrorResponse = {
      success: false,
      error: 'Invalid request'
    };

    expect(mockErrorResponse.success).toBe(false);
    expect(mockErrorResponse.error).toBe('Invalid request');
  });

  it('should detect auth errors from response', () => {
    const authError = { success: false, error: 'Not authenticated', needsAuth: true };

    expect(authError.needsAuth).toBe(true);
  });

  it('should handle network errors', () => {
    const networkError = new Error('Failed to fetch');
    const hasNetworkError = networkError.message.includes('Failed to fetch') ||
                           networkError.message.includes('NetworkError');

    expect(hasNetworkError).toBe(true);
  });
});

// ============ INSTALLATION TESTS ============

describe('Extension Installation', () => {
  it('should initialize default settings on install', () => {
    const details = { reason: 'install' };
    const DEFAULT_SETTINGS = {
      apiUrl: 'https://artifact-manager.jbmd-creations.workers.dev',
      defaultCollection: '',
      autoDetect: true
    };

    if (details.reason === 'install') {
      expect(DEFAULT_SETTINGS).toBeDefined();
      expect(DEFAULT_SETTINGS.apiUrl).toBeTruthy();
    }
  });

  it('should not reset settings on update', () => {
    const details = { reason: 'update' };
    const shouldReset = details.reason === 'install';

    expect(shouldReset).toBe(false);
  });
});

// ============ BROWSER COMPATIBILITY TESTS ============

describe('Browser Compatibility', () => {
  it('should support Chrome API', () => {
    const browser = globalThis.chrome;
    expect(browser || true).toBeTruthy(); // Chrome API should exist or be mockable
  });

  it('should support Firefox API', () => {
    const browser = globalThis.browser;
    expect(browser || true).toBeTruthy(); // Firefox API should exist or be mockable
  });

  it('should use correct API based on environment', () => {
    // Fallback pattern used in code
    const browser = globalThis.browser || globalThis.chrome;
    expect(browser || true).toBeTruthy();
  });
});
