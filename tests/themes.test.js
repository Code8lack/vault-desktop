// tests/themes.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { themes, applyTheme, loadSavedTheme } from '../src/lib/themes.js';

// ---------------------------------------------------------------------------
// Mock browser APIs unavailable in Node
// ---------------------------------------------------------------------------

const mockStyle = {};
const mockSetProperty = vi.fn((k, v) => { mockStyle[k] = v; });
const mockSetAttribute = vi.fn();
const mockGetItem = vi.fn();
const mockSetItem = vi.fn();

vi.stubGlobal('document', {
  documentElement: {
    style: { setProperty: mockSetProperty },
    setAttribute: mockSetAttribute,
  }
});

vi.stubGlobal('localStorage', {
  getItem: mockGetItem,
  setItem: mockSetItem,
});

// ---------------------------------------------------------------------------

const REQUIRED_VARS = [
  '--bg-primary',
  '--bg-secondary',
  '--bg-input',
  '--bg-fields',
  '--text-primary',
  '--text-secondary',
  '--border-primary',
  '--border-soft',
  '--border-super-soft',
  '--scrollbar',
  '--hover-btn',
  '--hover-menu',
  '--accent-1',
];

describe('themes array', () => {

  it('contains at least one theme', () => {
    expect(themes.length).toBeGreaterThan(0);
  });

  it('every theme has an id, label, cog, and vars', () => {
    for (const theme of themes) {
      expect(theme).toHaveProperty('id');
      expect(theme).toHaveProperty('label');
      expect(theme).toHaveProperty('cog');
      expect(theme).toHaveProperty('vars');
    }
  });

  it('every theme id is a non-empty string', () => {
    for (const theme of themes) {
      expect(typeof theme.id).toBe('string');
      expect(theme.id.length).toBeGreaterThan(0);
    }
  });

  it('every theme has all required CSS variables', () => {
    for (const theme of themes) {
      for (const variable of REQUIRED_VARS) {
        expect(theme.vars).toHaveProperty(variable);
      }
    }
  });

  it('every theme id is unique', () => {
    const ids = themes.map(t => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every theme label is a non-empty string', () => {
    for (const theme of themes) {
      expect(typeof theme.label).toBe('string');
      expect(theme.label.length).toBeGreaterThan(0);
    }
  });

  it('every theme cog path starts with /', () => {
    for (const theme of themes) {
      expect(theme.cog.startsWith('/')).toBe(true);
    }
  });

});

describe('applyTheme()', () => {

  beforeEach(() => {
    mockSetProperty.mockClear();
    mockSetAttribute.mockClear();
    mockSetItem.mockClear();
  });

  it('applies all CSS variables for a valid theme', () => {
    applyTheme('brutalist');
    const applied = mockSetProperty.mock.calls.map(c => c[0]);
    for (const variable of REQUIRED_VARS) {
      expect(applied).toContain(variable);
    }
  });

  it('sets the data-theme attribute to the theme id', () => {
    applyTheme('gold');
    expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'gold');
  });

  it('saves the theme id to localStorage', () => {
    applyTheme('midnight');
    expect(mockSetItem).toHaveBeenCalledWith('vltmt-theme', 'midnight');
  });

  it('does nothing when given an unrecognised theme id', () => {
    applyTheme('nonexistent');
    expect(mockSetProperty).not.toHaveBeenCalled();
    expect(mockSetAttribute).not.toHaveBeenCalled();
  });

});

describe('loadSavedTheme()', () => {

  beforeEach(() => {
    mockGetItem.mockClear();
    mockSetProperty.mockClear();
    mockSetAttribute.mockClear();
    mockSetItem.mockClear();
  });

  it('loads the saved theme when it exists in the themes array', () => {
    mockGetItem.mockReturnValue('gold');
    const result = loadSavedTheme();
    expect(result).toBe('gold');
    expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'gold');
  });

  it('falls back to brutalist when localStorage returns null', () => {
    mockGetItem.mockReturnValue(null);
    const result = loadSavedTheme();
    expect(result).toBe('brutalist');
    expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'brutalist');
  });

  it('falls back to brutalist when localStorage contains an unrecognised theme id', () => {
    mockGetItem.mockReturnValue('nonexistent');
    const result = loadSavedTheme();
    expect(result).toBe('brutalist');
    expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'brutalist');
  });

  it('returns the loaded theme id', () => {
    mockGetItem.mockReturnValue('verdant');
    const result = loadSavedTheme();
    expect(result).toBe('verdant');
  });

});