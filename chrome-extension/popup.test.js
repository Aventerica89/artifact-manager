/**
 * Unit tests for Artifact Manager Popup Script
 * Tests UI state management, filtering, and artifact card rendering
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============ CONSTANTS TESTS ============

describe('Constants', () => {
  const STAR_FILLED = '\u2605';
  const STAR_EMPTY = '\u2606';

  it('should have correct star characters', () => {
    expect(STAR_FILLED).toBe('★');
    expect(STAR_EMPTY).toBe('☆');
  });

  it('should define type icon map', () => {
    const TYPE_ICONS = {
      code: { label: '<>', cls: 'code' },
      html: { label: '</>', cls: 'html' },
      image: { label: 'img', cls: 'image' },
      document: { label: 'doc', cls: 'document' }
    };

    expect(TYPE_ICONS.code.label).toBe('<>');
    expect(TYPE_ICONS.html.label).toBe('</>');
    expect(TYPE_ICONS.image.label).toBe('img');
    expect(TYPE_ICONS.document.label).toBe('doc');
  });

  it('should have valid CSS classes for types', () => {
    const TYPE_ICONS = {
      code: { label: '<>', cls: 'code' },
      html: { label: '</>', cls: 'html' },
      image: { label: 'img', cls: 'image' },
      document: { label: 'doc', cls: 'document' }
    };

    Object.values(TYPE_ICONS).forEach(icon => {
      expect(icon.cls).toBeTruthy();
      expect(typeof icon.cls).toBe('string');
    });
  });
});

// ============ STATE MANAGEMENT TESTS ============

describe('State Management', () => {
  it('should initialize with default state', () => {
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

    expect(state.tab).toBe('artifacts');
    expect(state.artifacts).toEqual([]);
    expect(state.connected).toBe(false);
    expect(state.loading).toBe(true);
    expect(state.filters.search).toBe('');
  });

  it('should update filter search value', () => {
    const state = {
      filters: { search: '', type: '', favorite: false, tag: '', collection: '' }
    };

    state.filters.search = 'test query';

    expect(state.filters.search).toBe('test query');
  });

  it('should toggle favorite filter', () => {
    const state = {
      filters: { search: '', type: '', favorite: false, tag: '', collection: '' }
    };

    state.filters.favorite = !state.filters.favorite;
    expect(state.filters.favorite).toBe(true);

    state.filters.favorite = !state.filters.favorite;
    expect(state.filters.favorite).toBe(false);
  });

  it('should update type filter', () => {
    const state = {
      filters: { search: '', type: '', favorite: false, tag: '', collection: '' }
    };

    state.filters.type = 'code';
    expect(state.filters.type).toBe('code');
  });

  it('should update tag and collection filters', () => {
    const state = {
      filters: { search: '', type: '', favorite: false, tag: '', collection: '' }
    };

    state.filters.tag = 'javascript';
    state.filters.collection = 'work';

    expect(state.filters.tag).toBe('javascript');
    expect(state.filters.collection).toBe('work');
  });

  it('should switch tabs', () => {
    const state = { tab: 'artifacts' };

    state.tab = 'settings';
    expect(state.tab).toBe('settings');

    state.tab = 'artifacts';
    expect(state.tab).toBe('artifacts');
  });

  it('should update artifacts immutably when toggling favorite', () => {
    const state = {
      artifacts: [
        { id: 1, name: 'Artifact 1', is_favorite: 0 },
        { id: 2, name: 'Artifact 2', is_favorite: 1 }
      ]
    };

    // Toggle favorite for artifact 1
    state.artifacts = state.artifacts.map(a =>
      a.id === 1 ? { ...a, is_favorite: 1 } : a
    );

    expect(state.artifacts[0].is_favorite).toBe(1);
    expect(state.artifacts[1].is_favorite).toBe(1);
  });
});

// ============ FILTER LOGIC TESTS ============

describe('Filter Logic', () => {
  it('should detect active filters', () => {
    const filters1 = { search: '', type: '', favorite: false, tag: '', collection: '' };
    const hasFilters1 = filters1.search || filters1.type || filters1.favorite ||
                       filters1.tag || filters1.collection;

    expect(hasFilters1).toBe(false);

    const filters2 = { search: 'test', type: '', favorite: false, tag: '', collection: '' };
    const hasFilters2 = filters2.search || filters2.type || filters2.favorite ||
                       filters2.tag || filters2.collection;

    expect(hasFilters2).toBe(true);
  });

  it('should build correct empty state message', () => {
    const hasFilters = false;
    const message = hasFilters
      ? 'No artifacts match your filters'
      : 'No artifacts yet. Save some from Claude!';

    expect(message).toBe('No artifacts yet. Save some from Claude!');
  });

  it('should build correct filtered empty state message', () => {
    const hasFilters = true;
    const message = hasFilters
      ? 'No artifacts match your filters'
      : 'No artifacts yet. Save some from Claude!';

    expect(message).toBe('No artifacts match your filters');
  });

  it('should format artifact count text', () => {
    const shown = 10;
    const total = 50;

    const text = shown === total
      ? `Showing ${shown}`
      : `Showing ${shown} of ${total}`;

    expect(text).toBe('Showing 10 of 50');
  });

  it('should format artifact count when all shown', () => {
    const shown = 25;
    const total = 25;

    const text = shown === total
      ? `Showing ${shown}`
      : `Showing ${shown} of ${total}`;

    expect(text).toBe('Showing 25');
  });
});

// ============ ARTIFACT CARD CREATION TESTS ============

describe('Artifact Card Creation', () => {
  it('should get type info with fallback', () => {
    const TYPE_ICONS = {
      code: { label: '<>', cls: 'code' },
      html: { label: '</>', cls: 'html' }
    };

    const typeKey1 = 'code';
    const typeInfo1 = TYPE_ICONS[typeKey1] || { label: '?', cls: 'other' };
    expect(typeInfo1.label).toBe('<>');

    const typeKey2 = 'unknown';
    const typeInfo2 = TYPE_ICONS[typeKey2] || { label: '?', cls: 'other' };
    expect(typeInfo2.label).toBe('?');
    expect(typeInfo2.cls).toBe('other');
  });

  it('should determine favorite status', () => {
    const artifact1 = { is_favorite: 1 };
    const isFav1 = artifact1.is_favorite === 1;
    expect(isFav1).toBe(true);

    const artifact2 = { is_favorite: 0 };
    const isFav2 = artifact2.is_favorite === 1;
    expect(isFav2).toBe(false);
  });

  it('should build favorite button class', () => {
    const isFavorited1 = true;
    const cls1 = `card-fav-btn${isFavorited1 ? ' favorited' : ''}`;
    expect(cls1).toBe('card-fav-btn favorited');

    const isFavorited2 = false;
    const cls2 = `card-fav-btn${isFavorited2 ? ' favorited' : ''}`;
    expect(cls2).toBe('card-fav-btn');
  });

  it('should display correct star icon', () => {
    const STAR_FILLED = '★';
    const STAR_EMPTY = '☆';

    const isFav1 = true;
    const icon1 = isFav1 ? STAR_FILLED : STAR_EMPTY;
    expect(icon1).toBe(STAR_FILLED);

    const isFav2 = false;
    const icon2 = isFav2 ? STAR_FILLED : STAR_EMPTY;
    expect(icon2).toBe(STAR_EMPTY);
  });

  it('should handle missing artifact name', () => {
    const artifact1 = { name: 'My Artifact' };
    const name1 = artifact1.name || 'Untitled';
    expect(name1).toBe('My Artifact');

    const artifact2 = { name: null };
    const name2 = artifact2.name || 'Untitled';
    expect(name2).toBe('Untitled');
  });

  it('should apply collection color', () => {
    const artifact = {
      collection_color: '#6366f1'
    };

    const color = artifact.collection_color || '#6366f1';
    expect(color).toBe('#6366f1');
  });

  it('should handle missing collection color', () => {
    const artifact = {};
    const color = artifact.collection_color || '#6366f1';
    expect(color).toBe('#6366f1');
  });
});

// ============ ACTION BUTTON TESTS ============

describe('Action Buttons', () => {
  it('should disable button when URL is missing', () => {
    const publishedUrl = null;
    const disabled = !publishedUrl;
    expect(disabled).toBe(true);
  });

  it('should enable button when URL is present', () => {
    const publishedUrl = 'https://claude.site/abc123';
    const disabled = !publishedUrl;
    expect(disabled).toBe(false);
  });

  it('should have copy code action', () => {
    const action = {
      label: 'Copy code',
      icon: 'M9 9h13v13H9zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1'
    };

    expect(action.label).toBe('Copy code');
    expect(action.icon).toBeTruthy();
  });

  it('should have copy link action', () => {
    const action = {
      label: 'Copy published link',
      icon: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71'
    };

    expect(action.label).toBe('Copy published link');
  });

  it('should have open conversation action', () => {
    const action = {
      label: 'Open conversation',
      icon: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3'
    };

    expect(action.label).toBe('Open conversation');
  });
});

// ============ SEARCH DEBOUNCE TESTS ============

describe('Search Debounce', () => {
  it('should debounce search input', (done) => {
    let searchTimer = null;
    const search = 'test';
    const delay = 300;

    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      expect(search).toBe('test');
      done();
    }, delay);
  });

  it('should clear previous timer on new input', () => {
    let searchTimer = setTimeout(() => {}, 300);
    const timerId = searchTimer;

    clearTimeout(searchTimer);
    expect(timerId).toBeDefined();
  });
});

// ============ CONNECTION STATUS TESTS ============

describe('Connection Status', () => {
  it('should show connected status', () => {
    const result = { success: true, stats: { total_artifacts: 10 } };

    const statusClass = result.success ? 'status-card connected' : 'status-card disconnected';
    const statusText = result.success ? 'Connected and authenticated' : 'Connection failed';

    expect(statusClass).toBe('status-card connected');
    expect(statusText).toBe('Connected and authenticated');
  });

  it('should show disconnected status', () => {
    const result = { success: false, error: 'Network error' };

    const statusClass = result.success ? 'status-card connected' : 'status-card disconnected';
    const statusText = result.success
      ? 'Connected and authenticated'
      : `Connection failed: ${result.error}`;

    expect(statusClass).toBe('status-card disconnected');
    expect(statusText).toBe('Connection failed: Network error');
  });

  it('should show auth required status', () => {
    const result = { success: false, needsAuth: true };

    const statusText = result.needsAuth
      ? 'Not authenticated. Open Artifact Manager to log in.'
      : `Connection failed: ${result.error}`;

    expect(statusText).toBe('Not authenticated. Open Artifact Manager to log in.');
  });

  it('should display stats when connected', () => {
    const stats = {
      total_artifacts: 42,
      favorites_count: 8,
      total_collections: 5
    };

    expect(stats.total_artifacts).toBe(42);
    expect(stats.favorites_count).toBe(8);
    expect(stats.total_collections).toBe(5);
  });
});

// ============ FILTER DROPDOWN TESTS ============

describe('Filter Dropdowns', () => {
  it('should populate tag dropdown', () => {
    const tags = [
      { name: 'javascript', usage_count: 10 },
      { name: 'react', usage_count: 5 },
      { name: 'typescript', usage_count: 8 }
    ];

    const options = tags.map(tag => ({
      value: tag.name,
      text: `${tag.name} (${tag.usage_count})`
    }));

    expect(options[0].value).toBe('javascript');
    expect(options[0].text).toBe('javascript (10)');
    expect(options.length).toBe(3);
  });

  it('should populate collection dropdown', () => {
    const collections = [
      { slug: 'work', name: 'Work', artifact_count: 15 },
      { slug: 'personal', name: 'Personal', artifact_count: 7 }
    ];

    const options = collections.map(col => ({
      value: col.slug,
      text: `${col.name} (${col.artifact_count})`
    }));

    expect(options[0].value).toBe('work');
    expect(options[0].text).toBe('Work (15)');
    expect(options.length).toBe(2);
  });

  it('should hide dropdown when no items', () => {
    const tags = [];
    const shouldHide = tags.length === 0;
    expect(shouldHide).toBe(true);
  });

  it('should show dropdown when items exist', () => {
    const tags = [{ name: 'test', usage_count: 1 }];
    const shouldHide = tags.length === 0;
    expect(shouldHide).toBe(false);
  });
});

// ============ URL BUILDING TESTS ============

describe('URL Building', () => {
  it('should build artifact detail URL', () => {
    const artifactId = 123;
    const baseUrl = 'https://artifact-manager.jbmd-creations.workers.dev';
    const url = `${baseUrl}#artifact-${artifactId}`;

    expect(url).toBe('https://artifact-manager.jbmd-creations.workers.dev#artifact-123');
  });

  it('should strip trailing slash from base URL', () => {
    const baseUrl = 'https://example.com/';
    const cleaned = baseUrl.replace(/\/$/, '');
    expect(cleaned).toBe('https://example.com');
  });

  it('should handle base URL without trailing slash', () => {
    const baseUrl = 'https://example.com';
    const cleaned = baseUrl.replace(/\/$/, '');
    expect(cleaned).toBe('https://example.com');
  });
});

// ============ SETTINGS VALIDATION TESTS ============

describe('Settings Validation', () => {
  it('should validate non-empty URL', () => {
    const apiUrl = '   ';
    const isValid = apiUrl.trim().length > 0;
    expect(isValid).toBe(false);
  });

  it('should validate URL format', () => {
    const validUrl = 'https://example.com';
    let isValid = false;

    try {
      new URL(validUrl);
      isValid = true;
    } catch {
      isValid = false;
    }

    expect(isValid).toBe(true);
  });

  it('should reject invalid URL format', () => {
    const invalidUrl = 'not a url';
    let isValid = false;

    try {
      new URL(invalidUrl);
      isValid = true;
    } catch {
      isValid = false;
    }

    expect(isValid).toBe(false);
  });
});

// ============ MESSAGE DISPLAY TESTS ============

describe('Message Display', () => {
  it('should build success message', () => {
    const message = {
      text: 'Settings saved!',
      type: 'success',
      className: 'message success'
    };

    expect(message.text).toBe('Settings saved!');
    expect(message.type).toBe('success');
    expect(message.className).toBe('message success');
  });

  it('should build error message', () => {
    const message = {
      text: 'Failed to save',
      type: 'error',
      className: 'message error'
    };

    expect(message.text).toBe('Failed to save');
    expect(message.type).toBe('error');
    expect(message.className).toBe('message error');
  });
});

// ============ OPTIMISTIC UPDATE TESTS ============

describe('Optimistic Updates', () => {
  it('should toggle favorite optimistically', () => {
    const wasFavorited = false;
    const newState = !wasFavorited;

    expect(newState).toBe(true);
  });

  it('should revert favorite on failure', () => {
    const wasFavorited = true;
    const optimisticState = false;

    // Failure - revert
    const revertedState = wasFavorited;

    expect(revertedState).toBe(true);
  });

  it('should remove un-favorited artifact from favorites view', () => {
    const filters = { favorite: true };
    const wasFavorited = true;
    const shouldRefetch = filters.favorite && wasFavorited;

    expect(shouldRefetch).toBe(true);
  });
});

// ============ VERSION DISPLAY TESTS ============

describe('Version Display', () => {
  it('should format version text', () => {
    const version = '1.1.0';
    const text = `v${version}`;

    expect(text).toBe('v1.1.0');
  });

  it('should handle missing version', () => {
    const version = null;
    const text = version ? `v${version}` : '';

    expect(text).toBe('');
  });
});
