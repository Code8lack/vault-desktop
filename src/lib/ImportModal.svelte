<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  let importError = '';

  export let showImportModal: boolean;
  export let importHeaders: string[]  = [];
  export let importSample: string[]   = [];
  export let importFilePath: string   = '';
  export let submitImportMapping: (mapping: Record<string, number>) => void;

  const dispatch = createEventDispatcher();

  const ourFields = ['service', 'password', 'username', 'website', 'notes'];
  const required  = ['service', 'password'];

  let mapping: Record<string, number | ''> = {
    service: '', password: '', username: '', website: '', notes: ''
  };

  function close() {
    dispatch('close');
  }


  function handleSubmit() {
    const confirmed: Record<string, number> = {};
    for (const field of ourFields) {
      if (mapping[field] !== '') {
        confirmed[field] = mapping[field] as number;
      }
    }
    const missing = required.filter(f => !(f in confirmed));
    if (missing.length > 0) {
      importError = `Please map required fields: ${missing.join(', ')}`;
      return;
    }
    submitImportMapping(confirmed);
  }

</script>

{#if showImportModal}
  <div class="display-panel import-panel">
    <button class="panel-close" type="button" aria-label="Close panel" on:click={close}>✕</button>

    <fieldset style="border: none;">
      <legend class="header-title">Import Entries</legend>

      <div class="import-form">
        <p class="import-hint">Match each of your vault fields to a column from the imported file.</p>

        {#if importError}
          <p class="import-error">{importError}</p>
        {/if}

        <div class="mapping-grid">
          <span class="grid-header">Your Field</span>
          <span class="grid-header">Imported Column</span>
          <span class="grid-header">Sample Value</span>

          {#each ourFields as field}
            <span class="field-label {required.includes(field) ? 'required' : ''}">
              {field}{required.includes(field) ? ' *' : ''}
            </span>

            <select bind:value={mapping[field]}>
              <option value="">— ignore —</option>
              {#each importHeaders as header, i}
                <option value={i}>{header}</option>
              {/each}
            </select>

            <span class="sample-value">
              {mapping[field] !== '' ? (importSample[mapping[field] as number] ?? '—') : '—'}
            </span>
          {/each}
        </div>
      </div>

      <div class="panel-buttons crud">
        <button class="btn" type="button" on:click={handleSubmit}>✅</button>
        <button class="btn" type="button" on:click={close}>❌</button>
      </div>
    </fieldset>
  </div>

  <div class="overlay"
    role="button"
    tabindex="0"
    on:click={close}
    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } }}
    aria-label="Close import overlay"
  ></div>
{/if}

<style>
  .import-panel {
    border: 1px solid #xxx;
    height: 80%;
    top: 25px;
    width: 530px;
    min-width: 200px;
    align-items: center;
    justify-content: center;
    position: absolute;
    margin: 0 115px;
    padding-bottom: 60px;
    z-index: 201;
    animation: none;
  }

  .header-title {
    position: relative;
    font-size: 25px;
    margin: 20px auto 30px;
    top: 50px;
  }

  .panel-close {
    z-index: 1;
  }

  .import-form {
    border: 1px solid #666;
    border-radius: 6px;
    background: rgba(100, 100, 100, 0.3);
    padding: 50px 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .import-hint {
    font-size: 13px;
    color: #aaa;
    margin-bottom: 20px;
    text-align: center;
  }

  .import-error {
    font-size: 13px;
    color: #e05c5c;
    text-align: center;
    margin: -10px 0 10px;
  }

  .mapping-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 10px 16px;
    width: 100%;
    align-items: center;
  }

  .grid-header {
    font-size: 12px;
    color: #888;
    font-weight: 300;
    border-bottom: 1px solid #555;
    padding-bottom: 4px;
  }

  .field-label {
    font-size: 14px;
    color: #ccc;
  }

  .field-label.required {
    color: #fff;
  }

  .mapping-grid select {
    background: rgba(39, 180, 245, 0.25);
    border: 1px solid #555;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 13px;
    color: #fff;
  }

  .mapping-grid select:focus {
    outline: none;
  }

  .sample-value {
    font-size: 12px;
    color: #888;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .import-panel fieldset {
    position: absolute;
    padding-top: 40px;
    top: 0;
  }

  .import-panel .panel-close {
    position: absolute;
    top: 0;
    right: 5px;
    margin: 0;
  }

  .panel-buttons {
    margin-top: 25px;
  }
</style>