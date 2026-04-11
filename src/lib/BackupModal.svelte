<script>
  import { fly } from 'svelte/transition';

  let {
    showBackupModal = false,
    provider = 's3',
    backupEnabled = false,
    backupInterval = 24,
    intervalUnit = 'hours',
    endpoint = '',
    username = '',
    backupPassword = '',
    retention = 30,
    encrypt = true,
    sendToBackend = () => {},
    setMessage = () => {},
    onclose = () => {}

  } = $props();

  let errorMessage = $state('');

  $effect(() => {
    if (showBackupModal) {
      sendToBackend('get_backup_config');
    }
  });

  function getIntervalInMinutes() {
    if (intervalUnit === 'hours') return backupInterval * 60;
    if (intervalUnit === 'days') return backupInterval * 1440;
    return backupInterval * 60;
  }

  function calculateNextBackup(interval, unit) {
    const now = new Date();
    let next = new Date(now);
    if (unit === 'hours') next.setHours(next.getHours() + interval);
    else if (unit === 'days') next.setDate(next.getDate() + interval);
    return next.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function saveBackupSettings() {
    try {
      const config = [
        backupEnabled,
        getIntervalInMinutes(),
        provider,
        endpoint,
        username,
        backupPassword,
        retention,
        encrypt
      ].join('|');

      await sendToBackend('set_backup_config:' + config);
      setMessage('✅ Backup settings saved', false, false);
    } catch (err) {
      console.error('Failed to save backup settings:', err);
      errorMessage = '❌ Failed to save settings';
    }
  }
</script>

{#if showBackupModal}
  <div class="display-panel-order">
    <div class="display-panel modal" transition:fly={{ y: 20, duration: 300 }}>

      <button class="panel-close" type="button" aria-label="Close panel" onclick={() => onclose()}
        >x</button>
      <div class="modal-header backup">
        <h2 class="header-title" style="margin: 0 auto;">Automated Backup Settings</h2>
      </div>

      <div class="modal-backup-viewport">
        <label class="dropdown">
          Provider
          <select bind:value={provider}>
            <option value="s3">S3-compatible</option>
            <option value="sftp">SFTP</option>
            <option value="webdav">WebDAV</option>
          </select>
        </label>
        <label class="endpoint">
          Endpoint
          <input type="text" bind:value={endpoint} placeholder="https://s3.example.com" />
        </label>

        <label>
          Username
          <input type="text"
            bind:value={username}
            placeholder="Daysmith"
          />
        </label>
        <label>
          Password
          <input type="password" bind:value={backupPassword} placeholder="(Password will not be displayed)" />
        </label>

        <label>
          Backup Frequency
          <div class="frequency-input">
            <input
              type="number"
              bind:value={backupInterval}
              min="1"
              max="168"
              style="width: 80px;"
            />
            <select bind:value={intervalUnit}>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        </label>

        <label>
          Retention Period
          <div class="retention-input">
            <input
              type="number"
              bind:value={retention}
              min="1"
              max="365"
              style="width: 80px;"
            />
            <span>Days</span>
          </div>
        </label>

        <label>
          <div class="encrypt-check">
            Encrypt before upload
            <input type="checkbox" bind:checked={encrypt} />
          </div>
        </label>

        <label>
          <div class="auto-backups-check">
            Enable Automated Backups
            <input type="checkbox" bind:checked={backupEnabled} />
          </div>
        </label>
      </div><!--modal-backup-viewport-->

      <div class="panel-buttons backup-buttons">
        <div class="backup-buttons-child">
          <button
            class="btn"
            type="button"
            onclick={() => { saveBackupSettings(); onclose(); }}
          >
            ✅
          </button>
          <button
            class="btn"
            type="button"
            onclick={() => onclose()}
          >
            ❌
          </button>
        </div>
      </div>
    </div><!--display-panel modal-->
  </div>

  <div
    class="overlay"
    role="button"
    tabindex="0"
    onclick={() => onclose()}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closePanel(); } }}
    aria-label="Close panel (click outside)"
  >
  </div>


{/if}




<!-- ------------------------------------------------------------------- -->

<style>

  .display-panel-order {
    margin-top: -190px;
  }

  .display-panel-order .modal{
    height: 550px;
    width: 400px;
    padding-top: 0;
  }

  .modal-header {
    margin: 20px 0 10px;
  }

  .panel-close {
    position: relative;
    top: 30px;
    margin-right: -25px;
  }

  .modal-backup-viewport {
    position: relative;
    border: 1px solid #666;
    border-radius: 8px;
    background-color: rgba(100, 100, 100, 0.2);
    padding: 0 10px 5px;
    margin: 0 auto 30px;
    width: 60%;
    max-height: 300px;
    overflow-y: auto;
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .dropdown{
    margin-top: 25px;
    float: left;
  }

  .endpoint {
    margin-top: 15px;
  }
  
  .modal-backup-viewport label{
    position: relative;
    width: 93%;
    height: 75px;
    float: left;
    font-weight: 400;
    font-size: 15px;
  }

  .modal-backup-viewport input {
    position: static;
    top: auto;
    width: 260px;
    text-align: center;
    margin: 5px 0 0;
    padding: 0;
    user-select: text;
    -webkit-user-select: text;
    position: relative;
    z-index: 10;
  }

  .modal-backup-viewport input::placeholder {
    color: #666;
  }

  .modal-backup-viewport .endpoint input {
    border:1px solid blue;
    width: 260px;
    padding-left: 10px;
  }


  .frequency-input{
    height: 70px;
    width: 175px;
  }

  .retention-input{
    width: 150px;
  }

  .frequency-input select {
    position: absolute;
    margin: 15px 0 0 0;
    left: 110px;
  }

  .retention-input span {
    margin-top: 15px;
    float: right;
  }

  .encrypt-check{
    height: 25px;
    margin: 10px auto;
  }

  .auto-backups-check{
    margin-top: 15px;
  }

  .backup-buttons{
    border-top: 1px solid #666;
    padding-top: 10px;
    position: relative;
    margin-top: -15px;
    width: 100%;
  }

  .backup-buttons-child {
    height: 75px;
    width: 350px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
  }

  .backup-buttons button {
    position: relative;
    left: 0;
    top: 0;
    }

</style>