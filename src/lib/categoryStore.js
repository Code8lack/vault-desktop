// categoryStore.js
// Place alongside your other stores. Categories are {emoji, label} pairs stored
// in localStorage so they survive app restarts without any backend changes.

import { writable, derived, get } from 'svelte/store';
export const nav = { index: null };


const STORAGE_KEY = 'lockstep_categories';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultCategories();
  } catch {
    return defaultCategories();
  }
}

function defaultCategories() {
  return [
    { id: crypto.randomUUID(), emoji: '💰', label: 'Finance'      },
    { id: crypto.randomUUID(), emoji: '💻', label: 'Technology'   },
    { id: crypto.randomUUID(), emoji: '🇨🇭', label: 'Switzerland'  },
    { id: crypto.randomUUID(), emoji: '🏦', label: 'Banking'      },
    { id: crypto.randomUUID(), emoji: '🛒', label: 'Shopping'     },
  ];
}

function createCategoryStore() {
  const { subscribe, set, update } = writable(loadFromStorage());

  // Persist every change to localStorage automatically
  subscribe(value => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
  });

  return {
    subscribe,

    add(emoji, label) {
      update(cats => [
        ...cats,
        { id: crypto.randomUUID(), emoji: emoji.trim(), label: label.trim() }
      ]);
    },

    remove(id) {
      update(cats => cats.filter(c => c.id !== id));
    },

    edit(id, emoji, label) {
      update(cats => cats.map(c =>
        c.id === id ? { ...c, emoji: emoji.trim(), label: label.trim() } : c
      ));
    },

    reset() {
      set(defaultCategories());
    }
  };
}

export const categories = createCategoryStore();

// ─── Search resolver ──────────────────────────────────────────────────────────
// Call this in your parent component before filtering entries.
// If the user typed "Finance" or "💰", returns "💰" (the emoji stored in the name).
// If no category matches, returns the original term so normal search still works.
export function resolveSearchTerm(term) {
  const cats = get(categories);
  const t = term.trim();
const match = cats.find(
  c =>
    c.label.toLowerCase().startsWith(t.toLowerCase()) ||  // ← prefix match
    c.label.toLowerCase() === t.toLowerCase() ||
    c.emoji === t
);
  return match ? match.emoji : t;
}

// ─── Tag detector ─────────────────────────────────────────────────────────────
// Given a service name string, returns the first matching category object or null.
// Use this in search results to decide whether to show a pill.
export function detectCategory(serviceName) {
  const cats = get(categories);
  return cats.find(c => serviceName.includes(c.emoji)) ?? null;
}