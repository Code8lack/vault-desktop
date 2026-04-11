<script>
  import { createEventDispatcher } from 'svelte';
  import { themes, applyTheme } from '../lib/themes.js';

  export let activeThemeId;

  const dispatch = createEventDispatcher();

  function select(id) {
    applyTheme(id);
    dispatch('change', id);
  }

  function close() {
    dispatch('close');
  }

</script>


  <div class="display-panel theme-picker-panel">
    <button class="panel-close" type="button" aria-label="Close panel" on:click={close}>✕</button>
    <h2>Themes</h2>
    <div class="theme-options">
      {#each themes as theme}
        <div class="theme-option-row">
          <button
            class="btn menu-item theme-btn"
            class:active={activeThemeId === theme.id}
            on:click={() => {select(theme.id); close();}}
          >
            {theme.label}
          </button>
          {#if activeThemeId === theme.id}
            <span class="dot"></span>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div
    class="overlay"
    role="button"
    tabindex="0"
    on:click={close}
    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } }}
    aria-label="Close theme panel"
  ></div>


<style>

  h2 {
    padding-left: 10px;
  }

  .dot {
    background: #00ff9d;
    box-shadow: 0 0 8px #00ff9d;
    box-shadow: 0 0 10px #00ff9d, 0 0 20px #00ff9d;
    animation: pulse 3s infinite;
    border-radius: 50%;
    border:1px solid #46cc10;
    display: inline-block;
    height: 10px;
    width: 10px;
  }
  @keyframes pulse {
    0%,100% { opacity: 1; } 50% { opacity: 0.3; transform: scale(0.8); }
  }

  .theme-picker-panel {
    position: absolute;
    z-index: 201;
    width: 350px;
    min-width: 200px;
    top: 65%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding-bottom: 30px;
  }

  .panel-close {
    margin-right: -25px;
  }

  .theme-options {
    background: rgba(100, 100, 100, 0.15);
    border:1px solid #666;
    border-radius: 6px;
    padding: 30px 10px 30px 30px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 10px auto;
    height: 215px;
    overflow-y: auto;
  }

  .theme-option-row {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .theme-btn {
    display: flex;
    width: 175px;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-size: 0.9em;
  }

  .theme-tick {
    margin:0 auto;
  }

</style>