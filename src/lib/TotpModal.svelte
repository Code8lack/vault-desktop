<script>
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import { invoke } from '@tauri-apps/api/core';

  export let authMode = 'locked';
  export let authStep = '';
  export let showTotpModal = false;
  export let totpStatus = '';
  export let totpSecret = '';
  export let backupCodes = [];
  export let setMessage = () => {};
  export let startWatchdog = () => {};
  export let clearWatchdog = () => {};
  export let onclose = () => {};   // ← keep this if used, or switch to dispatched 'close'

  let totpCode = '';
  let isFocused = false;
  let copiedItems = new Set();

  // Reset TOTP state whenever the challenge mode is entered
  $: if (authMode === 'totp_challenge') {
    isFocused = false;
    totpCode = '';
  }

  const dispatch = createEventDispatcher();


  function handleToggleTotp() {
    dispatch('toggle');
  }

  // Clipboard helper (works in Tauri desktop context)
  async function copyToClipboard(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      // fallback for very old environments (rare in Tauri)
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  async function copySecret() {
    await copyToClipboard(totpSecret);
    setMessage('✅ Secret copied.'), true, false;
    copiedItems = new Set([...copiedItems, 'secret']);
  }

  async function copyCodes() {
    const codesText = backupCodes.join('\n');
    await copyToClipboard(codesText);
    setMessage('✅ Backup Codes copied.'), true, false;
    copiedItems = new Set([...copiedItems, 'codes']);
  }

$: bothCopied = copiedItems.has('secret') && copiedItems.has('codes');

</script>

{#if showTotpModal}
  <div class="display-panel-order">
    <div class="display-panel modal totp" transition:fly={{ y: 20, duration: 300 }}>
      {#if totpStatus !== 'setup'}
        <button class="panel-close" type="button" aria-label="Close panel" on:click={() => onclose()}
      >x</button>
      {/if}
      <div class="modal-header">
        <h2 class="header-title">TOTP Settings</h2>
      </div>
      
      {#if totpStatus === 'setup'}
        <div class="totp-setup-notice">
          <p><strong>Secret:</strong> <code>{totpSecret}</code></p>
          <p>Backup Codes (Save these! They can't be displayed again.):</p>
          <div class="backup-list">
            {#each backupCodes as code}
              <span class="code-tag">{code}</span>
            {/each}
          </div>
        </div>
        <div class="panel-buttons">
          {#if bothCopied}
            <button class="btn" type="button" on:click={() => onclose()}>
              Close
            </button>
          {:else}
            <button class="btn" type="button" on:click={copySecret}>
              Copy Secret
            </button>
            <button class="btn" type="button" on:click={copyCodes}>
              Copy Codes
            </button>
          {/if}
        </div>
      {:else}
        <div class="totp-status-control">
          <p>2FA is currently: <strong style="color: {totpStatus === 'enabled' ? 'green' : '#b00'};">
            {totpStatus ? totpStatus.toUpperCase() : 'UNKNOWN'}
          </strong></p>
          <div class="panel-buttons backup-buttons">
            <div class="totp-button">
              <button class="btn" on:click={handleToggleTotp}>
                {totpStatus === 'enabled' ? '❌ Disable 2FA' : '✅ Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
  <div class="overlay"
      role="button"
      tabindex="0"
      aria-label={totpStatus !== 'setup' ? "Close panel (click outside)" : null}
      on:click={() => { if (totpStatus !== 'setup') onclose(); }}
      on:keydown={(e) => {
        if (totpStatus !== 'setup' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onclose();
        }
      }}
  >
  </div>
{/if}

<!-- ← WRAP ADDED: centres the standalone totp-challenge on screen -->
<div class="totp-challenge-wrapper">
{#if authMode === 'totp_challenge'}
  {#if authStep !== 'password'}
    <!-- TOTP challenge -->
    <div class="totp-challenge pre-auth-input">
      <h3>2FA Required</h3>
      <input
        type="text"
        maxlength="8"
        bind:value={totpCode}
        placeholder={isFocused ? "" : "000000"} 
        on:focus={() => isFocused = true} 
        on:blur={() => isFocused = false} 
        on:keydown={(e) => e.key === 'Enter' && (invoke('dispatch_to_erlang', { message: `auth_totp:${totpCode}` }),  totpCode = '')}
      />
      <div class="panel-buttons">
        <button class="btn" on:click={() => (dispatch('resetPasswordStates'), invoke('dispatch_to_erlang', { message: `auth_totp:${totpCode}` }), totpCode = '')}>
          Verify & Enter
        </button>
      </div>
    </div>
  {/if}
{/if}
</div>

<style>
/* ========================================= CSS ========================================== */


  .display-panel-order{
    position: relative;
    top: -525px;
    z-index: 100;
    width: 50%;
    height: 50%;
    margin: 0 auto;
  }

  .totp .modal-header {
    margin: 0 0 20px;
  }

  .display-panel-order .modal {
    min-width: 300px;
    width: 65%;
    height: auto;
  }

  .backup-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
  }

  .code-tag {
    display: block;
    background: rgba(255, 255, 255, 1);
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .display-panel h2 {
    margin: 0;
    text-align: center;
    font-weight: 300;
  }

  .totp-button button{
    margin: 0 auto;
    width: max-content;
  }

  .totp-status-control {/*TRANS-PANEL*/
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 8px;
    background: rgba(100, 100, 100, 0.3);
    height: 100px;
    padding: 20px;
    width: 80%;
    margin: 0 auto;
  }

  .totp-status-control p {
    width: auto;
    text-align: center;
    margin: 0 auto;
  }

  .totp-setup-notice {
    border-radius: 6px;
    position: relative;
    height: 245px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .totp-setup-notice p:first-child {
    background: rgba(200, 200, 200, 0.6);
    border-radius: 4px;
    padding: 10px;
  }

  .totp-setup-notice p code, .backup-list {
    color: var(--text-primary);
  }


/* ===================== CHALLENGE ========================== */

  .totp-challenge-wrapper {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    pointer-events: none;
  }

  .totp-challenge-wrapper .totp-challenge {
    pointer-events: all;
  }

  .totp-challenge {/* für LOGIN*/
    background: rgba(100, 100, 100, 0.3);
    border-radius: 6px;
    border: 2px solid red;
    width: 50%;
    margin: 0 auto;
    height: 200px;
    display: flex;
    flex-direction: column;    
    justify-content: center;
    align-items: center;
  }

  h3{
    position: relative;
    text-align: center;
    font-weight: 400;
    margin-bottom: 50px;
  }

  .pre-auth-input {
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: absolute;
    top: 310px;
    margin: 10px auto;
    align-items: center;
    display: flex;
    flex-direction: column;
    width: 357px;
    border-radius:6px;
    height: 200px;
  }

  input {
    position: relative;
    display: block;
    text-align: center;
    color: floralwhite;
    top: -40px;
    height: 37px;/*ESSENTIAL for text hiding.*/
    width: 255px;
    font-size: 15px;
    padding: 5px 10px 0 15px;
    border-radius: 8px;
    border: 1px solid #666;
    background: rgba(39, 180, 245, 0.25);
    margin: 0 auto -45px;
  }

  input:focus {
    outline: none;
  }

/* ============= BUTTONS ================== */

  .totp .panel-close {
    position: relative;
    right: -10px;
    top: 5px;
    background: none;
    border: none;
    font-size: 20px;
  }

  .panel-buttons {
    position: relative;
    display: flex;
    gap: 12px;
    justify-content: center;
    align-items: center;
    height: 45px;
    width: 100%;
    margin-top: 20px;
  }
                     

</style>