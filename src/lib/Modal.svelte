<script>
  import { fly } from 'svelte/transition';

  export let title = '';
  export let panelClass = '';
  export let overlayClass = '';
  export let blockClose = false;
</script>

<div class="display-panel-order">
  <div class="display-panel {panelClass}" transition:fly={{ y: 20, duration: 300 }}>

    <button
      class="panel-close"
      type="button"
      aria-label="Close panel"
      on:click
    >✕</button>

    {#if title}
      <h2 class="header-title">{title}</h2>
    {/if}

    <slot />

  </div>
</div>

<div
  class="overlay {overlayClass}"
  role="button"
  tabindex="0"
  on:click
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!blockClose) dispatch('click');
    }
  }}
  aria-label="Close panel (click outside)"
>
</div>