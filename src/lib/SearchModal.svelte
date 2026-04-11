<script>
  import { fly } from 'svelte/transition';
  import { createEventDispatcher, onDestroy, tick } from 'svelte';
  const dispatch = createEventDispatcher();
  export let showSearchModal = false;
  export let searchTerm = "";
  export let searchResults = [];
  export let highlightedIndex = -1;
  export let collapsed = false; 

  $: if (searchResults) highlightedIndex = -1;
  $: if (!searchTerm) showSearchModal = false;

  let hoveredIndex = -1;

  export function handleKeyDown(e) {
    if (!searchResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      hoveredIndex = -1; // ← ADD
      highlightedIndex = (highlightedIndex + 1) % searchResults.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      hoveredIndex = -1; // ← ADD
      highlightedIndex = (highlightedIndex - 1 + searchResults.length) % searchResults.length;
    } else if (e.key === 'Enter' && highlightedIndex !== -1) {
      e.preventDefault();
      dispatch('select', searchResults[highlightedIndex]);
    }
  }

</script>

{#if showSearchModal}
  <div class="display-panel-order">
    <div class="display-panel search"
        role="dialog"
        tabindex="0"
        aria-modal="true"
        aria-label="Search results" 
      transition:fly={{ y: 20, duration: 300 }}
      on:mousedown|preventDefault={() => dispatch('refocus')}>
      <div class="search-panel-inner">
        <button
          class="panel-close"
          type="button"
          aria-label="Close panel"
          on:mousedown|preventDefault={() => showSearchModal = false}
        >✕</button>
        <p>{searchTerm}</p>

        {#if searchResults.length > 0 && !collapsed}
          <div class="search-bar-mirror">
            {#each searchResults as result, i}
              <button
                class="result-item"
                class:highlighted={i === highlightedIndex || i === hoveredIndex}
                type="button"
                on:mouseenter={() => {highlightedIndex = -1; hoveredIndex = i; }}
                on:mouseleave={() => { hoveredIndex = -1; }}
                on:mousedown|preventDefault={() => dispatch('select', result)}
              >
                {result}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
  <div class="overlay"
    role="button"
    tabindex="0"
    on:click={() => showSearchModal = false}
    on:keydown={(e) => e.key === 'Escape' && (showSearchModal = false)}
    aria-label="Close delete overlay"
    >
  </div>
{/if}



<!------------------------------------ SEARCH MODAL --------------------------------------->

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
    width: 50%;
    min-width: 40%; 
    z-index: 250;
    padding: 0;
  }

  .search-panel-inner {
    border-radius: 6px;
    background: rgba(200, 200, 200, 0.8);
    animation: slideIn 1400ms ease;
    padding: 25px;
    font-size: 1.4em;
    font-weight: 350;
    width: 300px;
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
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    padding: 8px 5px;
    width: 100%;
    font-size: 0.65em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

</style>
