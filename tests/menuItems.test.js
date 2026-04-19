// tests/menuItems.test.js

import { describe, it, expect, vi } from 'vitest';
import { createMenuItems } from '../src/lib/menuItems.js';

// ---------------------------------------------------------------------------
// Minimal mock dependencies — we're testing structure and search logic,
// not the behaviour of the actions themselves.
// ---------------------------------------------------------------------------

const mockDeps = {
  openAddEntry:          vi.fn(),
  showAddEntryPanel:     false,
  openMenu:              vi.fn(),
  toggleSubMenu:         vi.fn(),
  lockVault:             vi.fn(),
  triggerSecurityAction: vi.fn(),
  startChange:           vi.fn(),
  openTimeoutSettings:   vi.fn(),
  displayPanel:          false,
  showThemePicker:       false,
  showLockBgPicker:      false,
  showBackupModal:       false,
  openImportPicker:      vi.fn(),
  startBatchUpdate:      vi.fn(),
  setDisplayPanel:       vi.fn(),
  setShowThemePicker:    vi.fn(),
  setShowLockBgPicker:   vi.fn(),
  setShowBackupModal:    vi.fn(),
  toggleNerdPanel:       vi.fn(),
};

// ---------------------------------------------------------------------------
// Inline reimplementation of the search filter logic from +page.svelte.
// No proprietary module imported.
// ---------------------------------------------------------------------------

function applySearchFilter(searchTerm, sortedEntries, menuItems) {
  return searchTerm.trim().length >= 1
    ? [
        ...sortedEntries
          .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(s => ({ type: 'service', label: s })),
        ...menuItems
          .filter(m => m.label.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(m => ({ type: 'menu', label: m.label, action: m.action })),
      ]
    : [];
}

// ---------------------------------------------------------------------------

describe('createMenuItems()', () => {

  const items = createMenuItems(mockDeps);

  it('returns an array', () => {
    expect(Array.isArray(items)).toBe(true);
  });

  it('returns at least one item', () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it('every item has a label and an action', () => {
    for (const item of items) {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('action');
    }
  });

  it('every label is a non-empty string', () => {
    for (const item of items) {
      expect(typeof item.label).toBe('string');
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it('every action is a function', () => {
    for (const item of items) {
      expect(typeof item.action).toBe('function');
    }
  });

  it('all labels are unique — no duplicates', () => {
    const labels = items.map(i => i.label);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });

});

describe('search filter logic', () => {

  const items = createMenuItems(mockDeps);
  const sortedEntries = ['Netflix', 'Spotify', 'Swiss', 'GitHub'];

  it('returns an empty array when search term is empty', () => {
    expect(applySearchFilter('', sortedEntries, items)).toEqual([]);
  });

  it('returns an empty array when search term is only whitespace', () => {
    expect(applySearchFilter('   ', sortedEntries, items)).toEqual([]);
  });

  it('returns results for a single character search term', () => {
    const results = applySearchFilter('a', sortedEntries, items);
    expect(results.length).toBeGreaterThan(0);
  });

  it('matches service entries case-insensitively', () => {
    const results = applySearchFilter('netflix', sortedEntries, items);
    const serviceResults = results.filter(r => r.type === 'service');
    expect(serviceResults.some(r => r.label === 'Netflix')).toBe(true);
  });

  it('matches menu items case-insensitively', () => {
    const results = applySearchFilter('lock', sortedEntries, items);
    const menuResults = results.filter(r => r.type === 'menu');
    expect(menuResults.length).toBeGreaterThan(0);
  });

  it('returns both service and menu results in the same array', () => {
    const results = applySearchFilter('s', sortedEntries, items);
    const types = results.map(r => r.type);
    expect(types).toContain('service');
    expect(types).toContain('menu');
  });

  it('service results have type and label only', () => {
    const results = applySearchFilter('netflix', sortedEntries, items);
    const serviceResult = results.find(r => r.type === 'service');
    expect(serviceResult).toHaveProperty('type', 'service');
    expect(serviceResult).toHaveProperty('label');
  });

  it('menu results have type, label, and action', () => {
    const results = applySearchFilter('lock', sortedEntries, items);
    const menuResult = results.find(r => r.type === 'menu');
    expect(menuResult).toHaveProperty('type', 'menu');
    expect(menuResult).toHaveProperty('label');
    expect(menuResult).toHaveProperty('action');
    expect(typeof menuResult.action).toBe('function');
  });

  it('returns no results when search term matches nothing', () => {
    const results = applySearchFilter('zzzzz', sortedEntries, items);
    expect(results).toEqual([]);
  });

  it('service results appear before menu results', () => {
    const results = applySearchFilter('s', sortedEntries, items);
    const firstMenuIndex = results.findIndex(r => r.type === 'menu');
    const lastServiceIndex = results.findLastIndex(r => r.type === 'service');
    expect(lastServiceIndex).toBeLessThan(firstMenuIndex);
  });

});