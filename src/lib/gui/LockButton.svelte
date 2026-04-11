<script lang="ts">
  import { triggerLock } from './triggerLock';
  export let label: string = '🔒 Lock';
  export let className: string = '';
</script>

<button class={className} on:click={triggerLock}>
  {label}
</button>
