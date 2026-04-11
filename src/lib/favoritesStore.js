import { writable } from 'svelte/store';

export const favorites = writable(new Set());

export function syncFavorites(data) {
  favorites.set(new Set(data));
}