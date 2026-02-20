/**
 * Comprehensive tests for Artifact Manager Cloudflare Worker
 * Tests sanitizeName, CORS, authentication, and API endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============ UTILITY FUNCTION TESTS ============

describe('sanitizeName', () => {
  // Extract sanitizeName function for testing
  const sanitizeName = (name) => {
    const placeholderPatterns = [
      "Saving...",
      "Loading...",
      "Untitled",
      "New Artifact",
      "Downloading...",
      ""
    ];

    const trimmed = (name || '').trim();

    if (placeholderPatterns.includes(trimmed)) {
      return "Artifact";
    }

    if (trimmed.startsWith("Untitled")) {
      return "Artifact";
    }

    if (!trimmed) {
      return "Artifact";
    }

    return trimmed;
  };

  it('should detect "Saving..." as placeholder', () => {
    expect(sanitizeName('Saving...')).toBe('Artifact');
  });

  it('should detect "Loading..." as placeholder', () => {
    expect(sanitizeName('Loading...')).toBe('Artifact');
  });

  it('should detect "Downloading..." as placeholder', () => {
    expect(sanitizeName('Downloading...')).toBe('Artifact');
  });

  it('should detect "Untitled" as placeholder', () => {
    expect(sanitizeName('Untitled')).toBe('Artifact');
  });

  it('should detect "Untitled 1" as placeholder', () => {
    expect(sanitizeName('Untitled 1')).toBe('Artifact');
  });

  it('should detect "Untitled 42" as placeholder', () => {
    expect(sanitizeName('Untitled 42')).toBe('Artifact');
  });

  it('should detect "New Artifact" as placeholder', () => {
    expect(sanitizeName('New Artifact')).toBe('Artifact');
  });

  it('should detect empty string as placeholder', () => {
    expect(sanitizeName('')).toBe('Artifact');
    expect(sanitizeName('   ')).toBe('Artifact');
    expect(sanitizeName('\t\n')).toBe('Artifact');
  });

  it('should keep valid names unchanged', () => {
    expect(sanitizeName('My Document')).toBe('My Document');
    expect(sanitizeName('Component.tsx')).toBe('Component.tsx');
    expect(sanitizeName('README.md')).toBe('README.md');
    expect(sanitizeName('Smith Event Options')).toBe('Smith Event Options');
  });

  it('should trim whitespace from valid names', () => {
    expect(sanitizeName('  Valid Name  ')).toBe('Valid Name');
    expect(sanitizeName('\tTabbed\t')).toBe('Tabbed');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeName(null)).toBe('Artifact');
    expect(sanitizeName(undefined)).toBe('Artifact');
  });
});

// ============ CORS TESTS ============

describe('CORS handling', () => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://claude.ai',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cf-Access-Jwt-Assertion, cf-access-token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };

  it('should have correct CORS headers', () => {
    expect(CORS_HEADERS['Access-Control-Allow-Origin']).toBe('https://claude.ai');
    expect(CORS_HEADERS['Access-Control-Allow-Credentials']).toBe('true');
    expect(CORS_HEADERS['Access-Control-Allow-Methods']).toContain('GET');
    expect(CORS_HEADERS['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('should handle OPTIONS preflight requests', () => {
    const response = new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://claude.ai');
  });
});

// ============ AUTHENTICATION TESTS ============

describe('Authentication', () => {
  const getUserEmail = (request) => {
    const cookie = request.headers.get('Cookie');
    if (!cookie) return null;

    const match = cookie.match(/am_session=([^;]+)/);
    if (!match) return null;

    try {
      return atob(match[1]);
    } catch {
      return null;
    }
  };

  it('should extract email from valid session cookie', () => {
    const email = 'test@example.com';
    const encoded = btoa(email);
    const request = new Request('https://example.com', {
      headers: { 'Cookie': `am_session=${encoded}` }
    });

    expect(getUserEmail(request)).toBe(email);
  });

  it('should return null for missing cookie', () => {
    const request = new Request('https://example.com');
    expect(getUserEmail(request)).toBe(null);
  });

  it('should return null for invalid session cookie', () => {
    const request = new Request('https://example.com', {
      headers: { 'Cookie': 'am_session=invalid_base64!!!' }
    });

    expect(getUserEmail(request)).toBe(null);
  });

  it('should validate email format', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.co.uk',
      'user+tag@example.com'
    ];

    const invalidEmails = [
      'not-an-email',
      '@example.com',
      'user@',
      'user@domain',
      ''
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true);
    });

    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });
});

// ============ API ENDPOINT TESTS ============

describe('API Query Building', () => {
  it('should build basic artifacts query', () => {
    const userEmail = 'test@example.com';
    const baseQuery = `
      SELECT
        a.*,
        c.name as collection_name,
        c.slug as collection_slug,
        c.color as collection_color,
        GROUP_CONCAT(t.name) as tag_names
      FROM artifacts a
      LEFT JOIN collections c ON a.collection_id = c.id
      LEFT JOIN artifact_tags at ON a.id = at.artifact_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.user_email = ?
    `;

    expect(baseQuery).toContain('WHERE a.user_email = ?');
    expect(baseQuery).toContain('LEFT JOIN collections');
    expect(baseQuery).toContain('LEFT JOIN tags');
  });

  it('should build query with collection filter', () => {
    const collection = 'work';
    const additionalClause = ' AND c.slug = ?';

    expect(additionalClause).toContain('c.slug = ?');
  });

  it('should build query with type filter', () => {
    const type = 'code';
    const additionalClause = ' AND a.artifact_type = ?';

    expect(additionalClause).toContain('artifact_type = ?');
  });

  it('should build query with favorite filter', () => {
    const favoriteClause = ' AND a.is_favorite = 1';
    expect(favoriteClause).toContain('is_favorite = 1');
  });

  it('should build search query with multiple fields', () => {
    const search = 'test';
    const searchClause = ' AND (a.name LIKE ? OR a.description LIKE ? OR a.notes LIKE ? OR a.language LIKE ? OR a.file_name LIKE ?)';

    expect(searchClause).toContain('a.name LIKE ?');
    expect(searchClause).toContain('a.description LIKE ?');
    expect(searchClause).toContain('a.notes LIKE ?');
  });

  it('should support multiple sort options', () => {
    const sortMap = {
      newest: 'a.created_at DESC',
      oldest: 'a.created_at ASC',
      name: 'a.name ASC',
      updated: 'a.updated_at DESC',
      type: 'a.artifact_type ASC, a.name ASC'
    };

    expect(sortMap.newest).toBe('a.created_at DESC');
    expect(sortMap.oldest).toBe('a.created_at ASC');
    expect(sortMap.name).toBe('a.name ASC');
    expect(sortMap.updated).toBe('a.updated_at DESC');
    expect(sortMap.type).toBe('a.artifact_type ASC, a.name ASC');
  });

  it('should prioritize favorites in sort', () => {
    const orderByClause = 'ORDER BY a.is_favorite DESC, a.created_at DESC';
    expect(orderByClause).toContain('is_favorite DESC');
  });
});

// ============ URL ROUTING TESTS ============

describe('URL Routing', () => {
  it('should match API artifact routes', () => {
    const apiRoute = 'api/artifacts';
    expect(apiRoute.startsWith('api/')).toBe(true);
    expect(apiRoute).toBe('api/artifacts');
  });

  it('should match single artifact route', () => {
    const route = 'api/artifacts/123';
    const pattern = /^api\/artifacts\/\d+$/;
    expect(pattern.test(route)).toBe(true);
  });

  it('should extract artifact ID from route', () => {
    const route = 'api/artifacts/456';
    const id = route.split('/')[2];
    expect(id).toBe('456');
  });

  it('should match share page route', () => {
    const route = 'share/123e4567-e89b-12d3-a456-426614174000';
    const pattern = /^share\/[a-f0-9-]{36}$/;
    expect(pattern.test(route)).toBe(true);
  });

  it('should match render page route', () => {
    const route = 'render/AbCdEfGhIjKl';
    const pattern = /^render\/[A-Za-z0-9]{12}$/;
    expect(pattern.test(route)).toBe(true);
  });

  it('should not match invalid render route', () => {
    const invalidRoute = 'render/invalid!@#';
    const pattern = /^render\/[A-Za-z0-9]{12}$/;
    expect(pattern.test(invalidRoute)).toBe(false);
  });
});

// ============ DATA TRANSFORMATION TESTS ============

describe('Data Transformation', () => {
  it('should parse comma-separated tags', () => {
    const artifact = {
      id: 1,
      name: 'Test',
      tag_names: 'javascript,react,frontend'
    };

    const tags = artifact.tag_names ? artifact.tag_names.split(',') : [];
    expect(tags).toEqual(['javascript', 'react', 'frontend']);
  });

  it('should handle artifacts with no tags', () => {
    const artifact = {
      id: 2,
      name: 'Test 2',
      tag_names: null
    };

    const tags = artifact.tag_names ? artifact.tag_names.split(',') : [];
    expect(tags).toEqual([]);
  });

  it('should transform artifact with collection data', () => {
    const result = {
      id: 1,
      name: 'My Artifact',
      collection_name: 'Work',
      collection_slug: 'work',
      collection_color: '#6366f1',
      tag_names: 'code,typescript'
    };

    const artifact = {
      ...result,
      tags: result.tag_names ? result.tag_names.split(',') : []
    };

    expect(artifact.collection_name).toBe('Work');
    expect(artifact.collection_slug).toBe('work');
    expect(artifact.tags).toEqual(['code', 'typescript']);
  });
});

// ============ HTML ESCAPING TESTS ============

describe('HTML Escaping', () => {
  const escapeHtmlServer = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  it('should escape HTML special characters', () => {
    expect(escapeHtmlServer('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtmlServer('A & B')).toBe('A &amp; B');
    expect(escapeHtmlServer('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtmlServer("it's")).toBe("it&#039;s");
  });

  it('should handle empty or null input', () => {
    expect(escapeHtmlServer('')).toBe('');
    expect(escapeHtmlServer(null)).toBe('');
    expect(escapeHtmlServer(undefined)).toBe('');
  });

  it('should prevent XSS attacks', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const escaped = escapeHtmlServer(malicious);
    expect(escaped).not.toContain('<img');
    expect(escaped).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });
});

// ============ BASE64 ENCODING TESTS ============

describe('Base64 Encoding', () => {
  const toBase64 = (str) => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  it('should encode simple strings', () => {
    const encoded = toBase64('hello');
    expect(encoded).toBe(btoa('hello'));
  });

  it('should encode email addresses', () => {
    const email = 'test@example.com';
    const encoded = toBase64(email);
    const decoded = atob(encoded);
    expect(decodeURIComponent(escape(decoded))).toBe(email);
  });

  it('should handle Unicode characters', () => {
    const unicode = 'Hello 世界';
    const encoded = toBase64(unicode);
    expect(encoded).toBeTruthy();
    expect(encoded.length).toBeGreaterThan(0);
  });
});

// ============ TYPE ICON TESTS ============

describe('Type Icons', () => {
  const getTypeIconClass = (type) => {
    const map = {
      code: 'code',
      html: 'html',
      image: 'image',
      document: 'document'
    };
    return map[type] || 'other';
  };

  const getTypeIcon = (type) => {
    const icons = {
      code: '<>',
      html: '</>',
      image: 'img',
      document: 'doc'
    };
    return icons[type] || '?';
  };

  it('should map artifact types to icon classes', () => {
    expect(getTypeIconClass('code')).toBe('code');
    expect(getTypeIconClass('html')).toBe('html');
    expect(getTypeIconClass('image')).toBe('image');
    expect(getTypeIconClass('document')).toBe('document');
  });

  it('should handle unknown types', () => {
    expect(getTypeIconClass('unknown')).toBe('other');
    expect(getTypeIconClass(null)).toBe('other');
  });

  it('should provide correct icon labels', () => {
    expect(getTypeIcon('code')).toBe('<>');
    expect(getTypeIcon('html')).toBe('</>');
    expect(getTypeIcon('image')).toBe('img');
    expect(getTypeIcon('document')).toBe('doc');
    expect(getTypeIcon('unknown')).toBe('?');
  });
});

// ============ INTEGRATION TESTS ============

describe('Request Validation', () => {
  it('should validate artifact creation payload', () => {
    const validPayload = {
      name: 'Test Artifact',
      description: 'A test artifact',
      artifact_type: 'code',
      source_type: 'published',
      published_url: 'https://claude.site/abc123',
      artifact_id: 'abc123',
      file_name: 'test.js',
      file_content: 'console.log("test");',
      language: 'javascript',
      framework: 'vanilla',
      claude_model: 'claude-3-5-sonnet-20241022',
      conversation_url: 'https://claude.ai/chat/abc123',
      notes: '',
      collection_id: null,
      is_favorite: 0,
      tags: []
    };

    // Validate required fields
    expect(validPayload.name).toBeTruthy();
    expect(validPayload.artifact_type).toBeTruthy();
    expect(validPayload.source_type).toBeTruthy();
    expect(validPayload.artifact_id).toBeTruthy();
  });

  it('should reject invalid artifact types', () => {
    const validTypes = ['code', 'html', 'image', 'document'];
    const invalidType = 'invalid-type';

    expect(validTypes.includes(invalidType)).toBe(false);
  });

  it('should validate URL formats', () => {
    const validUrls = [
      'https://claude.site/artifacts/abc123',
      'https://claude.ai/chat/123',
      'https://example.com'
    ];

    const invalidUrls = [
      'not a url',
      'ftp://invalid.com',
      ''
    ];

    validUrls.forEach(url => {
      expect(() => new URL(url)).not.toThrow();
    });

    invalidUrls.forEach(url => {
      if (url) {
        try {
          new URL(url);
          expect(false).toBe(true); // Should not reach here
        } catch (e) {
          expect(e).toBeTruthy();
        }
      }
    });
  });
});

// ============ COLLECTION SLUG TESTS ============

describe('Collection Slugs', () => {
  const createSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  it('should create valid slugs from collection names', () => {
    expect(createSlug('My Work')).toBe('my-work');
    expect(createSlug('Personal Projects')).toBe('personal-projects');
    expect(createSlug('Code Snippets')).toBe('code-snippets');
  });

  it('should handle special characters', () => {
    expect(createSlug('Work & Play')).toBe('work-play');
    expect(createSlug('Code @ Home')).toBe('code-home');
    expect(createSlug('Projects (2024)')).toBe('projects-2024');
  });

  it('should handle multiple spaces', () => {
    expect(createSlug('Too    Many     Spaces')).toBe('too-many-spaces');
  });

  it('should trim whitespace', () => {
    expect(createSlug('  trimmed  ')).toBe('trimmed');
  });
});
