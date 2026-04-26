<script>
  import { fly } from 'svelte/transition';
  import { tick } from 'svelte';
  import { categories } from './categoryStore.js';

  let {
    showCategoryModal = false,
    setMessage = () => {},
    onclose = () => {}
  } = $props();

  // ── Local form state ───────────────────────────────────────────────────────
  let newEmoji  = $state('');
  let newLabel  = $state('');
  let editingId = $state(null);
  let editEmoji = $state('');
  let editLabel = $state('');
  let formError = $state('');

  // DOM refs for programmatic focus
  let labelInputEl = $state(null);
  let editLabelEl  = $state(null);

  // Focus the label input when the modal opens, and refocus after adding
  $effect(() => {
    if (showCategoryModal) {
      resetNewForm();
      editingId = null;
      formError  = '';
      tick().then(() => labelInputEl?.focus());
    }
  });

  // Panel div keydown — just stop propagation for safety
  function handleModalKeydown(e) { e.stopPropagation(); }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function resetNewForm() {
    newEmoji = '';
    newLabel = '';
    formError = '';
  }

  function closePanel() {
    resetNewForm();
    editingId = null;
    onclose();
  }

  function addCategory() {
    //if (!newEmoji.trim()) { formError = '⚠️ Please enter an emoji.';  return; }
    if (!newLabel.trim()) { formError = '⚠️ Please enter a label.';   return; }
    categories.add(newEmoji, newLabel);
    setMessage(`✅ Category "${newLabel}" added.`, false, false);
    resetNewForm();
    tick().then(() => labelInputEl?.focus());
  }

  function startEdit(cat) {
    editingId = cat.id;
    editEmoji = cat.emoji;
    editLabel = cat.label;
    formError  = '';
    tick().then(() => editLabelEl?.focus());
  }

  function saveEdit() {
    if (!editEmoji.trim() || !editLabel.trim()) {
      formError = '⚠️ Emoji and label cannot be empty.';
      return;
    }
    categories.edit(editingId, editEmoji, editLabel);
    setMessage(`✅ Category updated.`, false, false);
    editingId = null;
    formError  = '';
  }

  function cancelEdit() {
    editingId = null;
    formError  = '';
  }

  function removeCategory(cat) {
    categories.remove(cat.id);
    setMessage(`🗑 "${cat.label}" removed.`, false, false);
    if (editingId === cat.id) editingId = null;
  }
</script>


{#if showCategoryModal}
  <div class="display-panel-order">
    <div
      class="display-panel category-panel"
      role="dialog"
      tabindex="0"
      aria-modal="true"
      aria-label="Category Manager"
      transition:fly={{ y: 20, duration: 300 }}
      onkeydown={handleModalKeydown}
    >
      <!-- Close button — top-right, matches TimeoutModal / TotpModal -->
      <button
        class="panel-close"
        type="button"
        aria-label="Close panel"
        onclick={closePanel}
      >✕</button>

      <h2 class="header-title">Categories</h2>

      <!-- ── Existing categories list ── -->
      <div class="cat-list-wrap">
        {#each $categories as cat (cat.id)}
          <div class="cat-row" class:editing={editingId === cat.id}>

            {#if editingId === cat.id}
              <!-- Edit row -->
              <input
                class="cat-input emoji-input"
                type="text"
                maxlength="4"
                bind:value={editEmoji}
                aria-label="Emoji"
              />
              <input
                class="cat-input label-input edit-label-input"
                type="text"
                bind:value={editLabel}
                bind:this={editLabelEl}
                aria-label="Category name"
                onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveEdit(); }}
              />
              <button class="cat-btn confirm" type="button" onclick={saveEdit}    aria-label="Save">✅</button>
              <button class="cat-btn cancel"  type="button" onclick={cancelEdit}  aria-label="Cancel">✕</button>
            {:else}
              <!-- Display row -->
              <span class="cat-emoji">{cat.emoji}</span>
              <span class="cat-label">{cat.label}</span>
              <button class="cat-btn edit"    type="button" onclick={() => startEdit(cat)}     aria-label="Edit">✎</button>
              <button class="cat-btn remove"  type="button" onclick={() => removeCategory(cat)} aria-label="Remove">🗑</button>
            {/if}

          </div>
        {/each}

        {#if $categories.length === 0}
          <p class="empty-note">No categories yet. Add one below.</p>
        {/if}
      </div>

      <!-- ── Add new category ── -->
      <div class="add-section">
        <div class="add-row">
          <input
            class="cat-input emoji-input"
            type="text"
            maxlength="4"
            placeholder="🏷"
            bind:value={newEmoji}
            aria-label="New category emoji"
            onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') addCategory(); }}
          />
          <input
            class="cat-input label-input"
            type="text"
            placeholder="Category name"
            bind:value={newLabel}
            bind:this={labelInputEl}
            onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') addCategory(); }}
            aria-label="New category name"
          />
        </div>
        {#if formError}
          <div class="form-error">{formError}</div>
        {/if}
      </div>

      <!-- ── Action buttons ── -->
      <div class="panel-buttons cat-main-buttons">
        <button class="btn" type="button" onclick={addCategory}>✅</button>
        <button class="btn" type="button" onclick={closePanel}>❌</button>
      </div>

    </div><!-- .display-panel -->
  </div><!-- .display-panel-order -->

  <!-- Clickable overlay — same pattern as TimeoutModal / AddEntryModal -->
  <div
    class="overlay"
    role="button"
    tabindex="0"
    onclick={(e) => { e.stopPropagation(); closePanel(); }}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); closePanel(); }
    }}
    aria-label="Close category panel"
  ></div>
{/if}


<!-- ─── STYLES ──────────────────────────────────────────────────────────────── -->
<style>

  /* ── Panel shell — mirrors TimeoutModal dimensions / placement ── */
  .display-panel-order {
    position: relative;
    top: -525px;       /* same offset as TotpModal */
    z-index: 100;
    width: 50%;
    height: 50%;
    margin: 0 auto;
  }

  .category-panel {
    min-width: 300px;
    width: 65%;
    height: auto;
    padding-bottom: 10px;
    pointer-events: all;  /* explicit — Tauri webview can drop this otherwise */
    position: relative;
    z-index: 310;         /* above the overlay (z-index 300) */
  }

  /* ── Header ── */
  .header-title {
    font-size: 22px;
    font-weight: 300;
    text-align: center;
    margin: 0 auto 14px;
  }

  .panel-close {
    position: relative;
    float: right;
    right: -10px;
    top: 5px;
    background: none;
    border: none;
    font-size: 20px;
    color: #666;
    cursor: pointer;
    padding: 4px 8px;
  }

  .panel-close:hover { color: mediumvioletred; }

  /* ── Categories list ── */
  .cat-list-wrap {
    background: rgba(100, 100, 100, 0.2);
    border: 1px solid #666;
    border-radius: 8px;
    margin: 0 auto 10px;
    width: 85%;
    max-height: 220px;
    overflow-y: auto;
    padding: 6px 0;
  }

  .cat-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    transition: background 120ms;
  }

  .cat-row:last-child { border-bottom: none; }

  .cat-row.editing {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }

  .cat-emoji {
    font-size: 1.2em;
    min-width: 26px;
    text-align: center;
  }

  .cat-label {
    flex: 1;
    font-size: 0.88em;
    font-weight: 300;
  }

  .empty-note {
    text-align: center;
    font-size: 0.82em;
    color: #888;
    padding: 16px 0;
    margin: 0;
  }

  /* ── Add-new section ── */
  .add-section {
    width: 85%;
    margin: 0 auto 6px;
  }

  .add-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  /* ── Shared input style — echoes AddEntryModal inputs ── */
  .cat-input {
    border: 1px solid #555;
    border-radius: 6px;
    background: rgba(39, 180, 245, 0.18);
    color: white;
    padding: 6px 8px;
    font-size: 0.88em;
    font-weight: 300;
    margin: 30px 0 -50px;
  }

  .cat-input::placeholder { color: #777; }
  .cat-input:focus        { outline: none; }

  .emoji-input { width: 44px; min-width: 0; text-align: center; font-size: 1em; flex-shrink: 0; }
  .label-input { flex: 1; min-width: 0; }

  /* Edit-row label input: tighter so buttons don't get pushed out */
  .edit-label-input { flex: 1; min-width: 0; max-width: calc(100% - 120px); }

  /* ── Row action buttons ── */
  .cat-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    transition: background 120ms;
  }

  .cat-btn.edit   { color: #555; }
  .cat-btn.remove { color: #999; }
  .cat-btn.confirm { color: green; }
  .cat-btn.cancel  { color: #888; font-size: 0.8em; }

  .cat-btn:hover { background: rgba(0,0,0,0.08); }

  /* ── Error text ── */
  .form-error {
    font-size: 0.78em;
    color: #e74c3c;
    margin-top: 25px;
  }

  /* ── Bottom buttons — mirrors TimeoutModal .timeout-main-buttons ── */
  .cat-main-buttons {
    border-top: 1px solid rgba(128, 128, 128, 0.4);
    padding: 20px 0;
    margin: -5px auto 0;
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 16px;
  }

</style>