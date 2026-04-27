<script>
  import { fly } from 'svelte/transition';
  import { createEventDispatcher, onDestroy, tick } from 'svelte';
  import { categories, detectCategory } from './categoryStore.js';

  const dispatch = createEventDispatcher();

  export let showSearchModal = false;
  export let searchTerm = "";
  export let searchResults = [];
  export let highlightedIndex = -1;
  export let collapsed = false;

  $: if (searchResults) highlightedIndex = -1;
  $: if (!searchTerm) showSearchModal = false;

  let hoveredIndex = -1;

  // For each result, pre-compute its category (null if untagged).
  // Recomputes whenever results or the category store changes.
  $: taggedResults = searchResults.map(result => ({
    ...result,
    _category: result._category ?? detectCategory(result.label ?? '')
  }));

  export function handleKeyDown(e) {
    if (!searchResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      hoveredIndex = -1;
      highlightedIndex = (highlightedIndex + 1) % searchResults.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      hoveredIndex = -1;
      highlightedIndex = (highlightedIndex - 1 + searchResults.length) % searchResults.length;
    } else if (e.key === 'Enter' && highlightedIndex !== -1) {
      e.preventDefault();
      dispatch('select', searchResults[highlightedIndex]);
    }
  }
</script>

{#if showSearchModal}
  <div class="display-panel-order">
    <div
      class="display-panel search"
      role="dialog"
      tabindex="0"
      aria-modal="true"
      aria-label="Search results"
      transition:fly={{ y: 20, duration: 300 }}
      on:mousedown|preventDefault={() => dispatch('refocus')}
    >
      <div class="search-panel-inner">
        <button
          class="panel-close"
          type="button"
          aria-label="Close panel"
          on:mousedown|preventDefault={() => (showSearchModal = false)}
        >✕</button>

        <p>{searchTerm}</p>

        {#if taggedResults.length > 0 && !collapsed}
          <div class="search-bar-mirror">
            {#each taggedResults as result, i}
              <button
                class="result-item"
                class:highlighted={i === highlightedIndex || i === hoveredIndex}
                class:has-category={result._category !== null}
                type="button"
                on:mouseenter={() => { highlightedIndex = -1; hoveredIndex = i; }}
                on:mouseleave={() => { hoveredIndex = -1; }}
                on:mousedown|preventDefault={() => dispatch('select', result)}
              >
                <span class="result-label">{result.label}</span>

                {#if result._category}
                  <span class="category-pill">
                    {result._category.emoji} {result._category.label}
                  </span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div
    class="overlay"
    role="button"
    tabindex="0"
    on:click={() => (showSearchModal = false)}
    on:keydown={(e) => e.key === 'Escape' && (showSearchModal = false)}
    aria-label="Close search overlay"
  ></div>
{/if}


<!-- ─── STYLES ──────────────────────────────────────────────────────────────── -->
<style>
  .display-panel-order {
    height: 5px;
  }

  .search .panel-close {
    position: relative;
    background: transparent;
    border: none;
    color: #666;
    font-size: 24px;
    cursor: pointer;
    padding: 8px;
    right: -10px;
    top: 5px;
    float: right;
  }

  .search .panel-close:hover {
    color: mediumvioletred;
  }

  .display-panel {
    background: rgba(100, 100, 100, 0.3);
    position: relative;
    align-items: center;
    border: none;
    height: auto;
    width: 75%;
    min-width: 40%;
    z-index: 250;
    padding: 0;
  }

  .search-panel-inner {
    border-radius: 8px;
    background: rgba(200, 200, 200, 0.8);
    animation: slideIn 1400ms ease;
    padding: 25px;
    font-size: 1.4em;
    font-weight: 350;
    width: 425px;
  }

  .search-bar-mirror {
    max-height: 350px;
    overflow-y: auto;
    width: 100%;
  }

  .search-panel-inner p {
    border-bottom: 1px solid #777;
    font-size: 0.9em;
    color: darkslategray;
  }

  .result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 8px 5px;
    width: 100%;
    font-size: 0.65em;
    overflow: hidden;
    text-align: left;
    margin-bottom: 3px;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-item:hover,
  .result-item.highlighted {
    outline: none;
  }

  .result-item:hover {
    background: var(--bg-secondary);
  }

  .result-item.highlighted {
    background: var(--hover-btn);
  }

  /* Service name — truncates if long */
  .result-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-item:hover .category-pill,
  .result-item.highlighted .category-pill {
    color: floralwhite;
  }

  /* Category pill — only appears on tagged entries */
  .category-pill {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 7px;
    border-radius: 999px;
    font-size: 0.85em;
    font-weight: 500;
    background: rgba(150, 0, 0, 0.10);
    white-space: nowrap;
    letter-spacing: 0.01em;
  }

  /* Subtle left-border accent on categorised rows */
  .result-item.has-category {
    border-left: 3px solid rgba(0, 0, 0, 0.18);
    padding-left: 7px;
  }
</style>
