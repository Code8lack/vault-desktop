<script lang="ts">
  import { fade } from 'svelte/transition';

  export let label: string = 'Back';
  export let onBack: () => void;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onBack();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<button
  class="btn back-btn"
  on:click={onBack}
  transition:fade={{ duration: 100 }}
>
  ← {label}
</button>

<style>
  .back-btn {
    background: rgba(157, 158, 144, 0.3);
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid #56919C;
    color: #fff;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .back-btn:active {
    transform: translateY(2px);
  }
</style>