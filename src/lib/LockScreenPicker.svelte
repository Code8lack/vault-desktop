<script>
  import { createEventDispatcher } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';

  const dispatch = createEventDispatcher();
  const STORAGE_KEY = 'vltmt-lock-bg';

  export let currentBg;
  export let setMessage = () => {};

  async function pickFile() {
    let dataUrl;
    try {
      dataUrl = await invoke('pick_lock_bg_as_base64');
    } catch {
      return;
    }

    try {
      if (dataUrl.length > 7_000_000) {
        setMessage('⚠️ Image exceeds 5MB — it may load slowly.', false, true);
      }
      localStorage.setItem(STORAGE_KEY, dataUrl);
      dispatch('change', dataUrl);
      setMessage('✅ Lock screen background applied.', false, false);
    } catch (e) {
      setMessage('❌ Failed to load image.', false, true);
    }
  }

  function clearBg() {
    localStorage.removeItem(STORAGE_KEY);
    dispatch('change', '');
    setMessage('✅ Lock screen background cleared.', false, false);
  }

  function close() {
    dispatch('close');
  }
</script>

<div class="display-panel lock-bg-panel">
  <button class="panel-close" type="button" aria-label="Close panel" on:click={close()}
>✕</button>
  <h2>Lock Screen Background</h2>

  <div class="lock-bg-options">
    {#if currentBg}
      <div class="preview" style="background-image: url('{currentBg}')"></div>
    {/if}

    <button class="btn menu-item" on:click={pickFile}>Choose New Image</button>
    {#if currentBg}
      <button class="btn menu-item" on:click={clearBg}>Clear Image</button>
    {/if}
  </div>
</div>

<div
  class="overlay"
  role="button"
  tabindex="0"
  on:click={close()}
  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } }}
  aria-label="Close lock background panel"
></div>

<style>
  h2 {
    padding-left: 10px;
  }

  .lock-bg-panel {
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

  .lock-bg-options {
    background: rgba(100, 100, 100, 0.15);
    border: 1px solid #333;
    border-radius: 6px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 10px auto;
  }

  .preview {
    width: 100%;
    height: 100px;
    background-size: cover;
    background-position: center;
    border-radius: 4px;
    border: 1px solid #333;
  }

</style>