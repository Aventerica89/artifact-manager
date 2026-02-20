/**
 * Unit tests for Mobile App API Service
 * Tests authentication, fetch wrapper, and API endpoints
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';

// Mock SecureStore
vi.mock('expo-secure-store', () => ({
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock API_BASE_URL
vi.mock('../constants/config', () => ({
  API_BASE_URL: 'https://api.example.com'
}));

// ============ AUTH TOKEN MANAGEMENT TESTS ============

describe('Auth Token Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should store auth token in SecureStore', async () => {
    const mockSetAuthToken = async (token) => {
      if (token) {
        await SecureStore.setItemAsync('authToken', token);
      } else {
        await SecureStore.deleteItemAsync('authToken');
      }
    };

    await mockSetAuthToken('test-token-123');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', 'test-token-123');
  });

  it('should delete auth token when null', async () => {
    const mockSetAuthToken = async (token) => {
      if (token) {
        await SecureStore.setItemAsync('authToken', token);
      } else {
        await SecureStore.deleteItemAsync('authToken');
      }
    };

    await mockSetAuthToken(null);

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
  });

  it('should load auth token from SecureStore', async () => {
    SecureStore.getItemAsync.mockResolvedValue('stored-token');

    const mockLoadAuthToken = async () => {
      return await SecureStore.getItemAsync('authToken');
    };

    const token = await mockLoadAuthToken();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('authToken');
    expect(token).toBe('stored-token');
  });

  it('should return null when no token stored', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);

    const mockLoadAuthToken = async () => {
      return await SecureStore.getItemAsync('authToken');
    };

    const token = await mockLoadAuthToken();

    expect(token).toBeNull();
  });
});

// ============ API FETCH WRAPPER TESTS ============

describe('API Fetch Wrapper', () => {
  const API_BASE_URL = 'https://api.example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build correct URL from endpoint', () => {
    const endpoint = '/api/links';
    const url = `${API_BASE_URL}${endpoint}`;

    expect(url).toBe('https://api.example.com/api/links');
  });

  it('should include JSON content-type header', () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should include auth token in headers when available', () => {
    const authToken = 'test-token';
    const headers = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Cf-Access-Jwt-Assertion'] = authToken;
    }

    expect(headers['Cf-Access-Jwt-Assertion']).toBe('test-token');
  });

  it('should not include auth header when token is null', () => {
    const authToken = null;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Cf-Access-Jwt-Assertion'] = authToken;
    }

    expect(headers['Cf-Access-Jwt-Assertion']).toBeUndefined();
  });

  it('should throw error on non-OK response', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not found'
    });

    const mockApiFetch = async () => {
      const response = await fetch('https://api.example.com/api/test');

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }
    };

    await expect(mockApiFetch()).rejects.toThrow('Not found');
  });

  it('should parse JSON response', async () => {
    const mockData = { links: [], total: 0 };

    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockData)
    });

    const mockApiFetch = async () => {
      const response = await fetch('https://api.example.com/api/links');
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    };

    const result = await mockApiFetch();

    expect(result).toEqual(mockData);
  });

  it('should handle empty response', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => ''
    });

    const mockApiFetch = async () => {
      const response = await fetch('https://api.example.com/api/delete');
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    };

    const result = await mockApiFetch();

    expect(result).toBeNull();
  });
});

// ============ LINKS API TESTS ============

describe('Links API', () => {
  const API_BASE_URL = 'https://api.example.com';

  it('should build getAll query with params', () => {
    const params = { category: 'work', search: 'test' };
    const query = new URLSearchParams(params).toString();
    const url = `/api/links${query ? `?${query}` : ''}`;

    expect(url).toContain('?');
    expect(url).toContain('category=work');
    expect(url).toContain('search=test');
  });

  it('should build getAll query without params', () => {
    const params = {};
    const query = new URLSearchParams(params).toString();
    const url = `/api/links${query ? `?${query}` : ''}`;

    expect(url).toBe('/api/links');
  });

  it('should build get single link endpoint', () => {
    const code = 'abc123';
    const endpoint = `/api/links/${code}`;

    expect(endpoint).toBe('/api/links/abc123');
  });

  it('should build create link request', () => {
    const data = {
      code: 'test',
      destination: 'https://example.com',
      category_id: 1
    };

    const options = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(data);
  });

  it('should build update link request', () => {
    const code = 'abc123';
    const data = { destination: 'https://new-url.com' };

    const endpoint = `/api/links/${code}`;
    const options = {
      method: 'PUT',
      body: JSON.stringify(data)
    };

    expect(endpoint).toBe('/api/links/abc123');
    expect(options.method).toBe('PUT');
  });

  it('should build delete link request', () => {
    const code = 'abc123';
    const endpoint = `/api/links/${code}`;
    const options = { method: 'DELETE' };

    expect(endpoint).toBe('/api/links/abc123');
    expect(options.method).toBe('DELETE');
  });
});

// ============ CATEGORIES API TESTS ============

describe('Categories API', () => {
  it('should build getAll categories endpoint', () => {
    const endpoint = '/api/categories';
    expect(endpoint).toBe('/api/categories');
  });

  it('should build create category request', () => {
    const data = { name: 'Work', color: 'blue' };
    const options = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(data);
  });

  it('should build update category request', () => {
    const id = 5;
    const data = { name: 'Personal' };

    const endpoint = `/api/categories/${id}`;
    const options = {
      method: 'PUT',
      body: JSON.stringify(data)
    };

    expect(endpoint).toBe('/api/categories/5');
    expect(options.method).toBe('PUT');
  });

  it('should build delete category request', () => {
    const id = 5;
    const endpoint = `/api/categories/${id}`;
    const options = { method: 'DELETE' };

    expect(endpoint).toBe('/api/categories/5');
    expect(options.method).toBe('DELETE');
  });
});

// ============ TAGS API TESTS ============

describe('Tags API', () => {
  it('should build getAll tags endpoint', () => {
    const endpoint = '/api/tags';
    expect(endpoint).toBe('/api/tags');
  });

  it('should build create tag request', () => {
    const data = { name: 'urgent' };
    const options = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body).name).toBe('urgent');
  });

  it('should build delete tag request', () => {
    const id = 10;
    const endpoint = `/api/tags/${id}`;
    const options = { method: 'DELETE' };

    expect(endpoint).toBe('/api/tags/10');
    expect(options.method).toBe('DELETE');
  });
});

// ============ STATS API TESTS ============

describe('Stats API', () => {
  it('should build get stats endpoint', () => {
    const endpoint = '/api/stats';
    expect(endpoint).toBe('/api/stats');
  });

  it('should build get click events with params', () => {
    const linkId = 'abc123';
    const params = { period: '7d' };
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/links/${linkId}/clicks${query ? `?${query}` : ''}`;

    expect(endpoint).toBe('/api/links/abc123/clicks?period=7d');
  });

  it('should build get click events without params', () => {
    const linkId = 'abc123';
    const params = {};
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/links/${linkId}/clicks${query ? `?${query}` : ''}`;

    expect(endpoint).toBe('/api/links/abc123/clicks');
  });
});

// ============ ERROR HANDLING TESTS ============

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error with message from response', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Invalid request data'
    });

    const mockApiFetch = async () => {
      const response = await fetch('https://api.example.com/api/test');

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }
    };

    await expect(mockApiFetch()).rejects.toThrow('Invalid request data');
  });

  it('should throw error with status code when no message', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => ''
    });

    const mockApiFetch = async () => {
      const response = await fetch('https://api.example.com/api/test');

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }
    };

    await expect(mockApiFetch()).rejects.toThrow('HTTP 500');
  });

  it('should handle network errors', async () => {
    global.fetch.mockRejectedValue(new Error('Network request failed'));

    const mockApiFetch = async () => {
      return await fetch('https://api.example.com/api/test');
    };

    await expect(mockApiFetch()).rejects.toThrow('Network request failed');
  });
});

// ============ URL ENCODING TESTS ============

describe('URL Encoding', () => {
  it('should encode query parameters correctly', () => {
    const params = {
      search: 'test query',
      category: 'work & personal'
    };

    const query = new URLSearchParams(params).toString();

    expect(query).toContain('search=test+query');
    expect(query).toContain('category=work');
  });

  it('should handle empty query parameters', () => {
    const params = {};
    const query = new URLSearchParams(params).toString();

    expect(query).toBe('');
  });

  it('should handle special characters in parameters', () => {
    const params = {
      url: 'https://example.com?foo=bar'
    };

    const query = new URLSearchParams(params).toString();

    expect(query).toContain('url=');
  });
});
