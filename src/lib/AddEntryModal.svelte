<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let showAddEntryPanel: boolean;
  export let editMode: boolean;
  export let newServiceName: string;
  export let newUsername: string;
  export let newPasswordDisplay: string;
  export let newWebsite: string;
  export let newNote: string;

  export let submitNewEntry: () => void;
  export let handleAddEntryKeydown: (e: KeyboardEvent, field: string) => void;
  export let handleNewPasswordInput: (e: Event) => void;
  export let handlePasswordPaste: (e: ClipboardEvent, type: string) => void;
  export let strengthScore: number = 0;
  export let feedbackMessage: string = '';
  export let setMessage: (msg: string, isError?: boolean, isTimeout?: boolean) => void;

  import { hidePlaceholder } from './action.js';
  import { categories } from './categoryStore.js';
  import PasswordGenerator from './PasswordGenerator.svelte';

  const dispatch = createEventDispatcher();

  let showPasswordGenerator = false;
  let showCatPicker = false;

  
  function onUsePassword(e: CustomEvent<{ password: string }>) {
    newPasswordDisplay    = e.detail.password;
    showPasswordGenerator = false;
    handleNewPasswordInput({ target: { value: newPasswordDisplay } } as unknown as Event);
  }

  function isCatApplied(emoji: string): boolean {
    return newServiceName.includes(emoji);
  }

  function toggleChip(emoji: string) {
    if (isCatApplied(emoji)) {
      newServiceName = newServiceName.replace(emoji, '').replace(/\s{2,}/g, ' ').trim();
    } else {
      newServiceName = newServiceName.trimEnd() + ' ' + emoji;
    }
  }

  function close() {
    dispatch('close');
  }

  function noAdd() {
    if (typeof setMessage === 'function') {
      setMessage('❌ Nothing added or changed.', false, false);
    }
  }
</script>

{#if showAddEntryPanel}
  <form class="display-panel add-entry-panel" on:submit|preventDefault={submitNewEntry}>
    <button class="panel-close" type="button" aria-label="Close panel" on:click={() => { close(); noAdd(); }}>✕</button>

    <fieldset style="border: none;">
      <legend class="header-title">{editMode ? 'Edit Entry' : 'Add Entry'}</legend>
      <div class="add-entry-form">
        <div class="form-field service-name-field">
          <label for="add-entry-service-input">Service Name *</label>
          <div class="service-name-wrap">
            <input
              id="add-entry-service-input"
              bind:value={newServiceName}
              use:hidePlaceholder
              on:keydown={(e) => handleAddEntryKeydown(e, 'service')}
              placeholder="Service Name"
              type="text"
              autocorrect="off"
              autocomplete="off"
              spellcheck="false"
              required
            />
            <button
              class="cat-picker-trigger"
              type="button"
              title="Add category"
              on:click|stopPropagation={() => showCatPicker = true}
            >＋</button>
          </div>

          {#if showCatPicker}
            <!-- Picker popover -->
            <div class="cat-picker-popover" role="dialog" aria-label="Category picker">
              <button
                class="panel-close cat-picker-close"
                type="button"
                aria-label="Close category picker"
                on:click|stopPropagation={() => showCatPicker = false}
              >✕</button>
              <p class="cat-picker-title">Categories</p>
              <div class="cat-picker-list">
                {#each [...$categories].sort((a, b) => a.label.localeCompare(b.label)) as cat (cat.id)}
                  <button
                    class="cat-picker-row"
                    class:cat-row-active={isCatApplied(cat.emoji)}
                    type="button"
                    on:click|stopPropagation={() => toggleChip(cat.emoji)}
                  >
                    <span class="cat-row-emoji">{cat.emoji}</span>
                    <span class="cat-row-label">{cat.label}</span>
                    {#if isCatApplied(cat.emoji)}
                      <span class="cat-row-check">✓</span>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
            <!-- Overlay to dismiss -->
            <div
              class="cat-picker-overlay"
              role="button"
              tabindex="0"
              on:click|stopPropagation={() => showCatPicker = false}
              on:keydown={(e) => e.key === 'Escape' && (showCatPicker = false)}
              aria-label="Close category picker"
            ></div>
          {/if}
        </div>

        <div class="form-field">
          <label for="add-entry-username-input">Username/Login</label>
          <input
            id="add-entry-username-input"
            bind:value={newUsername}
            use:hidePlaceholder
            on:keydown={(e) => handleAddEntryKeydown(e, 'username')}
            type="text"
            spellcheck="false"
            autocomplete="off"
            placeholder="Username/Login"
          />
        </div>

        <div class="form-field">
          <label for="add-entry-password-input">Password</label>
          <input
            id="add-entry-password-input"
            title="{newPasswordDisplay}"
            type="text"
            bind:value={newPasswordDisplay}
            on:input={handleNewPasswordInput}
            use:hidePlaceholder
            on:paste={(e) => handlePasswordPaste(e, 'addEntry')}
            on:keydown={(e) => handleAddEntryKeydown(e, 'password')}
            placeholder="Enter password"
            spellcheck="false"
            autocomplete="off"
            required
          />
          {#if newPasswordDisplay}
            <div class="strength-bar-wrap">
              <div class="strength-bar" style="width: {Math.min(strengthScore * 10, 100)}%; background: {strengthScore < 4 ? '#e74c3c' : strengthScore < 7 ? '#f39c12' : '#2ecc71'}"></div>
            </div>
            {#if feedbackMessage}<span class="strength-hint">{feedbackMessage}</span>{/if}
          {/if}
        </div>

        <div class="form-field">
          <label for="add-entry-website-input">Website</label>
          <input
            type="text"
            bind:value={newWebsite}
            id="add-entry-website-input"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            use:hidePlaceholder
            on:keydown={(e) => handleAddEntryKeydown(e, 'website')}
            placeholder="URL"
          />
        </div>

        <div class="form-field add-note">
          <label for="add-entry-note-input">Note</label>
          <textarea
            use:hidePlaceholder
            bind:value={newNote}
            id="add-entry-note-input"
            placeholder="Optional notes"
            rows="3"
          ></textarea>
        </div>
      </div><!--add-entry-form-->
      <div class="panel-buttons crud">
        <!-- ── add the Generate button ── -->
        <button class="btn" type="button" title="Generate password" on:click={() => showPasswordGenerator = true}>🎲</button>
        <button class="btn" type="button" on:click={submitNewEntry}>✅</button>
        <button class="btn" type="button" on:click={() => { close(); noAdd(); }}>❌</button>
      </div>
    </fieldset>
  </form>

  <div class="overlay"
    role="button"
    tabindex="0"
    on:click={close(), noAdd}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        close();
      }
    }}
    aria-label="Close add entry overlay (click outside)"
  ></div>
{/if}

<PasswordGenerator
  show={showPasswordGenerator}
  on:usePassword={onUsePassword}
  on:close={() => showPasswordGenerator = false}
/>

<style>

  .add-entry-panel {
    border:1px solid #xxx;
    height: 80%;
    top: 25px;
    width: 430px;
    min-width:200px;
    overflow-x: none;
    align-items: center;
    justify-content: center;
    position: absolute;
    margin:0 165px;
    padding-bottom: 60px;
    z-index:201;/*ESSENTIAL*/
    animation: none;
  }

  .header-title {
    position: relative;
    font-size: 25px;
    margin: 20px auto 30px;
    top: 50px;
  }

  .panel-close{
    z-index: 1;/*ESSENTIAL*/
  }

  .add-entry-form {
    border: 1px solid #666;
    border-radius: 6px;
    background: rgba(100, 100, 100, 0.3);
    padding: 50px 85px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;/*ESSENTIAL*/
    height: 100%;
    overflow: visible;
  }

  .add-note {
    margin: -25px 0 0 -1px;
    width: 100%;
  }

  .add-entry-panel fieldset {
    position: absolute;
    padding-top: 40px;
    top: 0px;
  }

  .add-entry-panel .panel-close {
    position: absolute;
    top: 0;
    right: 5px;
    margin: 0;
  }

  .form-field {
    width:100%;
    margin-top: 70px;/*Distance between*/
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .form-field label {
    display: none;/*DISABLED*/
    margin-bottom: 0px;
    margin-top: 0px;
    font-size: 14px;
    font-weight: 300;
  }

  .form-field input,
  .form-field textarea {
    max-height: 25px;
    margin: -65px 0 0 0;
    background: rgba(39, 180, 245, 0.25);
    border: 1px solid #555;
    border-radius: 6px;
    padding: 10px;
    font-size: 15px;
    font-weight: 300;
    color: white;
  }

  .form-field input::placeholder, .add-note textarea::placeholder {
    font-size: 13px;
    font-weight: 300;
  }

  .form-field textarea {
    margin: 0;
    width: 85%;
  }

  .add-note {
    margin-top: -35px;
  }

  .form-field input:focus,
  .form-field textarea:focus {
    outline: none;
  }

  .form-field textarea {
    resize: vertical;
    font-family: inherit;
  }

  .add-note label {
    margin-top: 20px;
  }

  .panel-buttons {
    margin-top: 25px;
  }

  .strength-bar-wrap {
    height: 4px;
    width: 90%;
    background: rgba(255,255,255,0.5);
    border-radius: 2px;
    margin-top: -40px;
  }

  .strength-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease, background 0.3s ease;
  }
  .strength-hint {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 3px;
    display: block;
  }

  /* ── Service name + trigger button ── */
  .service-name-wrap {
    position: relative;
    width: 90%;
    display: flex;
    align-items: center;
    margin: -65px 0 0 0;
  }

  .service-name-wrap input {
    margin: 0 !important;
    flex: 1;
    padding-right: 36px; /* room for the + button */
  }

  .cat-picker-trigger {
    position: absolute;
    top: -25px;
    right: 6px;
    background: none;
    border: none;
    color: rgba(255,255,255,0.6);
    font-size: 1.1em;
    cursor: pointer;
    padding: 2px 4px;
    line-height: 1;
    transition: color 120ms;
  }

  .cat-picker-trigger:hover { color: white; }

  /* ── Picker popover ── */
  .cat-picker-popover {
    position: absolute;
    top: 10px;
    width: 75%;
    background: var(--bg-secondary);
    border: 1px solid #666;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    z-index: 500;
    padding: 12px 0 8px;
    max-height: 260px;
    display: flex;
    flex-direction: column;
  }

  .cat-picker-close {
    position: absolute;
    top: 4px;
    right: 8px;
    background: none;
    border: none;
    font-size: 1.5em;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
  }

  .cat-picker-close:hover { color: mediumvioletred; }

  .cat-picker-title {
    font-size: 1em;
    text-align: center;
    margin: 0 0 6px;
    font-weight: 400;
    padding-bottom: 10px;
    border-bottom: 1px solid;
  }

  .cat-picker-list {
    overflow-y: auto;
    flex: 1;
    padding: 0 8px;
  }

  .cat-picker-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 6px;
    margin-bottom: 5px;
    background: rgba(200,200,200,0.2);
    cursor: pointer;
    font-size: 0.88em;
    transition: background 100ms;
    text-align: left;
  }

  .cat-picker-row:hover { background: rgba(0,0,0,0.07); }

  .cat-row-active { background: rgba(0,0,0,0.08); font-weight: 500; }

  .cat-row-emoji { font-size: 1.2em; min-width: 24px; text-align: center; }
  .cat-row-label { flex: 1; }
  .cat-row-check  { color: green; font-weight: 700; margin-left: auto; }

  /* ── Picker overlay (behind popover, above form) ── */
  .cat-picker-overlay {
    position: fixed;
    inset: 0;
    z-index: 499;
    background: rgba(10, 10, 10, 0.8);
    cursor: default;
  }


</style>