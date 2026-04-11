// themes.js

export const themes = [
  {
    id: 'brutalist',
    label: 'Brutalist',
    cog: '/cogs/cog-light-gray.png',      
    vars: {
      '--bg-primary':     '#f5f5f0',
      '--bg-secondary':   '#ffffff',
      '--bg-input':       'rgba(89, 170, 255, 0.25)',
      '--bg-fields':      'rgba(200, 210, 215, 0.25)',
      '--text-primary':   '#555',
      '--text-secondary': 'darkslategrey',
      '--border-primary': '#444',
      '--border-soft':    '#666',
      '--border-super-soft':'#999',
      '--scrollbar':      '#a0b0bb',
      '--hover-btn':      'rgba(180, 180, 180, 0.5)',
      '--hover-menu':     'rgba(180, 180, 180, 0.5)',
      '--special':        '#333',
      '--accent-1':       '#333',
    }
  },

  {
    id: 'gold',
    label: 'Gold',
    cog: '/cogs/cog-gold.png',
    vars: {
      '--bg-primary':     'darkslategray',
      '--bg-secondary':   'rgba(180, 130, 40, 0.25)',
      '--bg-input':       'rgba(180, 130, 40, 0.2)',
      '--bg-fields':      'rgba(20, 25, 35, 0.6)',
      '--text-primary':   '#F59F30',
      '--text-secondary': 'darkslategray',
      '--border-primary': '#F59F30',
      '--border-soft':    'rgba(245, 159, 48, 0.4)',
      '--border-super-soft':'#111',
      '--scrollbar':      '#F59F30',
      '--hover-btn':      'rgba(245, 159, 48, 0.45)',
      '--hover-menu':     'rgba(245, 159, 48, 0.35)',
      '--accent-1':       '#F59F30',
    }
  },

    {
    id: 'midnight',
    label: 'Midnight',
    cog: '/cogs/cog-light-gray.png',      
    vars: {
      '--bg-primary':     '#020421',
      '--bg-secondary':   '#16213e',
      '--bg-input':       'rgba(39, 130, 245, 0.15)',
      '--bg-fields':      'rgba(0, 10, 30, 0.4)',
      '--text-primary':   '#c8d6e5',
      '--text-secondary': 'floralwhite',
      '--border-primary': '#666',
      '--border-soft':    '#445',
      '--border-super-soft':'#666',
      '--scrollbar':      '#279CF5',
      '--hover-btn':      'rgba(41, 98, 180, 0.85)',
      '--hover-menu':     'rgba(41, 98, 180, 1)',
      '--accent-1':       'lightgray',
    }
  },

  {
    id: 'strawberries-cream',
    label: 'Strawberries + Cream',
    cog: '/cogs/cog-dark-gray.png', 
    vars: {
      '--bg-primary':     'antiquewhite',
      '--bg-secondary':   'oldlace',
      '--bg-input':       'rgba(39, 180, 245, 0.25)',
      '--bg-fields':      'rgba(10, 30, 30, 0.2)',
      '--text-primary':   'darkslategrey',
      '--text-secondary': 'slategrey',
      '--border-primary': '#666',
      '--border-soft':    '#888',
      '--border-super-soft':'#999',
      '--scrollbar':      'indianred',
      '--hover-btn':      'rgba(200, 50, 50, 0.85)',
      '--hover-menu':     'rgba(220, 75, 75, 1)',
      '--accent-1':       'indianred',
    }
  },

  {
    id: 'verdant',
    label: 'Verdant',
    cog: '/cogs/cog-verdant.png',
    vars: {
      '--bg-primary':     'gray',
      '--bg-secondary':   'darkslategray',
      '--bg-input':       'rgba(30, 170, 185, 0.6)',
      '--bg-fields':      'rgba(20, 25, 35, 0.6)',
      '--text-primary':   'lemonchiffon',
      '--text-secondary': 'oldlace',
      '--border-primary': '#ccc',
      '--border-soft':    '#aaa',
      '--border-super-soft':'#444',
      '--scrollbar':      'cadetblue',
      '--hover-btn':      'cadetblue',
      '--hover-menu':     'cadetblue',
      '--accent-1':       'lemonchiffon',
    }
  },
];


const STORAGE_KEY = 'vltmt-theme';

export function applyTheme(themeId) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  localStorage.setItem(STORAGE_KEY, themeId);
  root.setAttribute('data-theme', themeId);
}

export function loadSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  // Verify the stored ID still exists in our themes array 
  const isValid = themes.some(t => t.id === saved);
  const themeToLoad = isValid ? saved : 'brutalist'; 
  
  applyTheme(themeToLoad);
  return themeToLoad;
}