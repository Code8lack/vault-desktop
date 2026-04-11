<script>
  import { fly } from 'svelte/transition';

  let {
    showTimeoutModal = false,
    currentTimeout = 0,
    timeoutMinutes: initialMinutes = 2,
    sendToBackend = () => {},
    setMessage = () => {},
    onclose = () => {}
  } = $props();

  let timeoutMinutes = $state(initialMinutes);
  let timeoutError = $state('');

  $effect(() => {
    if (showTimeoutModal) {
      timeoutMinutes = initialMinutes;
      timeoutError = '';
    }
  });

  function closePanel() {
    timeoutError = '';
    timeoutMinutes = Math.floor(currentTimeout / 60000);
    onclose();
  }

  function validateAndSetTimeout() {
    const minutes = parseInt(timeoutMinutes);
    if (isNaN(minutes) || minutes < 2 || minutes > 60) {
      timeoutError = '⚠️ Please enter a value between 2 and 60 minutes';
      return;
    }
    const timeoutMs = minutes * 60000;
    sendToBackend(`reset_timeout:${timeoutMs}`);
    timeoutError = '';
    onclose();
  }
</script>

{#if showTimeoutModal}
  <div class="display-panel-order">
    <div class="display-panel timeout-panel">
      <button
        class="panel-close"
        type="button"
        aria-label="Close panel"
        onclick={closePanel}
      >✕</button>

      <h2 class="header-title">Session Timeout</h2>

      <div class="timeout-grandparent">

        <div class="top-label">
          Inactivity timeout (mins)
        </div>

        <div class="timeout-field-parent">
          <input
            type="number"
            bind:value={timeoutMinutes}
            min="2"
            max="60"
            class="text-input"
          />
          <div class="bottom-label">
            Current: {timeoutMinutes} min ({timeoutMinutes * 60} secs)
          </div>
          <div class="timeout-button-parent">
            <button
              class="btn"
              type="button"
              onclick={() => timeoutMinutes = Math.max(2, timeoutMinutes - 1)}
              style="left:0;"
            >
              –
            </button>
            <button
              class="btn"
              type="button"
              onclick={() => timeoutMinutes = Math.min(60, timeoutMinutes + 1)}
              style="right:0;"
            >
              +
            </button>
          </div>
        </div>
        {#if timeoutError}
          <div style="font-size: 0.8em; color: #f00; margin-top: -10px;">
            {timeoutError}
          </div>
        {/if}
      </div><!--timeout-grandparent-->

      <div class="panel-buttons timeout-main-buttons">
        <button
          class="btn"
          type="button"
          onclick={validateAndSetTimeout}
        >
          ✅
        </button>
        <button
          class="btn"
          type="button"
          onclick={closePanel}
        >
          ❌
        </button>
      </div>
    </div>
  </div>
  <div
    class="overlay"
    role="button"
    tabindex="0"
    onclick={closePanel}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closePanel(); } }}
    aria-label="Close settings overlay"
  >
  </div>
{/if}



<style>

/* ======================================== TIMEOUT ===================================== */

  
  .timeout-panel {
    height: 400px;
  }

  .timeout-panel .panel-close{
    margin-right: -25px;
  }

  .timeout-panel h2 {
    padding-bottom: 10px;
  }

  .timeout-grandparent {
    background: rgba(100, 100, 100, 0.2);
    padding-top: 20px;
    border-radius: 10px;
    margin: 0 auto;
    width: 55%;
  }


  /* Hide the default arrows in WebKit browsers */
  .text-input::-webkit-inner-spin-button,
  .text-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
    opacity: 0;
    pointer-events: none;
  }

  .timeout-field-parent{
    position: relative;
    display: block;
    width: 175px;
    margin:0 auto -35px;
    align-items: center;
  }

  .top-label, .bottom-label {
    text-align:center;
    posiiton:relative;
    margin:0 auto;
  }

  .bottom-label{
    position: absolute;
    width: 175px;
    margin:0 auto;
    bottom: 70px;
    font-size: 0.8rem;
  }

  .text-input {
    width: 160px;
    padding-left: 10px;
    margin: 45px auto;
    font-size: 1.25rem;
    text-align: center;
    border:1px solid #777;
  }

  .timeout-button-parent{
    width: 90px;
    height: 55px;
    margin: -50px auto 40px;
    position: relative;
  }

  .timeout-button-parent button{
    position: absolute;
    text-align: center;
    margin: 0 10px 30px;
    border:1px solid #777;
    padding: 5px;
    height: 30px;
    width: 30px;
  }

  .timeout-main-buttons{
    border-top: 1px solid gray;
    padding-top: 30px;
    margin:0 auto;
    width: 100%;
  }


  </style>