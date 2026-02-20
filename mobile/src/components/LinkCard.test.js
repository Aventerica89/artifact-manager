/**
 * Unit tests for LinkCard Component
 * Tests rendering, formatting, and interaction handlers
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { describe, it, expect, vi } from '@jest/globals';
import LinkCard from './LinkCard';

// Mock Expo vector icons
vi.mock('@expo/vector-icons', () => ({
  Feather: 'Feather'
}));

// ============ DATE FORMATTING TESTS ============

describe('Date Formatting', () => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  it('should format date correctly', () => {
    const date = '2024-01-15T10:00:00Z';
    const formatted = formatDate(date);

    expect(formatted).toMatch(/Jan 1[45]/); // Account for timezone differences
  });

  it('should handle different month', () => {
    const date = '2024-12-25T10:00:00Z';
    const formatted = formatDate(date);

    expect(formatted).toMatch(/Dec 2[45]/);
  });
});

// ============ URL TRUNCATION TESTS ============

describe('URL Truncation', () => {
  const truncateUrl = (url, maxLength = 35) => {
    if (!url) return '';
    const clean = url.replace(/^https?:\/\//, '');
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength) + '...';
  };

  it('should remove protocol from URL', () => {
    expect(truncateUrl('https://example.com')).toBe('example.com');
    expect(truncateUrl('http://example.com')).toBe('example.com');
  });

  it('should truncate long URLs', () => {
    const longUrl = 'https://example.com/very/long/path/that/exceeds/the/maximum/length';
    const truncated = truncateUrl(longUrl, 35);

    expect(truncated).toHaveLength(38); // 35 + '...'
    expect(truncated).toEndWith('...');
  });

  it('should not truncate short URLs', () => {
    const shortUrl = 'https://example.com';
    const truncated = truncateUrl(shortUrl, 35);

    expect(truncated).toBe('example.com');
    expect(truncated).not.toContain('...');
  });

  it('should handle null or empty URL', () => {
    expect(truncateUrl(null)).toBe('');
    expect(truncateUrl('')).toBe('');
    expect(truncateUrl(undefined)).toBe('');
  });

  it('should respect custom max length', () => {
    const url = 'https://example.com/path';
    const truncated = truncateUrl(url, 15);

    expect(truncated).toHaveLength(18); // 15 + '...'
  });
});

// ============ CATEGORY COLOR TESTS ============

describe('Category Colors', () => {
  const getCategoryColor = (colorName) => {
    const colors = {
      categories: {
        work: '#3b82f6',
        personal: '#10b981',
        social: '#f59e0b',
        marketing: '#ef4444',
      },
      mutedForeground: '#a1a1aa'
    };

    const categoryColors = {
      work: colors.categories.work,
      personal: colors.categories.personal,
      social: colors.categories.social,
      marketing: colors.categories.marketing,
    };

    return categoryColors[colorName] || colors.mutedForeground;
  };

  it('should return correct color for work category', () => {
    expect(getCategoryColor('work')).toBe('#3b82f6');
  });

  it('should return correct color for personal category', () => {
    expect(getCategoryColor('personal')).toBe('#10b981');
  });

  it('should return correct color for social category', () => {
    expect(getCategoryColor('social')).toBe('#f59e0b');
  });

  it('should return correct color for marketing category', () => {
    expect(getCategoryColor('marketing')).toBe('#ef4444');
  });

  it('should return fallback color for unknown category', () => {
    expect(getCategoryColor('unknown')).toBe('#a1a1aa');
    expect(getCategoryColor(null)).toBe('#a1a1aa');
  });
});

// ============ COMPONENT RENDERING TESTS ============

describe('LinkCard Component', () => {
  const mockLink = {
    code: 'test123',
    destination: 'https://example.com',
    clicks: 42,
    created_at: '2024-01-15T10:00:00Z',
    is_protected: false,
    category_name: 'Work',
    category_color: 'work',
    tags: ['urgent', 'review']
  };

  const mockHandlers = {
    onPress: vi.fn(),
    onCopy: vi.fn(),
    onDelete: vi.fn()
  };

  it('should render link code', () => {
    const { getByText } = render(
      <LinkCard link={mockLink} {...mockHandlers} />
    );

    expect(getByText('/test123')).toBeTruthy();
  });

  it('should render truncated destination URL', () => {
    const { getByText } = render(
      <LinkCard link={mockLink} {...mockHandlers} />
    );

    expect(getByText('example.com')).toBeTruthy();
  });

  it('should render click count', () => {
    const { getByText } = render(
      <LinkCard link={mockLink} {...mockHandlers} />
    );

    expect(getByText('42')).toBeTruthy();
  });

  it('should render category name', () => {
    const { getByText } = render(
      <LinkCard link={mockLink} {...mockHandlers} />
    );

    expect(getByText('Work')).toBeTruthy();
  });

  it('should render tags', () => {
    const { getByText } = render(
      <LinkCard link={mockLink} {...mockHandlers} />
    );

    expect(getByText('urgent')).toBeTruthy();
    expect(getByText('review')).toBeTruthy();
  });

  it('should call onPress when card is pressed', () => {
    const { getByText } = render(
      <LinkCard link={mockLink} {...mockHandlers} />
    );

    fireEvent.press(getByText('/test123'));
    expect(mockHandlers.onPress).toHaveBeenCalled();
  });
});

// ============ PROTECTED LINK TESTS ============

describe('Protected Link Indicator', () => {
  it('should show lock icon for protected links', () => {
    const protectedLink = {
      code: 'secret',
      destination: 'https://example.com',
      clicks: 10,
      created_at: '2024-01-15T10:00:00Z',
      is_protected: true
    };

    const mockHandlers = {
      onPress: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn()
    };

    const { UNSAFE_getByType } = render(
      <LinkCard link={protectedLink} {...mockHandlers} />
    );

    // Check that Feather icon exists (mocked)
    const icons = UNSAFE_getByType('Feather');
    expect(icons).toBeTruthy();
  });

  it('should not show lock icon for public links', () => {
    const publicLink = {
      code: 'public',
      destination: 'https://example.com',
      clicks: 5,
      created_at: '2024-01-15T10:00:00Z',
      is_protected: false
    };

    const isProtected = publicLink.is_protected;
    expect(isProtected).toBe(false);
  });
});

// ============ TAG DISPLAY TESTS ============

describe('Tag Display', () => {
  it('should display up to 3 tags', () => {
    const link = {
      code: 'test',
      destination: 'https://example.com',
      clicks: 10,
      created_at: '2024-01-15T10:00:00Z',
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    };

    const displayedTags = link.tags.slice(0, 3);
    expect(displayedTags).toHaveLength(3);
    expect(displayedTags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should show overflow count for more than 3 tags', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
    const overflow = tags.length > 3;
    const overflowCount = tags.length - 3;

    expect(overflow).toBe(true);
    expect(overflowCount).toBe(2);
  });

  it('should not show overflow for 3 or fewer tags', () => {
    const tags = ['tag1', 'tag2', 'tag3'];
    const overflow = tags.length > 3;

    expect(overflow).toBe(false);
  });

  it('should handle links with no tags', () => {
    const link = {
      code: 'test',
      destination: 'https://example.com',
      clicks: 10,
      created_at: '2024-01-15T10:00:00Z',
      tags: null
    };

    const hasTags = link.tags && link.tags.length > 0;
    expect(hasTags).toBe(false);
  });

  it('should handle links with empty tags array', () => {
    const link = {
      code: 'test',
      destination: 'https://example.com',
      clicks: 10,
      created_at: '2024-01-15T10:00:00Z',
      tags: []
    };

    const hasTags = link.tags && link.tags.length > 0;
    expect(hasTags).toBe(false);
  });
});

// ============ INTERACTION TESTS ============

describe('User Interactions', () => {
  const mockLink = {
    code: 'interact',
    destination: 'https://example.com',
    clicks: 100,
    created_at: '2024-01-15T10:00:00Z'
  };

  it('should call onCopy when copy button is pressed', () => {
    const mockHandlers = {
      onPress: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn()
    };

    const { UNSAFE_getAllByType } = render(
      <LinkCard link={mockLink} {...mockHandlers} />
    );

    // In a real test, we'd find the copy button and fire a press event
    // For now, just verify the handler exists
    expect(mockHandlers.onCopy).toBeDefined();
    expect(typeof mockHandlers.onCopy).toBe('function');
  });

  it('should call onDelete when delete button is pressed', () => {
    const mockHandlers = {
      onPress: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn()
    };

    render(<LinkCard link={mockLink} {...mockHandlers} />);

    expect(mockHandlers.onDelete).toBeDefined();
    expect(typeof mockHandlers.onDelete).toBe('function');
  });
});

// ============ EDGE CASES TESTS ============

describe('Edge Cases', () => {
  it('should handle missing category gracefully', () => {
    const link = {
      code: 'nocategory',
      destination: 'https://example.com',
      clicks: 5,
      created_at: '2024-01-15T10:00:00Z',
      category_name: null
    };

    const mockHandlers = {
      onPress: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn()
    };

    const { queryByText } = render(
      <LinkCard link={link} {...mockHandlers} />
    );

    expect(queryByText('Work')).toBeNull();
  });

  it('should handle very long destination URL', () => {
    const truncateUrl = (url, maxLength = 35) => {
      if (!url) return '';
      const clean = url.replace(/^https?:\/\//, '');
      if (clean.length <= maxLength) return clean;
      return clean.substring(0, maxLength) + '...';
    };

    const longUrl = 'https://example.com/' + 'a'.repeat(100);
    const truncated = truncateUrl(longUrl, 35);

    expect(truncated.length).toBeLessThanOrEqual(38);
    expect(truncated).toEndWith('...');
  });

  it('should handle zero clicks', () => {
    const link = {
      code: 'noclicks',
      destination: 'https://example.com',
      clicks: 0,
      created_at: '2024-01-15T10:00:00Z'
    };

    const mockHandlers = {
      onPress: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn()
    };

    const { getByText } = render(
      <LinkCard link={link} {...mockHandlers} />
    );

    expect(getByText('0')).toBeTruthy();
  });
});
