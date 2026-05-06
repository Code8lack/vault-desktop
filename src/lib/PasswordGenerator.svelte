<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let show: boolean = false;

  const dispatch = createEventDispatcher();

  // ── Slider state ──────────────────────────────────────────────────────────
  let length: number = 15;
  let entropyLevel: number = 1; // 0 = Low, 1 = Medium, 2 = High

  const entropyLabels  = ['Low', 'Medium', 'High'];
  const entropySummary = [
    'lowercase + digits only',
    'mixed case + digits',
    'mixed case + digits + symbols',
  ];

  // ── Derived info messages (showing the *other* metric) ────────────────────
  $: lengthInfoMsg  = `Entropy: ${entropyLabels[entropyLevel]} — ${entropySummary[entropyLevel]}`;
  $: entropyInfoMsg = `Length: ${length} characters`;
  // ── Entropy bit calculation: H = log2(poolSize) × length ─────────────────
  // ── Map continuous 0–100 to Low/Med/High bands ────────────────────────────
  $: entropyBand  = entropyLevel < 34 ? 0 : entropyLevel < 67 ? 1 : 2;
  $: poolSize     = buildPool(entropyBand).length;
  $: entropyBits  = (Math.log2(poolSize) * length).toFixed(1);
  // ── change: regenerate each time the modal is opened ──
  $: if (show) regenerate();

  // ── Password generation ───────────────────────────────────────────────────
  const CHARS = {
    lower:   'abcdefghijklmnopqrstuvwxyz',
    upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits:  '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
  };

  function regenerate() {
    generatedPassword = generate(length, entropyBand);
  }

  function buildPool(level: number): string {
    if (level === 0) return CHARS.lower + CHARS.digits;
    if (level === 1) return CHARS.lower + CHARS.upper + CHARS.digits;
    return CHARS.lower + CHARS.upper + CHARS.digits + CHARS.symbols;
  }

  function generate(len: number, level: number): string {
    const pool   = buildPool(level);
    const arr    = new Uint32Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, n => pool[n % pool.length]).join('');
  }

  let generatedPassword: string = '';

  function randomise() {
    length       = Math.floor(Math.random() * 25) + 8; // 8–32
    entropyLevel = Math.floor(Math.random() * 3);
    regenerate();
  }

  function usePassword() {
    dispatch('usePassword', { password: generatedPassword });
  }

  function close() {
    dispatch('close');
  }

  // Generate on first show
  onMount(() => regenerate());

  // Regenerate whenever sliders change
  $: if (length || entropyLevel !== undefined) regenerate();
</script>

{#if show}
  <div class="pg-modal" role="dialog" aria-label="Password Generator">
    <button class="panel-close" type="button" aria-label="Close" on:click={close}>✕</button>

    <h2 class="pg-title">🎲 Password Generator</h2>

    <div class="pg-body">

      <!-- ── Length slider ── -->
      <div class="pg-row">
        <label class="pg-label" for="pg-length">Length — <strong>{length}</strong></label>
        <div
          class="pg-track-wrap"
          on:pointerdown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
            const update = (ev: PointerEvent) => {
              const pct = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
              length = Math.round(8 + pct * (32 - 8));
            };
            update(e);
            e.currentTarget.setPointerCapture(e.pointerId);
            const up = () => window.removeEventListener('pointermove', update);
            window.addEventListener('pointermove', update);
            window.addEventListener('pointerup', up, { once: true });
          }}
        >
          <div class="pg-track">
            <div class="pg-fill"  style="width: {((length - 8) / (32 - 8)) * 100}%"></div>
            <div class="pg-thumb" style="left:  {((length - 8) / (32 - 8)) * 100}%"></div>
          </div>
        </div>
      </div>


     <!-- ── Entropy slider ── -->
      <div class="pg-row">
        <label class="pg-label" for="pg-entropy">Entropy — <strong>{entropyBits} bits</strong></label>
        <div
          class="pg-track-wrap"
          on:pointerdown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
            const update = (ev: PointerEvent) => {
              entropyLevel = Math.round(clamp((ev.clientX - rect.left) / rect.width, 0, 1) * 100);
            };
            update(e);
            e.currentTarget.setPointerCapture(e.pointerId);
            const up = () => window.removeEventListener('pointermove', update);
            window.addEventListener('pointermove', update);
            window.addEventListener('pointerup', up, { once: true });
          }}
        >
          <div class="pg-track">
            <div class="pg-fill"  style="width: {entropyLevel}%"></div>
            <div class="pg-thumb" style="left:  {entropyLevel}%"></div>
          </div>
        </div>
        <div class="pg-entropy-ticks" aria-hidden="true">
          {#each entropyLabels as lbl}<span>{lbl}</span>{/each}
        </div>
      </div>
        
      <!-- ── Generated password display ── -->
      <div class="pg-row">
        <label class="pg-label" for="pg-output">Generated Password</label>
        <input
          id="pg-output"
          class="pg-output"
          type="text"
          readonly
          value={generatedPassword}
          spellcheck="false"
        />
      </div>

    </div><!--pg-body-->

    <div class="pg-buttons">
      <button class="btn" type="button" title="Randomise everything" on:click={randomise}>🔀</button>
      <button class="btn" type="button" title="Use this password"    on:click={usePassword}>✅</button>
      <button class="btn" type="button" title="Cancel"               on:click={close}>❌</button>
    </div>

  </div>

  <div
    class="overlay pg-overlay"
    role="button"
    tabindex="0"
    on:click={close}
    on:keydown={(e) => { if (e.key === 'Escape') close(); }}
    aria-label="Close password generator"
  ></div>
{/if}

<style>
  .pg-modal {
    position: absolute;
    top: 25px;
    width: 430px;
    min-width: 200px;
    height: 80%;
    margin: 0 165px;
    padding: 40px 0;
    z-index: 210; /* above AddEntryModal's 201 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid #555;
    border-radius: 10px;
    background: var(--bg-primary, #3a3a3a);
    animation: none;
  }

  .pg-title {
    font-size: 22px;
    font-weight: 400;
    margin: 0 0 25px;
  }

  .panel-close {
    position: absolute;
    top: -25px;
    right: 20px;
    font-size: 1.3em;
  }

  .pg-body {
    display: flex;
    flex-direction: column;
    gap: 28px;
    width: 80%;
    border: 1px solid #666;
    border-radius: 6px;
    background: rgba(100,100,100,0.3);
    padding: 20px 20px 30px;
  }

  .pg-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pg-row:last-child .pg-label {
    position: relative;
    top: 25px;
  }

  .pg-label {
    padding-left: 5px;
    font-size: 15px;
    font-weight: 300;
  }

.pg-track-wrap {
    width: 100%;
    padding: 8px 0;
    cursor: pointer;
    user-select: none;
  }

  .pg-track {
    position: relative;
    width: 100%;
    height: 1px;
    background: rgba(39,180,245,0.35);
    border-radius: 10px;
  }

  .pg-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: rgba(39,180,245,0.7);
    border-radius: 10px;
    pointer-events: none;
  }

  .pg-thumb {
    position: absolute;
    top: 50%;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(39,180,245,0.9);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .pg-entropy-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    opacity: 0.5;
    margin: 0 0 15px;
    padding-left: 10px;
    color: var(--text-primary);
  }

  .pg-output {
    width: 100%;
    background: rgba(39,180,245,0.15);
    border: 1px solid #555;
    border-radius: 6px;
    padding: 10px;
    font-size: 14px;
    font-family: monospace;
    font-weight: 300;
    color: white;
    letter-spacing: 0.04em;
    box-sizing: border-box;
  }

  .pg-output:focus { outline: none; }

  .pg-buttons {
    margin-top: 25px;
    display: flex;
    gap: 12px;
  }

  .pg-overlay {
    z-index: 209;
  }
</style>