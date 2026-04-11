<script>
  import { createEventDispatcher } from 'svelte';

  export let lockBg = '';
  export let authMode = '';
  
  const dispatch = createEventDispatcher();
  const STORAGE_KEY = 'vltmt-lock-contrast';

  let mode = localStorage.getItem(STORAGE_KEY) ?? 'dark';

  // Helper to determine if we are on a pre-auth screen
  $: isPreAuth = ['locked', 'password', 'recovery'].includes(authMode);

  $: {
    // Only apply contrast overrides if we have a background AND are in pre-auth mode
    if (lockBg && isPreAuth) {
      document.body.classList.toggle('locked-screen-light', mode === 'light');
      document.body.classList.toggle('locked-screen-dark', mode === 'dark');
    } else {
      // Stripping these allows the theme variables (var(--text-primary)) to take control [cite: 1, 4, 5]
      document.body.classList.remove('locked-screen-light', 'locked-screen-dark');
    }
  }

  function set(value) {
    mode = value;
    localStorage.setItem(STORAGE_KEY, value);
    dispatch('change', value);
  }
</script>

{#if lockBg && isPreAuth}
  <div class="contrast-toggle">
    <button
      class="circle light"
      class:active={mode === 'light'}
      on:click={() => set('light')}
      aria-label="Light text"
    ></button>
    <button
      class="circle dark"
      class:active={mode === 'dark'}
      on:click={() => set('dark')}
      aria-label="Dark text"
    ></button>
  </div>
{/if}

<style>
  .contrast-toggle {
    background: rgba(200, 200, 200, 0.2);
    padding: 10px;
    position: fixed;
    left: 18px;
    top: 93%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 105; 
    border-radius: 6px;
  }
  .circle {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1px solid white;
    cursor: pointer;
    padding: 0;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    z-index: 105;
  }

  .circle.light { background: rgba(200, 200, 200, 0.5); }
  .circle.dark  { background: rgba(20, 20, 20, 0.1); }

  .circle.light:hover {
    transform: scale(1.15);
    background: rgba(255, 255, 255, 1);
  }

  .circle.dark:hover {
    transform: scale(1.15);
    background: rgba(20, 20, 20, 1);
  }
  .circle.active:hover {
    transform: scale(1.2);
  }
</style>