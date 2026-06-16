<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let showViewer: boolean = false;
  export let imageSrc: string = '';
  export let serviceName: string = 'Attachment';

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }
</script>

{#if showViewer}
  <div class="modal-overlay" on:click|self={close}>
    <div class="modal-content">
      <div class="modal-header">
        <h3>{serviceName} - Secure Viewer</h3>
        <button class="close-btn" on:click={close}>&times;</button>
      </div>
      <div class="image-container">
        {#if imageSrc}
          <img src={imageSrc} alt="Secure Wallet Attachment" />
        {:else}
          <p class="no-image">No attachment or image found for this entry.</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-content {
    background: var(--bg-primary, #1e1e1e);
    border: 1px solid var(--border-primary, #333);
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--border-primary, #333);
    padding-bottom: 10px;
  }
  .close-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    color: var(--text-primary, #fff);
    cursor: pointer;
  }
  .close-btn:hover {
    color: #f44336;
  }
  .image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    max-height: 70vh;
    overflow: hidden;
    border-radius: 6px;
    background: #0d0d0d;
  }
  img {
    max-width: 100%;
    max-height: 65vh;
    object-fit: contain;
  }
  .no-image {
    color: var(--text-muted, #888);
    padding: 40px;
  }
</style>