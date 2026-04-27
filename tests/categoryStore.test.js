// tests/categoryStore.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock browser APIs
// ---------------------------------------------------------------------------

const mockStorage = {};
vi.stubGlobal('localStorage', {
  getItem:  (k)    => mockStorage[k] ?? null,
  setItem:  (k, v) => { mockStorage[k] = v; },
  removeItem: (k)  => { delete mockStorage[k]; },
});

vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
});

// ---------------------------------------------------------------------------

import { categories, resolveSearchTerm, detectCategory } from '../src/lib/categoryStore.js';
import { get } from 'svelte/store';

// ---------------------------------------------------------------------------

describe('categoryStore', () => {

  describe('initial state', () => {
    it('contains at least one default category', () => {
      const cats = get(categories);
      expect(cats.length).toBeGreaterThan(0);
    });

    it('every category has an id, emoji, and label', () => {
      const cats = get(categories);
      for (const cat of cats) {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('emoji');
        expect(cat).toHaveProperty('label');
      }
    });

    it('every category id is a non-empty string', () => {
      const cats = get(categories);
      for (const cat of cats) {
        expect(typeof cat.id).toBe('string');
        expect(cat.id.length).toBeGreaterThan(0);
      }
    });
  });

  describe('remove()', () => {
    it('removes a category by id', () => {
      const before = get(categories);
      const target = before[0];
      categories.remove(target.id);
      const after = get(categories);
      expect(after.find(c => c.id === target.id)).toBeUndefined();
    });

    it('does not remove other categories', () => {
      const before = get(categories);
      const target = before[0];
      const rest   = before.slice(1);
      categories.remove(target.id);
      const after = get(categories);
      for (const cat of rest) {
        expect(after.find(c => c.id === cat.id)).toBeDefined();
      }
    });

    it('does nothing when given an unrecognised id', () => {
      const before = get(categories).length;
      categories.remove('nonexistent-id');
      expect(get(categories).length).toBe(before);
    });
  });

  describe('reset()', () => {
    it('restores the default categories', () => {
      categories.remove(get(categories)[0].id);
      categories.reset();
      const after = get(categories);
      expect(after.length).toBeGreaterThan(0);
    });

    it('all categories after reset have id, emoji, and label', () => {
      categories.reset();
      for (const cat of get(categories)) {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('emoji');
        expect(cat).toHaveProperty('label');
      }
    });
  });

});

describe('resolveSearchTerm()', () => {

  beforeEach(() => {
    categories.reset();
  });

  it('returns the emoji when the label matches exactly', () => {
    const result = resolveSearchTerm('Finance');
    expect(result).toBe('💰');
  });

  it('matches labels case-insensitively', () => {
    expect(resolveSearchTerm('finance')).toBe('💰');
    expect(resolveSearchTerm('FINANCE')).toBe('💰');
  });

  it('matches on prefix', () => {
    expect(resolveSearchTerm('Fin')).toBe('💰');
  });

  it('returns the emoji when the search term is the emoji itself', () => {
    expect(resolveSearchTerm('💰')).toBe('💰');
  });

  it('returns the original term when no category matches', () => {
    expect(resolveSearchTerm('Netflix')).toBe('Netflix');
  });

  it('trims whitespace before matching', () => {
    expect(resolveSearchTerm('  Finance  ')).toBe('💰');
  });

});

describe('detectCategory()', () => {

  beforeEach(() => {
    categories.reset();
  });

  it('returns the matching category when a service name contains a category emoji', () => {
    const result = detectCategory('💰 My Bank Account');
    expect(result).not.toBeNull();
    expect(result.label).toBe('Finance');
  });

  it('returns null when the service name contains no category emoji', () => {
    expect(detectCategory('Netflix')).toBeNull();
  });

  it('returns the first matching category when multiple emojis are present', () => {
    const result = detectCategory('💰💻 Mixed Service');
    expect(result).not.toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(detectCategory('')).toBeNull();
  });

});