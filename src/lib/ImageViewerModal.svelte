<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  export let showViewer: boolean = false;
  export let imageSrc: string = '';
  export let serviceName: string = 'Attachment';

  const dispatch = createEventDispatcher();

  // Zoom/pan state
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let didDrag = false;

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
  }

  function close() {
    resetZoom();
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.25 : -0.25;
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
    scale = next;
    if (scale === MIN_SCALE) {
      translateX = 0;
      translateY = 0;
    }
  }

  function handleMouseDown(event: MouseEvent) {
    if (scale === MIN_SCALE) return;
    isDragging = true;
    didDrag = false;
    dragStartX = event.clientX - translateX;
    dragStartY = event.clientY - translateY;
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    didDrag = true;
    translateX = event.clientX - dragStartX;
    translateY = event.clientY - dragStartY;
  }

  function handleMouseUp() {
    isDragging = false;
  }

  // Guards the overlay's click-to-close so a drag that ends outside
  // the modal doesn't get misread as a click-to-close
  function handleOverlayClick(event: MouseEvent) {
    if (didDrag) {
      didDrag = false;
      return;
    }
    close();
  }

  // Focus management for modal
  let modalContent: HTMLElement;
  onMount(() => {
    if (showViewer && modalContent) {
      modalContent.focus();
    }
  });
</script>

{#if showViewer}
  <div 
    class="modal-overlay" 
    on:click|self={handleOverlayClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div 
      class="modal-content" 
      bind:this={modalContent}
      tabindex="-1"
    >
      <div class="modal-header">
        <h3 id="modal-title">{serviceName} - Secure Viewer</h3>
        <button class="close-btn" on:click={close} aria-label="Close viewer">&times;</button>
      </div>
      <div 
        class="image-container"
        class:zoomed={scale > MIN_SCALE}
        class:dragging={isDragging}
        on:wheel={handleWheel}
        on:mousedown={handleMouseDown}
        on:mousemove={handleMouseMove}
        on:mouseup={handleMouseUp}
        on:mouseleave={handleMouseUp}
      >
        {#if imageSrc}
          <img 
            src={imageSrc} 
            alt="Secure Wallet Attachment" 
            draggable="false"
            style="transform: translate({translateX}px, {translateY}px) scale({scale});"
          />
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
    outline: none;
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
  .image-container.zoomed {
    cursor: grab;
  }
  .image-container.zoomed.dragging {
    cursor: grabbing;
  }
  img {
    max-width: 100%;
    max-height: 65vh;
    object-fit: contain;
    transition: transform 0.15s ease-out;
    user-select: none;
    -webkit-user-drag: none;
  }
  .image-container.dragging img {
    transition: none;
  }
  .no-image {
    color: var(--text-muted, #888);
    padding: 40px;
  }
</style>