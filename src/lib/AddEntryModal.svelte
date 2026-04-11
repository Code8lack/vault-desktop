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
  export let validationError: string = '';
  export let feedbackMessage: string = '';
  export let setMessage: (msg: string, isError?: boolean, isTimeout?: boolean) => void;

  import { hidePlaceholder } from './action.js';

  const dispatch = createEventDispatcher();

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
        <div class="form-field">
          <label for="add-entry-service-input">Service Name *</label>
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
            <!--{#if validationError}<span class="strength-error">⚠️ {validationError}</span>{/if}-->
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
    color: #777;
  }

  .form-field textarea {
    margin: 0;
    width: 92%;
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
    width: 97%;
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
  .strength-error {
    font-size: 11px;
    color: #e74c3c;
    margin-top: 3px;
    display: block;
  }

</style>