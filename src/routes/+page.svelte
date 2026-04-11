<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { lockVault } from '../lib/gui/lock';
  import { copyToClipboard } from '../lib/clipboard.js';
  import LockButton from '$lib/gui/LockButton.svelte';
  import { fly, fade, slide, scale } from 'svelte/transition';
  import { parseAttackBatch } from '../lib/SecurityHandler.js';
  import { createEventDispatcher } from 'svelte';
  import TotpModal from '../lib/TotpModal.svelte';
  import { setupMainListener } from '$lib/main-listener.js';
  import SearchModal from '../lib/SearchModal.svelte';
  import AddEntryModal from '../lib/AddEntryModal.svelte';
  import BackupModal from '../lib/BackupModal.svelte';
  import ImportModal from '../lib/ImportModal.svelte';
  import TimeoutModal from '../lib/TimeoutModal.svelte';
  import ThemePicker from '$lib/ThemePicker.svelte';
  import { themes, applyTheme, loadSavedTheme } from '../lib/themes.js';
  import LockScreenPicker from '../lib/LockScreenPicker.svelte';
  import '../lib/app.css';
  import LockScreenContrastToggle from '../lib/LockScreenContrastToggle.svelte';
  import { tick } from 'svelte';
  
  export let serviceName: string;

  type AuthMode = 'locked' | 'authenticating' | 'authenticated' | 'changing_verify' | 'changing_new' | 'recovery' | 'error';
  
  let authMode: AuthMode = 'locked';
  let recoveryCode = '';
  let backendStatus = 'stopped';
  let backendMessage = '';
  let password = '';
  let masterPassword = '';
  let displayPassword = '';
  let confirmPassword = '';
  let entries: string[] = [];
  let infoMessage = '';
  let errorMessage = '';
  let keepAliveThrottle: any = undefined;
  let hotZone = false;
  let unlistenResponse: () => void;
  let unlistenReset: UnlistenFn | null = null;
  let unlistenError: () => void;
  let unlistenHotZone: () => void;
  let authTimeoutId: number | undefined = undefined;
  let backendStarting = false; 
  let headerMinimized = false;
  let changingNew = false;
  let changingVerify = false;
  let services = [];
  let selectedService = null;   
  let selectedSecret = null;
  let selectedUsername = '';
  let selectedWebsite = '';
  let selectedNote = '';
  let selectedIconPath = '';
  let latestIconPath = '';
  let infoTimeoutId: number | undefined = undefined;
  let prevAuthMode: AuthMode = 'locked';
  let prevSelectedService: string | null = null;
  let maskInterval: number | undefined = undefined;
  let placeholderInterval: number | undefined = undefined;
  let menuOpen = false;
  let openActionMenu: string | null = null;
  let activeSubMenu = ''; // 'security', 'settings', etc.
  let displayPanel = false;
  let displayPanelTitle = '';
  let displayPanelContent = '';
  let recoveryCodeJustGenerated = false;
  let recoveryInProgress = false;
  let dot = '•';
  let showAddEntryPanel = false;
  let showNerdPanel = localStorage.getItem('nerdPanelActive') === 'true';
  let newServiceName = '';
  let newPassword = '';
  let newUsername = '';
  let newWebsite = '';
  let newNote = '';
  let selectedSecretRaw = '';
  let selectedSecretDisplay = '';
  let secretMaskInterval: number | undefined = undefined;
  let showDeletePanel = false;
  let showServiceOverlay = false;
  let newPasswordDisplay = '';
  let confirmPasswordDisplay = '';
  let newPasswordMaskInterval: number | undefined = undefined;
  let confirmPasswordMaskInterval: number | undefined = undefined;
  let msgTimer;
  let errorTimer;
  let editMode = false;
  let editingServiceName = '';
  let originalService = '';
  let backupCode = '';
  let isGeneratingBackup = false;
  let selectedStrengthScore = 0.0;
  let currentPlaceholderIndex = 0;
  let animatedPlaceholder = ''; 
  let currentTimeout = parseInt(localStorage.getItem('vaultTimeout'));
  let timeoutMinutes = Math.floor(currentTimeout / 60000);
  let showTimeoutModal = false;
  let showBackupModal = false;
  let securityReport = null;
  let showSecurityModal = false;
  let showLoginAttemptPanel = false;
  let sessionToken = '';
  let loginAttempts = [];
  let attemptDetails: any[] = [];
  let hasPendingFailureCheck = false;
  let rawPayload = '"login_attempt_detected:Unknown|Local|CLI/GUI|HyGuard Client"';
  let favorites = new Set<string>();
  let sortByFavorites = true; // Toggle for favorites-first sorting
  let passwordFeedback = "";
  let strengthScore = 0;
  let validationError = "";
  let feedbackMessage = "";
  let isForced = false;
  let generatedCode = '';
  let recoveryCodeGenerated = false;
  let showRecoveryWarning = false;
  let unlistenRecoveryValid;
  let recoveryModalMessage = '';
  let isSessionActive = false;
  let isBackingUp = false;
  let showTotpModal = false;
  let totpStatus = '';
  let totpSecret = '';
  let totpQrUri = '';
  let backupCodes: string[] = [];
  let passwordPlaceholder;
  let inputCode = ''; // For the 6-digit TOTP
  let isVerifying = false;
  let authStep = 'password'; // 'password' | 'totp'
  let totpCode = '';
  let enabled = '';
  let interval_min = '';
  let finalMsg = '';
  let newMasterPassword = '';
  let confirmMasterPassword = '';
  let showNewPasswordFields = false;
  let newMasterPasswordDisplay = '';
  let confirmMasterPasswordDisplay = '';
  let showForcePassword = false;
  let isFocused = false; 
  let persistentInfo = false;
  let securityReportAutoLoad = false;
  let securityPollInterval = null;
  let showSearchModal = false;
  let searchTerm = '';
  let securityScore = 'No search term.';
  let highlightedIndex = -1;
  let collapsed = false;
  let provider: 's3' | 'sftp' | 'webdav' = 's3';
  let backupEnabled = false;
  let backupInterval = 24;
  let intervalUnit = 'hours';
  let endpoint = '';
  let username = '';
  let backupPassword = '';
  let retention = 30;
  let encrypt = true;
  let navVisible = true;
  let showImportModal = false;
  let importHeaders: string[] = [];
  let importSample: string[] = [];
  let importFilePath = '';
  let pendingIconService = null;
  let peekPassword = false;
  let peekInputEl: HTMLInputElement;
  let maskedInputEl: HTMLInputElement;
  let showThemePicker = false;
  let activeThemeId = loadSavedTheme();
  let lockedBackground = 'bruce';
  let usePasswordRecovery = false;
  let showLockBgPicker = false;
  let lockBg = localStorage.getItem('vltmt-lock-bg') ?? '';
  let lockContrastMode = localStorage.getItem('vltmt-lock-contrast') ?? 'dark';
  let flashingBtn = null; // holds the id string of the button currently flashing
  let serviceListEl;
  let listReady = false;

  const dispatch = createEventDispatcher();
  const CYCLE_TIME_MS = 3000;
  const DEFAULT_MSG_DURATION = 5000;
  const HEAT_PALETTE = {
    OFF: '#333',
    RED: 'indianred',
    ORANGE: '#ffa500',
    YELLOW: '#ffff00',
    L_GREEN: '#D4BC5B',
    D_GREEN: '#5F9431'
  };


//=============================== REACTIVES =========================================//

$: isPreAuth = ['locked', 'password', 'recovery'].includes(authMode);

$: headerMinimized = (authMode === 'authenticated');
$: changingNew = (authMode === 'changing_new');
$: changingVerify = (authMode === 'changing_verify');
$: changingNew = (authMode === 'changing_new' || authMode === 'recovery_password');

$: {
    if (['authenticated', 'changing_verify', 'changing_new'].includes(authMode)) {
        window.addEventListener('mousemove', sendKeepAlive);
    } else {
        window.removeEventListener('mousemove', sendKeepAlive);
    }
}

$: _ = errorMessage;

$: {
  if (selectedSecretRaw) {
      // Simple entropy calculation: (Length * 0.5) + (Variety Bonus)
      const len = selectedSecretRaw.length;
      const variety = (/[A-Z]/.test(selectedSecretRaw) ? 1.5 : 0) + 
                      (/[0-9]/.test(selectedSecretRaw) ? 1.5 : 0) + 
                      (/[^A-Za-z0-9]/.test(selectedSecretRaw) ? 2 : 0);
      
      // Ensure the final score is clamped between 0 and 10 for your /2 divider
      selectedStrengthScore = Math.min(10, (len * 0.4) + variety);
  } else {
      selectedStrengthScore = 0;
  }
}

$: heatStack = getHeatStackColors(selectedStrengthScore || 0);

$: if (showLoginAttemptPanel && authMode === 'locked') {
  authMode = 'authenticated';
}

$: deduplicatedAttempts = attemptDetails.reduce((unique, current) => {
  const exists = unique.some(item => item.time === current.time);
  return exists ? unique : [...unique, current];
}, [] as typeof attemptDetails);

$: sortedEntries = sortByFavorites 
  ? [...entries].sort((a, b) => {
      const aFav = favorites.has(a);
      const bFav = favorites.has(b);
      if (aFav !== bFav) return aFav ? -1 : 1; // Favorites first
      return a.localeCompare(b); // Then alphabetical
    })
  : [...entries].sort((a, b) => a.localeCompare(b));

$: isCurrentServiceFavorited = selectedService ? favorites.has(selectedService) : false;

$: if (authMode === 'authenticated') {
  isSessionActive = true;
}

$: if (authMode === 'changing_new') {
  newPasswordDisplay = '';
  confirmPasswordDisplay = '';
}

$: isPasswordWeak = strengthScore > 0 && strengthScore < 3.0;
$: headerAdjusted = (authMode === 'authenticated' && selectedService !== null);
$: headerListAdjusted = (authMode === 'authenticated' && selectedService == null);

// Reactive search logic: filter sortedEntries if searchTerm is 2+ chars
$: searchResults = searchTerm.trim().length >= 1 
  ? sortedEntries.filter(service => 
      service.toLowerCase().includes(searchTerm.toLowerCase())
    ) 
  : [];

$: if (!showSearchModal) {
  searchTerm = '';
}

$: isBlocked = !authMode || showAddEntryPanel || menuOpen || showSearchModal;

$: if (searchResults) {
  highlightedIndex = -1;
  collapsed = false;
}

$: modalOpen = showBackupModal || showSecurityModal || showSearchModal || showAddEntryPanel;

$: if (peekPassword && peekInputEl) {
  requestAnimationFrame(() => peekInputEl.focus());
}
$: cogSrc = themes.find(t => t.id === activeThemeId)?.cog ?? '/cogs/cogS+C.png';

$: isHeaderList = selectedService === null && authMode === 'authenticated';

$: if (selectedService === null) {
  listReady = false;
  setTimeout(() => listReady = true, 1500);
}

// Reset copy-gate whenever the setup view is entered fresh
$: if (totpStatus === 'setup') {
  copiedItems = new Set();
}


// ===================================== CONSTANTS ========================================= //

  prevAuthMode = authMode;
  prevSelectedService = selectedService;

  const AUTH_TIMEOUT_MS = 500000; // frontend watchdog
  const isAuthenticated = () => authMode === 'authenticated';
  const MASK_DELAY_MS = 1500;
  const handleForgotPassword = () => {
    authMode = 'recovery';
    errorMessage = '';
    setMessage('Enter your recovery code to reset access. 🗝️ ', true, false);
    
    // Clear inputs to prevent state leakage
    password = '';
    displayPassword = '';
    confirmPassword = '';
    recoveryCode = '';
  };

  // Global focus handler for pre-auth inputs
  const handleGlobalKeyDown = (e) => {
    const active = document.activeElement;
    const isInput = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA';
    // Ignore if already in an input or if a modifier key (Cmd/Ctrl) is pressed
    if (!isInput && !e.metaKey && !e.ctrlKey && e.key.length === 1) {
      const input = document.querySelector('.pre-auth-input input');
      if (input) input.focus();
    }
  };


// ----------------------------- FUNCTIONS ---------------------------------- //


function ratingColor(rating) {
  return rating >= 10 ? '#45D65D' : '#f59f27';
}

function flashBtn(id) {
  flashingBtn = id;
  setTimeout(() => flashingBtn = null, 150);
}

function applyLockBg(dataUrl) {
  lockBg = dataUrl;
}

function closePanel() {
  // Reset the status to 'enabled' to hide setup credentials on return
  if (totpStatus === 'setup') totpStatus = 'enabled'; 
  dispatch('close');
  totpCode = '';
}

function handleSearchKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    if (!collapsed && searchResults.length > 0) {
      collapsed = true;
    } else {
      showSearchModal = false;
    }
    return;
  }

  if (!showSearchModal || searchResults.length === 0) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex = (highlightedIndex + 1) % searchResults.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex = (highlightedIndex - 1 + searchResults.length) % searchResults.length;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    // Use the highlighted item, or default to the first result if index is -1
    const targetIndex = highlightedIndex === -1 ? 0 : highlightedIndex;
    processSelection(searchResults[targetIndex]);
  }
}

function persistentFocus(node, isBlocked) {
  // Kickstart focus
  if (!isBlocked) {
    setTimeout(() => node.focus(), 100);
  }

  const handleFocusLoss = (e) => {
    // If we are blocked (modal open), do nothing and let the modal handle focus
    if (isBlocked) return; 

    if (document.activeElement !== node) {
      node.focus();
    }
  };

  window.addEventListener('focusin', handleFocusLoss);

  return {
    update(newBlocked) {
      isBlocked = newBlocked;
      if (!isBlocked) {
        node.focus();
      }
    },
    destroy() {
      window.removeEventListener('focusin', handleFocusLoss);
    }
  };
}

function focusInput(node, isVisible) {
    const handleGlobalFocus = (event) => {
      // If modal is active and focus moves to something that isn't our input
      if (isVisible && event.target !== node) {
        node.focus();
      }
    };

    if (isVisible) {
      node.focus();
      document.addEventListener('focusin', handleGlobalFocus);
    }

    return {
      update(newVisible) {
        isVisible = newVisible;
        if (isVisible) {
          node.focus();
          document.addEventListener('focusin', handleGlobalFocus);
        } else {
          document.removeEventListener('focusin', handleGlobalFocus);
        }
      },
      destroy() {
        document.removeEventListener('focusin', handleGlobalFocus);
      }
    };
  }

  function syncState(updatedOptions) {
    authMode = updatedOptions.authMode;
    authStep = updatedOptions.authStep;
    entries = updatedOptions.entries;
    services = updatedOptions.services;
    favorites = updatedOptions.favorites;
    password = updatedOptions.password;
    displayPassword = updatedOptions.displayPassword;
    infoMessage = updatedOptions.infoMessage;
    errorMessage = updatedOptions.errorMessage;
    hotZone = updatedOptions.hotZone;
    attemptDetails = updatedOptions.attemptDetails;
    securityReport = updatedOptions.securityReport;
    totpStatus = updatedOptions.totpStatus;
    totpSecret = updatedOptions.totpSecret;
    totpQrUri = updatedOptions.totpQrUri;
    backupCodes = updatedOptions.backupCodes;
    backupCode = updatedOptions.backupCode;
    isGeneratingBackup = updatedOptions.isGeneratingBackup;
    showLoginAttemptPanel = updatedOptions.showLoginAttemptPanel;
    showSecurityModal = updatedOptions.showSecurityModal;
    showSearchModal = updatedOptions.showSearchModal;
    selectedUsername = updatedOptions.selectedUsername;
    selectedWebsite = updatedOptions.selectedWebsite;
    selectedNote = updatedOptions.selectedNote;
    selectedIconPath = updatedOptions.selectedIconPath;
    selectedSecretRaw = updatedOptions.selectedSecretRaw;
    selectedSecretDisplay = updatedOptions.selectedSecretDisplay;
    selectedService = updatedOptions.selectedService;
    selectedSecret = updatedOptions.selectedSecret;
    latestIconPath = updatedOptions.latestIconPath ?? latestIconPath;
    searchTerm = updatedOptions.searchTerm;
    currentTimeout = updatedOptions.currentTimeout;
    timeoutMinutes = updatedOptions.timeoutMinutes;
    showRecoveryWarning = updatedOptions.showRecoveryWarning;
    generatedCode = updatedOptions.generatedCode;
    recoveryCodeGenerated = updatedOptions.recoveryCodeGenerated;
    recoveryModalMessage = updatedOptions.recoveryModalMessage;
    backupPassword = updatedOptions.backupPassword;
    provider = updatedOptions.provider;       
    endpoint = updatedOptions.endpoint;       
    username = updatedOptions.username;        
    backupEnabled = updatedOptions.enabled;    
    backupInterval = updatedOptions.intervalUnit === 'days'
      ? updatedOptions.interval_min / 1440
      : updatedOptions.interval_min / 60;
    intervalUnit = updatedOptions.intervalUnit;
    retention = updatedOptions.retention;
    encrypt = updatedOptions.encrypt;
    showImportModal = updatedOptions.showImportModal;
    importHeaders   = updatedOptions.importHeaders  ?? [];
    importSample    = updatedOptions.importSample   ?? [];
    importFilePath  = updatedOptions.importFilePath ?? '';
    strengthScore = updatedOptions.strengthScore ?? 0;
    validationError = updatedOptions.validationError ?? '';
    feedbackMessage = updatedOptions.feedbackMessage ?? '';
  }

  function toggleForceUI(showForce = true) {
    let stdBtn, frcBtn;

    if (authMode === 'recovery_password') {
        stdBtn = document.getElementById('set-password-btn');
        frcBtn = document.getElementById('force-set-password-btn');
    } else if (authMode === 'changing_new') {
        stdBtn = document.getElementById('change-password-btn');
        frcBtn = document.getElementById('force-change-password-btn');
    }

    if (stdBtn && frcBtn) {
        stdBtn.style.display = showForce ? 'none' : 'block';
        frcBtn.style.display = showForce ? 'block' : 'none';
    }
  }

  function clearForced(){
    // 🔧 Reset security state to ensure 'Confirm' button shows first
    strengthScore = 0;
    isPasswordWeak = false;
    passwordFeedback = '';
  }

  function confirmNewMasterPassword() {
    if (newPassword !== confirmPassword) {
      validationError = "Passwords do not match.";
      return;
    }
    if (validationError) return;
    sendToBackend(`change_master_password:${newPassword}`);
    authMode = 'authenticated';
    newMasterPassword = '';
    confirmMasterPassword = '';
    validationError = '';
    isForced = false;
  }

  function cancelPasswordChange() {
      authMode = 'authenticated';
      newPassword = '';
      confirmPassword = '';
      errorMessage = '';
      toggleForceUI(false);
  }

  function handleMenuKeydown(event) {
    if (event.key === 'Escape') {
      closeMenu();
      event.preventDefault();
    }
  }

  function startRecoveryProcess() {
    showRecoveryWarning = false;
    authMode = 'recovery_password';
  }

  function copyAndActivate() {
    if (!generatedCode) return;
      navigator.clipboard.writeText(generatedCode).then(() => {
      generatedCode = false;
      recoveryCodeGenerated = true;

      try {
        invoke('recovery_code_copied_and_activated');
        setMessage("✅ Recovery code copied and activated! You can now continue."), false, false;
      } catch (err) {
        console.warn("Failed to notify backend of code copy:", err);
        // Still allow continue, since copy succeeded locally
      }
    }).catch(err => {
      console.error("Clipboard copy failed", err);
      errorMessage("Failed to copy to clipboard. Please copy manually.");
    });
  }

  function completeAndUnlock() {
    if (!recoveryCodeGenerated) {
        errorMessage("You must copy the code first.");
        return;
    }
    strengthScore = 0;
    isPasswordWeak = false;
    passwordFeedback = '';
    showRecoveryWarning = false;
    authMode = 'authenticated';
  }

  function onPasswordInput() {
    // If they start typing again, bring back the standard button
    const normalBtn = document.getElementById('set-password-btn');
    const forceBtn = document.getElementById('force-set-password-btn');
    
    if (normalBtn) normalBtn.style.display = 'block';
    if (forceBtn) forceBtn.style.display = 'none';
  }

  function handlePasswordInput() {
    feedbackMessage = "";
    if (password.length === 0) {
        strengthScore = 0;
        feedbackMessage = "";
        return;
    }

    // Send the forced flag and the password separated by |
    if (window.bridge && typeof window.bridge.send === 'function') {
        window.bridge.send(`validate_password:${isForced}|${password}`);
    }
  }

  function checkForLoginAttempts() {
    sendToBackend("check_login_attempts");
  }

  function toggleFavorite(serviceName: string) {
    setMessage("✅ Favorite Toggled.", false, false);
    sendToBackend(`toggle_favorite:${serviceName}`);
  }

  function loadFavorites() {
    sendToBackend('get_favorites');
  }

  function handleToggle(event: MouseEvent) {
    event.stopPropagation(); // Prevent service selection when clicking star
    dispatch('toggle', { serviceName });
  }

  function startMasking() {
    if (maskInterval) {
      clearTimeout(maskInterval);
    }

    // Set a timeout to mask the last character after the delay
    maskInterval = window.setTimeout(() => {
      if (password.length > 0) {
        // Ensure the visual display is fully masked after the delay ⏱️ 
        displayPassword = dot.repeat(password.length);
      }
      maskInterval = undefined;
    }, MASK_DELAY_MS);
  }

  function startPasswordChange() {
    authMode = 'changing_verify';
    menuOpen = false;
  }

// 🧠 Refined Message Controller
  function setMessage(msg, isPersistent = false, isError = false) {
    if (isError) {
      clearTimeout(errorTimer);
      errorMessage = msg;
    } else {
      clearTimeout(msgTimer);
      infoMessage = msg;
      persistentInfo = isPersistent; 
    }

    // Only auto-clear if NOT persistent
    if (!isPersistent && msg !== '') {
      const timerId = setTimeout(() => {
        if (isError) errorMessage = '';
        else infoMessage = '';
      }, DEFAULT_MSG_DURATION);
      if (isError) errorTimer = timerId;
      else msgTimer = timerId;
    }
  }

  function navigateService(direction: 'prev' | 'next') {
    if (!entries.length) return;

    //traverse a case-insensitive sorted copy so e.g. eBay slots correctly between Dropbox and Edmond de Rothschild

    const sorted = [...entries].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    if (selectedService === null) {
      selectedService = direction === 'next' ? sorted[0] : sorted[sorted.length - 1];
      sendToBackend(`get_secret:${selectedService}`);
      return;
    }

    const index = sorted.indexOf(selectedService);
    if (index === -1) return;

    const nextIndex =
      direction === 'next'
        ? (index + 1) % sorted.length
        : (index - 1 + sorted.length) % sorted.length;

    selectedService = sorted[nextIndex];
    selectedSecret = null;
    sendToBackend(`get_secret:${selectedService}`);
  }

  function handleMasterPasswordInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;

    // 1. Check if characters were added or removed
    if (newValue.length > password.length) {
      // CHARACTERS ADDED
      const addedChars = newValue.slice(password.length);
      password += addedChars;

      // Show existing bullets + the new plain text character (the "peek") 👀 
      displayPassword = dot.repeat(password.length - addedChars.length) + addedChars;
      
      // Trigger the delayed masking for the newly added character
      startMasking();
    } else if (newValue.length < password.length) {
      // CHARACTERS REMOVED
      password = password.slice(0, newValue.length);
      displayPassword = dot.repeat(password.length);
      
      if (maskInterval) {
        clearTimeout(maskInterval);
        maskInterval = undefined;
      }
    }

    // 2. Keep the DOM element in sync with the visual state
    inputElement.value = displayPassword;
  }

  // ------------------------------------------------------------------
  // SERVICE SECRET MASKING LOGIC 🔒 
  // ------------------------------------------------------------------

  function startSecretMasking() {
    if (secretMaskInterval) clearTimeout(secretMaskInterval);
    
    secretMaskInterval = window.setTimeout(() => {
      if (selectedSecretRaw.length > 0) {
        selectedSecretDisplay = dot.repeat(selectedSecretRaw.length);
      }
      secretMaskInterval = undefined;
    }, MASK_DELAY_MS);
  }

  function handleSecretInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;

    if (newValue.length > selectedSecretRaw.length) {
      // CHARACTERS ADDED
      const addedChars = newValue.slice(selectedSecretRaw.length);
      selectedSecretRaw += addedChars;
      selectedSecretDisplay = dot.repeat(selectedSecretRaw.length - addedChars.length) + addedChars;
      startSecretMasking();
    } else if (newValue.length < selectedSecretRaw.length) {
      // CHARACTERS REMOVED
      selectedSecretRaw = selectedSecretRaw.slice(0, newValue.length);
      selectedSecretDisplay = dot.repeat(selectedSecretRaw.length);
      
      if (secretMaskInterval) {
        clearTimeout(secretMaskInterval);
        secretMaskInterval = undefined;
      }
    }
    inputElement.value = selectedSecretDisplay;
    selectedSecret = selectedSecretRaw; // Sync back to the main state
  }
  
  onDestroy(() => {
    if (unlistenResponse) unlistenResponse();
    if (unlistenError) unlistenError();
    if (unlistenHotZone) unlistenHotZone();
    if (authTimeoutId) clearTimeout(authTimeoutId);
    if (infoTimeoutId) clearTimeout(infoTimeoutId);
    if (maskInterval) clearTimeout(maskInterval);
    if (secretMaskInterval) clearTimeout(secretMaskInterval);
    if (newPasswordMaskInterval) clearTimeout(newPasswordMaskInterval);
    if (confirmPasswordMaskInterval) clearTimeout(confirmPasswordMaskInterval);

    window.removeEventListener('mousemove', sendKeepAlive);

  });


  //====================TRANS MENU JS============================//

  function toggleSubMenu(menu) {
    if (activeSubMenu === menu) {
      // Closing the currently open submenu
      activeSubMenu = '';
    } else if (activeSubMenu !== '') {
      // Switching from one submenu to another
      activeSubMenu = ''; // Close current
      setTimeout(() => {
        activeSubMenu = menu; // Open new after delay
      }, 300);
    } else {
      // Opening a submenu when none is open
      activeSubMenu = menu;
    }
  }

  function openMenu() {
    menuOpen = true;
    if (!menuOpen) activeSubMenu = '';
  }

  function openSubMenu(name: string) {
    activeSubMenu = name;
  }

  function closeSubMenu() {
    activeSubMenu = '';
  }

  function closeMenu() {
    menuOpen = false;
    activeSubMenu = '';
  }

//----------------------BASIC FUNCTIONS---------------------------


  function handleSelect(result) {
    showSearchModal = false;
    searchTerm = '';
    highlightedIndex = -1;
  }

  function capitalize(str) {
    str = `${str[0].toUpperCase()}${str.slice(1)}`;
    return str;
  }

  function openTimeoutSettings() {
    showTimeoutModal = true;
    sendToBackend('get_timeout');
    closeMenu();
  }

  function closeAllPanelsAndModals() {
    showAddEntryPanel   = false;
    showDeletePanel     = false;
    showTimeoutModal   = false;
    displayPanel        = false;
    menuOpen            = false;
    isGeneratingBackup  = false;
    openActionMenu      = null;
    activeSubMenu       = '';
    showSecurityModal   = false;
    showLoginAttemptPanel = false;
    showBackupModal     = false;
    showTotpModal       = false;
    showForcePassword   = false;
    showSearchModal     = false;


    // Clear sensitive form fields
    newServiceName = '';
    newPassword = '';
    newPasswordDisplay = '';
    confirmPassword = '';
    confirmPasswordDisplay = '';
    newUsername = '';
    newWebsite = '';
    newNote = '';
    authMode = 'locked';
  }

  function getHeatStackColors(s: number) {//CODE:RED
    const score = s / 2;
    if (score <= 1) return Array(5).fill(HEAT_PALETTE.RED); 
    if (score <= 1.5) return [HEAT_PALETTE.RED, HEAT_PALETTE.RED, HEAT_PALETTE.RED, HEAT_PALETTE.RED, HEAT_PALETTE.ORANGE];
    if (score <= 2.5) return [HEAT_PALETTE.ORANGE, HEAT_PALETTE.ORANGE, HEAT_PALETTE.YELLOW, HEAT_PALETTE.YELLOW, HEAT_PALETTE.YELLOW];
    if (score <= 3.75) return [HEAT_PALETTE.D_GREEN, HEAT_PALETTE.D_GREEN, HEAT_PALETTE.L_GREEN, HEAT_PALETTE.ORANGE, HEAT_PALETTE.ORANGE];
    if (score <= 4.85) return [HEAT_PALETTE.D_GREEN, HEAT_PALETTE.D_GREEN, HEAT_PALETTE.D_GREEN, HEAT_PALETTE.D_GREEN, HEAT_PALETTE.ORANGE];
    return Array(5).fill(HEAT_PALETTE.D_GREEN);
  }

  function clearMessages() {
    infoMessage = null
    errorMessage = null;
  }

  function startChange() {
    authMode = 'changing_verify';
    infoMessage = 'Verify your current password.';
    errorMessage = '';
    password = '';
    displayPassword = ''; 
  }

  function resetPasswordStates() {
    password = '';
    displayPassword = '';
    newPassword = '';
    newPasswordDisplay = '';
    confirmPasswordDisplay = '';
    if (maskInterval) {
        clearTimeout(maskInterval);
        maskInterval = undefined;
    }
    if (newPasswordMaskInterval) {
        clearTimeout(newPasswordMaskInterval);
        newPasswordMaskInterval = undefined;
    }
    if (confirmPasswordMaskInterval) {
        clearTimeout(confirmPasswordMaskInterval);
        confirmPasswordMaskInterval = undefined;
    }
  }

  function focus(node: HTMLInputElement) {
    node.focus();
  }

  function closeServiceOverlay() {
    showServiceOverlay = false;
  }

  function clearAuthTimeout() {
    if (authTimeoutId !== undefined) {
      clearTimeout(authTimeoutId);
      authTimeoutId = undefined;
    }
  }

  function startAuthWatchdog() {
    clearAuthTimeout();
    authTimeoutId = window.setTimeout(() => {
      // timed out waiting for backend response
      infoMessage = 'Verification timed out. Please try again.';
      errorMessage = '';
      // safe recovery: return to locked screen and clear secrets
      authMode = 'locked';
      password = '';
      newPassword = '';
      confirmPassword = '';
      hotZone = false;
      authTimeoutId = undefined;
    }, AUTH_TIMEOUT_MS);
  }

  $: if (authMode === 'locked') {
      resetPasswordStates();
  }

// ----------------------- DYNAMIC PLACEHOLDER --------------------------------

  const PLACEHOLDER_MESSAGES: string[] = [
    "AES-256-CTR Encryption Algorithm",
    "1,000,000 iterations PBKDF2 Key Derivations",
    "2-Factor Authentication",
    "HMAC-SHA512 Anti-Timing Attack Protocol",
    "Progessive Lockout System",
    "(128-bit) cryptographically secure random salt",
    "AES-256-CTR Encryption Algorithm"
  ];

  function startPlaceholderCycle() {
    if (placeholderInterval) {
      clearInterval(placeholderInterval);
    }

    placeholderInterval = setInterval(() => {
      // Cycle to the next message
      currentPlaceholderIndex = (currentPlaceholderIndex + 1) % PLACEHOLDER_MESSAGES.length;
      animatedPlaceholder = PLACEHOLDER_MESSAGES[currentPlaceholderIndex];
    }, CYCLE_TIME_MS);
  }

  function setAuthenticated() {
    authMode = 'authenticated';
    infoMessage = 'Vault unlocked';
  }

  function globalEnterHandler(e: KeyboardEvent) {
    if (e.key !== "Enter") return;

    switch (authMode) {
      case "locked":
        if (password) verifyPassword();
        break;

      case "changing_verify":
        if (password) submitVerifyForChange();
        break;

      case "changing_new":
        if (newPassword && confirmPassword) submitNewPassword();
        break;
      case "authenticated":
        break;
      default:
        break;
    }
  }


//---------------------------------------------- ASYNCs ----------------------------------------------
  

  async function recoverWithPassword() {
    if (!password) {
        errorMessage = 'Password is required';
        return;
    }
    setMessage('Verifying ...', false, false);
    errorMessage = '';
    try {
        await invoke('dispatch_to_erlang', { message: `recover_with_password:${password}` });
    } catch (err) {
        errorMessage = 'Recovery failed: ' + err;
    }
  }

  async function startBatchUpdate() {
    await sendToBackend('batch_fetch_icons');
    closeMenu();
  }

  async function openImportPicker() {
    try {
      const selected = await invoke('open_file_picker_import');
      if (selected) {
        await sendToBackend(`import_parse_headers:${selected}`);
      }
    } catch (err) {
      console.error('[IMPORT] Picker error:', err);
      errorMessage = 'Import cancelled.';
    }
  }

  async function handleCopy(text) { 
    const success = await copyToClipboard(text);
    if (success) {
        setMessage('✅ Copied', false, false);
        errorMessage = '';
    } 
  }

  async function processSelection(selected) {
    if (!selected) return;
    selectedService = selected;
    selectedSecret = null;
    showSearchModal = false;
    searchTerm = "";
    await sendToBackend(`get_secret:${selected}`);
    clearMessages();
  }

  async function sendToBackend(cmd: string) {
    try {
      await invoke('dispatch_to_erlang', { message: cmd });
      return true;
    } catch (firstErr) {
      console.warn('dispatch_to_erlang failed, attempting backend restart...', firstErr);

      try {
        await invoke('run_erlang_setup');
      } catch (startErr) {
        console.error('Failed to restart backend (run_erlang_setup).', startErr);
        return false;
      }

      await new Promise((r) => setTimeout(r, 300));

      try {
        await invoke('dispatch_to_erlang', { message: cmd });
        return true;
      } catch (secondErr) {
        console.error('dispatch_to_erlang retry failed after restart.', secondErr);
        return false;
      }
    }
  }

  async function handleNormalPasswordSubmit() {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) { errorMessage = 'Passwords do not match'; return; }
    errorMessage = '';
    setMessage('🔒 Updating password...', true, false);    
    const prefix = authMode === 'recovery_password' 
        ? 'set_recovery_password:' 
        : 'change_master_password:';
    try {
      await invoke('dispatch_to_erlang', { message: prefix + newPassword });
      clearMessages();
      setMessage('✅ Password updated.', true, false);    
    } catch (err) {
      clearMessages();
      errorMessage = 'Password update failed: ' + err;
    }
  }

  async function handleForcePassword() {
    if (!newPassword) return;

    // 🧹 Clear existing errors immediately to clean up the UI
    errorMessage = '';
    setMessage('⚠️ Applying weak password...', false, false);

    const prefix = authMode === 'recovery_password' 
        ? 'set_recovery_password_forced:' 
        : 'change_master_password_complete_forced:';

    try {
        await invoke('dispatch_to_erlang', { message: prefix + newPassword });
        
        // On success, reset UI state
        toggleForceUI(false); 
        infoMessage = ''; 
    } catch (err) {
        infoMessage = '';
        errorMessage = 'Force failed: ' + err;
    }
  }

  async function verifyCode() {
    if (inputCode.length !== 6) return;
    isVerifying = true;
    await invoke('dispatch_to_erlang', { message: `security:verify_totp:${inputCode}` });
  }

  async function generateNewRecoveryCode() {
      await invoke('dispatch_to_erlang', { message: 'generate_recovery_code' });
      // Response arrives via gui_response listener → new_recovery_code: payload
  }

  async function acknowledgeLoginAttempt() {
    try {
      await sendToBackend("acknowledge-login-attempt");
      
      showLoginAttemptPanel = false;
      hotZone = false;  // ⚠️ Release the lock
      
      // ⚠️ If user was authenticated before the alert, return to authenticated state
      if (password) {
        authMode = 'authenticated';
        sendToBackend('get_entries');
      }
      
    } catch (error) {
      console.error('Failed to acknowledge login attempt:', error);
    }
  }

  async function triggerSecurityAction(action: string) {
    if (action === 'security_report') {
      await invoke('dispatch_to_erlang', { message: 'security:security_report' });
    } else if (action === 'password_change') {
      menuOpen = false;
    } else if (action === 'totp_settings') {
      openTotpModal();
    }
    console.log('string: ', action);
  }

  function handleToggleTotp() {
    sendToBackend('toggle_totp:');
  }

  function openTotpModal() {
  // Clear any stale setup state from a previous session
  totpSecret = ''; 
  backupCodes = []; 
  totpStatus = 'loading';
  showTotpModal = true;
  sendToBackend("totp_settings");
}

  async function requestBackupCode() {
    await sendToBackend('entropy');
    await invoke('plugin:vault|ipc_send', { cmd: "security:get_backup_code" });
  }

  async function verifyPassword() {
    if (!password) return;
    setMessage('Verifying ...', false, false);
    errorMessage = '';
    startAuthWatchdog();
    await sendToBackend(`auth:${password}`);
  }

  async function submitVerifyForChange() {
    if (!password) return;
    setMessage('Verifying ...', false, false);
    errorMessage = '';
    startAuthWatchdog();
    await sendToBackend(`change_master_password_start:${password}`);
  }

  async function submitNewPassword() {
    if (newPassword !== confirmPassword) {
      errorMessage = "Passwords do not match";
      return;
    }
    setMessage('Changing password...', false, false);
    try {
      await invoke('dispatch_to_erlang', { message: `change_master_password:${newPassword}` });
    } catch (err) {
      errorMessage = 'Failed to change password: ' + err;
      console.error(err);
    }
  }

  async function requestList() {
    if (!isAuthenticated()) return;
    await sendToBackend('list');
  }

  async function autoFetchIcon() {
    if (!selectedWebsite || !selectedService) {
        errorMessage = 'No website or service selected.';
        return;
    }
    setMessage('Verifying ...', false, false);
    await sendToBackend(`fetch_favicon:${selectedService}|${selectedWebsite}`);
  }

  async function selectLocalIcon() {
    if (!selectedService) {
      errorMessage = 'No service selected.';
      return;
    }
    
    try {
      const selected = await invoke('open_file_picker');
      
      if (selected) {
        await sendToBackend(`select_icon:${selectedService}|${selected}`);
      }
    } catch (err) {
      console.error('File picker error:', err);
      errorMessage = 'File picker cancelled.';
    }
  }

  async function startBackend() {
    if (backendStarting) { 
      console.warn('Backend start already in progress');
      return;
    }
    
    backendStarting = true;
    backendStatus = 'starting';
    try {
      try {
          await invoke('cleanup_stale_backend');
      } catch (e) {
          console.warn('Cleanup failed (may be normal):', e);
      }
      
      await new Promise(r => setTimeout(r, 500));
      const res: string = await invoke('run_erlang_setup');
      backendStatus = 'ready';
      backendMessage = res;
    } catch (e) {
      backendStatus = 'error';
      backendMessage = (e as Error).message;
    } finally {
        backendStarting = false; 
    }
  }

  async function requestEntryList() {
    await sendToBackend('list');
    }

  async function selectService(service: string) {
    selectedService = service;
    selectedUsername = '';
    selectedWebsite = '';
    selectedNote = '';
    selectedIconPath = '';
    selectedSecretRaw = '';
    selectedSecretDisplay = ''; 
    await sendToBackend(`get_secret:${service}`);
  }

  async function attemptRecovery() {

    if (!recoveryCode) {
        errorMessage = 'Recovery code is required';
        return;
    }

    setMessage('Verifying recovery code...'), false, false;
    errorMessage = '';
    
    try {
        await invoke('dispatch_to_erlang', { 
            message: `recover:${recoveryCode}` 
        });
        // Don't transition yet - wait for backend response
    } catch (err) {
        errorMessage = 'Recovery failed: ' + err;
        console.error(err);
    }
  }
  
  async function applyRecoveryPassword() {
    if (authMode !== 'recovery_password' || newPassword === '' || confirmPassword === '') return;
    if (newPassword !== confirmPassword) {
        errorMessage = "Passwords do not match";
        return;
    }
    if (recoveryInProgress) return;
    recoveryInProgress = true;
    try {
        await sendToBackend(`set_recovery_password:${newPassword}`);
    } catch (err) {
        console.error(err);
        errorMessage = "Failed to set password";
    } finally {
        recoveryInProgress = false;
    }
  }

  // 3. The Forced Action
  async function applyRecoveryPasswordForced() {
      if (!newPasswordDisplay) return;
      errorMessage = '';
      infoMessage = '⚠️ Applying weak password...';
      try {
          await invoke('dispatch_to_erlang', {message: "change_master_password_complete_forced:${password}" })
      } catch (err) {
          errorMessage = 'Force set failed: ' + err;
      }
  }

  async function cancelRecovery() {
    // 1. Tell backend to start session with the recovered key (Volatile Mode)
    await sendToBackend('skip_password_change');
    
    // 2. Force UI transition immediately
    setAuthenticated();
    infoMessage = '⚠️ Vault Unlocked. Please set a new password to persist.';
    clearMessages(); 
  }

  async function startBackup() {
    try {
      isBackingUp = true;
      infoMessage = 'Backing up...';
      errorMessage = '';

      await sendToBackend('backup');
      setMessage('✅ Backup secured (Local & Cloud triggered).', false, false);
    } catch (err) {
      console.error('Backup failed:', err);
      errorMessage = err?.message || 'Backup failed — check logs';
      infoMessage = '';

      if (err?.message?.includes('session_expired')) {
        errorMessage = 'Session expired — please log in again';
      } else if (err?.message?.includes('timeout')) {
        errorMessage = 'Backup timed out — try again';
      }

    } finally {
      isBackingUp = false;
    }
  }

  //————————————————————————————————— ADD ENTRY ————————————————————————————————————————//

  function openAddEntry() {
    editMode = false;
    editingServiceName = '';
    originalService = '';
    
    // Clear all form fields for a fresh entry
    newServiceName = '';
    newPassword = '';
    newPasswordDisplay = '';
    newUsername = '';
    newWebsite = '';
    newNote = '';

    showAddEntryPanel = true;
    showServiceOverlay = false;
  }

  async function submitNewEntry() {
    const targetService = newServiceName.trim();
    if (!targetService) {
      if (typeof setMessage === 'function') setMessage('Service name is required.', true);
      return;
    }

    const fields = [
      targetService,
      newUsername.trim(),
      newPassword,
      newWebsite.trim(),
      newNote.trim().replace(/\n/g, '\\n'),
      '' 
    ];

    const command = editMode 
      ? `edit_entry:${originalService}|${fields.join('|')}`
      : `add_entry:${fields.join('|')}`;
    
    try {
      await sendToBackend(command);
      
      const wasEdit = editMode;
      showAddEntryPanel = false;
      selectedService = null;
      
      newServiceName = '';
      newUsername = '';
      newPassword = ''; 
      newPasswordDisplay = '';
      newWebsite = '';
      newNote = '';
      editMode = false;

      if (typeof setMessage === 'function') {
        setMessage(wasEdit ? '✅ Entry updated.' : '✅ Entry added.', false, false);
      }

    await tick();

    const maxWait = 1500;
    const interval = 50;
    let elapsed = 0;

    const scrollToEntry = () => {
      const entries = Array.from(document.querySelectorAll('.service'));
      const element = entries.find(el => el.textContent?.trim() === targetService);

      if (element) {
        const listTop = serviceListEl.getBoundingClientRect().top;
        const elTop = element.getBoundingClientRect().top;
        const offset = elTop - listTop - 5;//granular service flash position adjustment
        serviceListEl.scrollTop += offset;
        element.classList.add('flash-highlight');
        setTimeout(() => element.classList.remove('flash-highlight'), 3000);
        return;
      }

      elapsed += interval;
      if (elapsed < maxWait) setTimeout(scrollToEntry, interval);
    };

    setTimeout(scrollToEntry, interval);

    } catch (err) { 
      if (typeof setMessage === 'function') {
        setMessage(`Error: ${err}`, true);
      }
    }
  }


  // ⌨️ Sequential focus handler for Add Entry form
  function handleAddEntryKeydown(e: KeyboardEvent, currentField: string) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const sequence = ['service', 'username', 'password', 'website', 'note'];
    const currentIndex = sequence.indexOf(currentField);

    if (currentIndex < sequence.length - 1) {
      // Move to next field
      const nextId = `add-entry-${sequence[currentIndex + 1]}-input`;
      const nextEl = document.getElementById(nextId) as HTMLInputElement;
      if (nextEl) nextEl.focus();
    } else {
      // Last field (Notes) reached, activate the ✅ button logic
      submitNewEntry();
    }
  }


//================================ PASSWORD ENTRY ===================================//
 
  function handlePasswordPaste(event, fieldType) {
    event.preventDefault();
    
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const pastedData = clipboardData.getData('Text');

    if (!pastedData) return;

    // Update the appropriate field
    switch(fieldType) {
    case 'master':
      password += pastedData;
      displayPassword = dot.repeat(password.length - 1) + pastedData.slice(-1);
      startMasking();
      break;
    case 'new':
      newPassword += pastedData;
      newPasswordDisplay = dot.repeat(newPassword.length - 1) + pastedData.slice(-1);
      startNewPasswordMasking();
      break;
    case 'confirm':
      confirmPassword += pastedData;
      confirmPasswordDisplay = dot.repeat(confirmPassword.length - 1) + pastedData.slice(-1);
      startConfirmPasswordMasking();
      break;
    case 'addEntry':
      newPassword += pastedData;
      newPasswordDisplay = dot.repeat(newPassword.length - 1) + pastedData.slice(-1);
      startNewPasswordMasking();
      sendToBackend('validate_password:false|' + newPassword);
      break;
    }

    // Force DOM update
    setTimeout(() => {
      const inputId = fieldType === 'master' ? 'master-password-input' : 
                     fieldType === 'new' ? 'new-password-input' :
                     fieldType === 'confirm' ? 'confirm-password-input' :
                     'add-entry-password-input';
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
          input.value = fieldType === 'master' ? displayPassword :
                       fieldType === 'new' ? newPasswordDisplay :
                       fieldType === 'confirm' ? confirmPasswordDisplay :
                       newPasswordDisplay;
      }
    }, 0);
  }

  function startNewPasswordMasking() {
    if (newPasswordMaskInterval) clearTimeout(newPasswordMaskInterval);
    
      newPasswordMaskInterval = window.setTimeout(() => {
        if (newPassword.length > 0) {
            newPasswordDisplay = dot.repeat(newPassword.length);
        }
        newPasswordMaskInterval = undefined;
      }, MASK_DELAY_MS);
  }

  function startConfirmPasswordMasking() {
    if (confirmPasswordMaskInterval) clearTimeout(confirmPasswordMaskInterval);  
      confirmPasswordMaskInterval = window.setTimeout(() => {
        if (confirmPassword.length > 0) {
          confirmPasswordDisplay = dot.repeat(confirmPassword.length);
        }
        confirmPasswordMaskInterval = undefined;
      }, MASK_DELAY_MS);
  }

  function handleNewPasswordInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;
    errorMessage = '';

    if (newValue.length > newPassword.length) {
      const addedChars = newValue.slice(newPassword.length);
      newPassword += addedChars;
      newPasswordDisplay = dot.repeat(newPassword.length - addedChars.length) + addedChars;
      startNewPasswordMasking();
    } else if (newValue.length < newPassword.length) {
      newPassword = newPassword.slice(0, newValue.length);
      newPasswordDisplay = dot.repeat(newPassword.length);
      
      if (newPasswordMaskInterval) {
          clearTimeout(newPasswordMaskInterval);
          newPasswordMaskInterval = undefined;
      }
    }
    inputElement.value = newPasswordDisplay;
    
    if (newPassword.length === 0) {
        strengthScore = 0;
        isPasswordWeak = false;
    } else {
      sendToBackend('validate_password:false|' + newPassword);
    }
  }

  function handleConfirmPasswordInput(event: Event) {//CONSOLIDATE WITH ABOVE 
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;

    if (newValue.length > confirmPassword.length) {
        const addedChars = newValue.slice(confirmPassword.length);
        confirmPassword += addedChars;
        confirmPasswordDisplay = dot.repeat(confirmPassword.length - addedChars.length) + addedChars;
        startConfirmPasswordMasking();
    } else if (newValue.length < confirmPassword.length) {
        confirmPassword = confirmPassword.slice(0, newValue.length);
        confirmPasswordDisplay = dot.repeat(confirmPassword.length);
        
        if (confirmPasswordMaskInterval) {
            clearTimeout(confirmPasswordMaskInterval);
            confirmPasswordMaskInterval = undefined;
        }
    }

    inputElement.value = confirmPasswordDisplay;
  }


//————————————————————————————————— EDIT ENTRY ————————————————————————————————————————//

  function editService() {
    if (!selectedService) {
      errorMessage = "No service selected.";
      return;
    }
    // Populate the form with current values
    editMode = true;
    editingServiceName = selectedService;
    originalService = selectedService;

    newServiceName = selectedService;
    newPassword = selectedSecretRaw || '';
    newPasswordDisplay = selectedSecretDisplay || '';
    newUsername = selectedUsername || '';
    newWebsite = selectedWebsite || '';
    newNote = selectedNote || '';

    // Close detail panel and open edit panel
    showAddEntryPanel = true;
    showServiceOverlay = false;
    openActionMenu = null; // 🛡️ Changed from false to null to match type
    displayPanel = false; // 🛡️ Ensure the main display panel is closed when editing
  }

  //————————————————————————————————— DELETE ENTRY ————————————————————————————————————————//

  function deleteService() {
    if (!selectedService) return;
    showDeletePanel = true;
  }

  async function confirmDelete() {
    if (!selectedService) return;

    const serviceToDelete = selectedService;
    // Show feedback immediately (before network roundtrip)
    infoMessage = `❌ Deleting ${serviceToDelete}...`;
    errorMessage = '';

    try {
      await sendToBackend(`delete_entry:${serviceToDelete}`);

      showDeletePanel = false;

    } catch (err) {
      console.error('[GUI] Delete network error:', err);
      errorMessage = 'Failed to delete entry (network issue) ❌';
      infoMessage = '';
    }
  }

  export async function triggerLock(): Promise<void> {
    try {
      const btn = document.querySelector<HTMLElement>('[data-lock-button]');
      if (btn) {
        btn.click();
        return;
      }
      await invoke('dispatch_to_erlang', { cmd: 'lock' });
    } catch (err) {
      // Always log so we can debug if needed
      console.error('triggerLock failed:', err);
    }
  }

  function sendKeepAlive(event: MouseEvent) {
    if (!isSessionActive || authMode === 'recovery_password') {
      return;  // Don't send during recovery password phase
    }
    const canSendKeepAlive = authMode === 'authenticated' || 
                             authMode === 'changing_verify' || 
                             authMode === 'changing_new';
      
      if (!canSendKeepAlive) return;
      if (keepAliveThrottle) return;

      keepAliveThrottle = window.setTimeout(() => keepAliveThrottle = undefined, 1000);

      const { clientX, clientY } = event;
      sendToBackend(`keep_alive:${clientX}:${clientY}`);
  }

//============================== HANDLE/GUI/RESPONSE =========================================================


//================================ HANDLE GUI ERROR ================================

  function handleGuiError(payload: string) {
    clearAuthTimeout();
    errorMessage = payload;
    // Only force a locked state for explicit auth failure or lock messages.
    const lower = payload.toLowerCase();
    const isAuthFailure = lower.includes('authentication failed') || 
                          lower.includes('change_password_old_wrong') || 
                          lower.includes('locked') || 
                          lower.includes('locked_out') || 
                          lower.includes('hard-locked');

    if (error === 'session_expired' && infoMessage === '⚠️ Applying weak password...') {
      return;
    }

    errorMessage = error;

    if (isAuthFailure) {
      authMode = 'locked';
      password = '';
      newPassword = '';
      confirmPassword = '';
      hotZone = false;
      infoMessage = 'Locked.';
    }
  }

//========================================== ONMOUNT =================================

onMount(async () => {

  // Listen for reset_to_list_view (panel reset on lock)
  unlistenReset = await listen('reset_to_list_view', () => {
    
    // Close Add/Edit Entry panel
    showAddEntryPanel = false;
    editMode = false;
    editingServiceName = '';
    originalService = '';
    
    // Return to service list
    selectedService = null;
    selectedSecret = null;
    selectedUsername = '';
    selectedWebsite = '';
    selectedNote = '';
    selectedIconPath = '';
    latestIconPath = '';
    
    // Clear any form data
    newServiceName = '';
    newUsername = '';
    newPassword = '';
    newPasswordDisplay = '';
    newWebsite = '';
    newNote = '';
  });

  unlistenRecoveryValid = await listen('recovery_key_valid', (event) => {
    recoveryModalMessage = event.payload ?? "Recovery key accepted. Please generate + copy a new recovery code then set a new password.";
    showRecoveryWarning = true;
    // Do NOT set authMode or show password form yet
  });

  const unlisten = await listen('vault_locked', ({ payload }) => {
    closeAllPanelsAndModals();
    clearAuthTimeout();
    authMode = 'locked';
    // Clearing services here causes a race condition during login/rebuild. 
    // The UI visibility should be handled by authMode instead.
    password = '';
    
    let reason = (payload && typeof payload === 'string' && payload.includes(':')) 
        ? payload.split(':')[1] 
        : (payload || 'Vault Locked.');
        
    setMessage(reason, true);
  });

unlistenError = await listen('gui_error', (event) => {
  const payload = event.payload ?? '';
  const isCritical = payload.includes('🚨'); 

  // 🛑 HANDLE WEAK PASSWORD ERROR SPECIFICALLY
  if (payload.startsWith('password_weak')) {
    const reason = payload.split(':').slice(1).join(':') || "Password does not meet complexity requirements.";
    
    errorMessage = `Weak Password: ${reason}`;
    
    strengthScore = 1.0;

    let stdBtn, frcBtn;

    if (authMode === 'recovery_password') {
      stdBtn = document.getElementById('set-password-btn');
      frcBtn = document.getElementById('force-set-password-btn');
    } else if (authMode === 'changing_new') {
      stdBtn = document.getElementById('change-password-btn');
      frcBtn = document.getElementById('force-change-password-btn');
    }
    
    if (stdBtn) {
      stdBtn.style.display = 'none';
    }
    if (frcBtn) {
      frcBtn.style.display = 'block';
    }
    return;
  }

  if (payload === 'session_expired' && (authMode === 'locked' || authMode === 'login')) {
    return;
  }

  let finalMsg;

  if (payload === 'delete_failed') {
     finalMsg = 'Could not delete entry – not found or session issue';
  } else if (payload === 'entry_not_found') {
    finalMsg = 'Entry not found';
  } else if (payload === 'session_expired') {
    finalMsg = 'Session expired – please unlock again';
  } else {
    finalMsg = `Backend error: ${payload}`;
  }

  setMessage(finalMsg, false, true); 
});

  unlistenHotZone = await listen('hot-zone', (event: any) => {
      hotZone = event.payload.inside;
  });

  try {
    await invoke('run_erlang_setup');
    backendStatus = 'running';
  } catch (e) {
    console.error("Backend failed to start:", e);
    errorMessage = "Failed to initialize Vault engine.";
  }

  return () => {
    unlisten();
    unlistenLock();
    unlistenResponse();
    unlistenError();
    if (unlistenRecoveryValid) unlistenRecoveryValid();
  };

});


onDestroy(() => {
  unlistenResponse?.();
  unlistenError?.();
  if (unlistenReset) unlistenReset();
  if (placeholderInterval) clearInterval(placeholderInterval);
})

</script>


<!--========================== HTML HTML HTML HTML HTML HTML HTML HTML HTML HTML ============================-->

<!-- ==================== DESTRUCTURING ========================= -->

<svelte:window on:keydown={handleGlobalKeyDown} />

<div use:setupMainListener={{ 
  clearAuthTimeout, 
  setMessage, 
  toggleForceUI, 
  sendToBackend,
  resetPasswordStates,
  loadFavorites,
  invoke,
  syncState,
  parseAttackBatch,

  authMode,
  authStep,
  entries,
  services,
  password,
  displayPassword,

  confirmPassword,
  totpCode,
  masterPassword,
  recoveryCode,
  selectedService,
  selectedSecret,
  selectedUsername,
  selectedWebsite,
  selectedNote,
  selectedIconPath,
  infoMessage,
  errorMessage,
  hotZone,
  strengthScore,
  validationError,
  feedbackMessage,
  showLoginAttemptPanel,
  showSecurityModal,
  attemptDetails,
  totpStatus,
  totpSecret,
  totpQrUri,
  backupCodes,
  favorites,
  isGeneratingBackup,
  backupCode,
  generatedCode,
  showRecoveryWarning,
  recoveryCodeGenerated,
  securityReport,
  currentTimeout,
  timeoutMinutes,
  searchTerm
}}></div>


<div class="container"
  tabindex="-1"
  role="button"
  aria-label="Keep session alive"
  on:mousemove={sendKeepAlive}
  style={isPreAuth && lockBg ? `background-image: url('${lockBg}')` : ''}
  class:list-view={authMode === 'authenticated' && selectedService === null}
  class:locked-screen={isPreAuth}>

  <!--style={lockBg ? `background-image: url('${lockBg}')` : ''}-->
  <div class={isHeaderList ? "header-list" : "header-item"}></div>

  <!--================ HEADER WRAPPER ===================-->

  <div class="header-wrapper-parent" class:changeNew={changingNew} class:changeVerify={changingVerify}>
    <div class="header-wrapper" class:minimized={headerMinimized} class:adjusted={headerAdjusted} class:list-adjusted={headerListAdjusted} class:locked-screen={authMode === 'locked' || authMode === 'password' || authMode === 'recovery'}  class:totp-challenge={authMode === 'totp_challenge'}>
      {#if authMode === 'locked' || selectedService !== null || selectedService == null}
        <h1 class="main-header">LockStep<span></span></h1>
        <h3>{selectedService === null && authMode === 'authenticated' ? 'Industrial-Grade Security' : 'Hyper-Robust Industrial-Grade Security'}</h3>
      {/if}
    </div>
  </div>

  <!---------------- END HEADER WRAPPER -------------------->


  <div class="card" class:authenticated={authMode === 'authenticated'}
    class:selected={selectedService !== null}>

    {#if authMode === 'locked' || authMode === 'password'}
    <!--{#if authStep !== 'password'}
    {:else}-->
      <!-- Normal locked password -->
      <div class="pre-auth-input"><!--trans panel-->
        <div class="master-input-container">
          <div class="input-group" class:has-value={displayPassword !== ''}>
            <div class="placeholder">
              <div class="placeholder-slide-wrapper">
                <span>AES-256-CTR Encryption</span>
                <span>1,000,000 Iteration PBKDF2</span>
                <span>2-Factor TOTP Authentication</span>
                <span>Quantum-resistant HMAC/SHA512</span>
                <span>Progressive Lockout Protocol</span>
                <span>128-bit Secure Random Salt</span>
                <span>AES-256-CTR Encryption</span>
              </div>
            </div>

            {#if peekPassword}
              <!-- 👁 Revealed input -->
              <input
                type="text"
                class="input"
                bind:this={peekInputEl}
                bind:value={password}
                on:input={() => { displayPassword = dot.repeat(password.length); }}
                on:mouseup={() => { peekPassword = false; startMasking(); maskedInputEl?.focus(); }} 
                on:mouseleave={() => { peekPassword = false; startMasking(); maskedInputEl?.focus(); }}
                spellcheck="false"
                autocomplete="off"
              />
            {:else}
              <!-- 🔒 Masked input -->
              <input
                type="text"
                id="master-password-input"
                class="input"
                bind:this={maskedInputEl}
                bind:value={displayPassword}
                on:mousedown={() => { if (displayPassword !== '') peekPassword = true;}}
                on:input={handleMasterPasswordInput}
                on:focus={() => isFocused = true}
                on:blur={() => { isFocused = false; startMasking(); }}
                on:keydown={(e) => { if (e.key === 'Enter') { flashBtn('verify'); verifyPassword(); } }}
                placeholder=""
                spellcheck="false"
                autocomplete="off"
              />
            {/if}

          </div>
        </div>
        <!-- Buttons -->
        <div class="row non-list main-login">
        <button class="btn" class:key-flash={flashingBtn === 'verify'} on:click={verifyPassword}>Verify</button>
          <button class="btn" on:click={handleForgotPassword}>Forgot?</button>
        </div>
      </div><!--trans panel-->
    <!--{/if}-->
  {:else if authMode === 'recovery'}
    <div class="pre-auth-input"><!--trans panel-->
      <div class="master-input-container">
        <div class="input-group" class:has-value={usePasswordRecovery ? displayPassword !== '' : recoveryCode !== ''}>
          <div class="placeholder">
            <div class="placeholder-slide-wrapper">
              {#if usePasswordRecovery}
                <span class="red">Enter Master Password</span>
                <span class="red">Bypass Recovery Code</span>
                <span class="red">Emergency Access</span>
                <span class="red">Enter Master Password</span>
                <span class="red">Bypass Recovery Code</span>
                <span class="red">Emergency Access</span>
                <span class="red">Enter Master Password</span>
              {:else}
                <span class="red">Enter Recovery DNA</span>
                <span class="red">High-Entropy Key</span>
                <span class="red">Emergency Access</span>
                <span class="red">Enter key and set up password</span>
                <span class="red">Hex key required</span>
                <span class="red">Secure Encryption Key Required</span>
                <span class="red">Enter Recovery DNA</span>
              {/if}
            </div>
          </div>
          {#if usePasswordRecovery}
            <input
              type="text"
              id="master-password-input"
              bind:value={displayPassword}
              on:input={handleMasterPasswordInput}
              on:keydown={(e) => { if (e.key === 'Enter') { flashBtn(usePasswordRecovery ? 'rec-verify' : 'rebuild'); usePasswordRecovery ? recoverWithPassword() : attemptRecovery(); } }}
              on:focus={() => isFocused = true}
              on:blur={() => { isFocused = false; startMasking(); }}
              spellcheck="false"
              autocomplete="off"
            />
          {:else}
            <input
              type="text"
              id="master-password-input"
              bind:value={recoveryCode}
              on:keydown={(e) => { if (e.key === 'Enter') { flashBtn(usePasswordRecovery ? 'rec-verify' : 'rebuild'); usePasswordRecovery ? recoverWithPassword() : attemptRecovery(); } }}
              on:focus={() => isFocused = true}
              on:blur={() => { isFocused = false; }}
              class="input in-recovery"
              spellcheck="false"
              autocomplete="off"
            />
          {/if}
        </div>
      </div>
      <div class="row non-list main-login">
        {#if recoveryCodeJustGenerated}
          <button class="btn" on:click={() => { setAuthenticated(); recoveryCode = ''; recoveryCodeJustGenerated = false; closeMenu(); }}>
            Done
          </button>
        {:else if usePasswordRecovery}
          <button class="btn" class:key-flash={flashingBtn === 'rec-verify'} on:click={recoverWithPassword}>Verify</button>
          <button class="btn" on:click={() => { usePasswordRecovery = false; displayPassword = ''; }}>Back</button>
        {:else}
          <button class="btn btn-rec" class:key-flash={flashingBtn === 'rebuild'} on:click={attemptRecovery}>Rebuild</button>
          <button class="btn btn-rec" on:click={() => { authMode = 'locked'; recoveryCode = ''; usePasswordRecovery = false; clearMessages(); }}>Cancel</button>
        {/if}
      </div>
      {#if !recoveryCodeJustGenerated}
        <!--button class="btn-link" on:click={() => { usePasswordRecovery = !usePasswordRecovery; displayPassword = ''; recoveryCode = ''; }}>
          {usePasswordRecovery ? '← Use Recovery Code Instead' : 'Use Master Password Instead →'}
        </button-->
      {/if}
    </div><!--trans panel-->

  {:else if authMode === 'changing_verify'}
    <div class='auth-container changing_verify_bg'>
      <h2>Changing Master Password<br>(Step 1)</h2>
      <div class="form-field">
        <input
          type="text"
          id="old-password-input"
          bind:value={displayPassword}
          on:input={handleMasterPasswordInput}
          on:focus={() => isFocused = true}
          on:blur={() => { isFocused = false; startMasking(); }}
          on:keydown={(e) => e.key === 'Enter' && (flashBtn('change-verify'), submitVerifyForChange())}        
          placeholder="Confirm Current Password" 
          spellcheck="false"
          autocomplete="off"
        />
      </div>

      <div class="row non-list changing_verify">
        <button class="btn" class:key-flash={flashingBtn === 'change-verify'} on:click={submitVerifyForChange}>Verify</button>
        <button
          class="btn"
          on:click={() => {
            authMode = 'authenticated';
            infoMessage = '';
            resetPasswordStates();
          }}
        >
          Cancel
        </button>
      </div>
    </div><!--auth-container-->

  {:else if authMode === 'changing_new' || authMode === 'recovery_password'}
    <div class="auth-container changing_new" transition:scale={{ duration: 300 }}>
      <h2>{authMode === 'recovery_password' ? 'Set New Master Password' : 'Changing Master Password\n(Step 2)'}</h2>

      <div class="form-field">
        <input
          class="new_password"
          id="new-master-password"
          type="text"
          bind:value={newPasswordDisplay}
          on:input={handleNewPasswordInput}
          on:focus={() => isFocused = true}
          on:blur={() => { isFocused = false; startMasking(); }}
          on:keydown={onPasswordInput}
          placeholder="New Password" 
          autocomplete="new-password"
          spellcheck="false"
        />
      </div>

      <div class="form-field">
        <input
          class="confirm-new-password"
          id="confirm-master-password"
          type="text"
          bind:value={confirmPasswordDisplay}
          on:input={handleConfirmPasswordInput}
          on:keydown={onPasswordInput}
          on:keydown={(e) => { if (e.key === 'Enter') { flashBtn('confirm'); handleNormalPasswordSubmit(); feedbackMessage = "";} }}
          placeholder="Confirm New Password"
          autocomplete="new-password"
          spellcheck="false"
        />
      </div>

      {#if validationError}
        <p class="error">{validationError}</p>
      {/if}
      {#if passwordFeedback}
        <p class="feedback">{passwordFeedback}</p>
      {/if}
      {#if feedbackMessage}
        <p class="feedback">{feedbackMessage}</p>
      {/if}

      <div class="panel-buttons">
        <div class="changing-new">
          <button
            id={authMode === 'recovery_password' ? 'set-password-btn' : 'change-password-btn'}
            class={isPasswordWeak ? 'btn force danger' : 'btn'}
            class:key-flash={flashingBtn === 'confirm'}
            type="button"
            on:click={() => {
              if (isPasswordWeak) {
                showForcePassword = true;
              } else {
                authMode === 'recovery_password' ? applyRecoveryPassword() : handleNormalPasswordSubmit(); feedbackMessage = "";
              }
            }}>
            {isPasswordWeak ? 'Force Weak Password?' : authMode === 'recovery_password' ? 'Set Password' : 'Confirm'}
          </button>
          <button
            id={authMode === 'recovery_password' ? 'force-set-password-btn' : 'force-change-password-btn'}
            class="btn danger force"
            style="display: none;"
            type="button"
            on:click={handleForcePassword}>
            Force Weak Password?
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ============================ AUTHENTICATED ============================ -->

      {#if authMode === 'authenticated'}
        <div class="row button-wrapper {headerMinimized ? 'left' : ''}" class:minimized={headerMinimized} style="margin-top: 10px;">
          <button
            class="btn"
            on:click={() => {
              clearMessages();
              openMenu();
            }}
          >Menu</button>

          <button
            class="btn tertiary"
            on:click={() => {
              clearMessages();
              lockVault();
            }}
          >🔒 Lock</button>
          {#if selectedService !== null}
            <button 
              class="btn back back-button-visible" 
              on:click={async () => {
                const serviceToRestore = selectedService;
                clearMessages();
                navVisible = false;
                setTimeout(async () => {
                  selectedService = null;
                  selectedSecret = null;
                  await tick();

                  const maxWait = 1500;
                  const interval = 50;
                  let elapsed = 0;
                  const scrollToRestored = () => {
                    const entries = Array.from(document.querySelectorAll('.service'));
                    const element = entries.find(el => el.textContent?.trim() === serviceToRestore);
                    if (element) {
                      const listTop = serviceListEl.getBoundingClientRect().top;
                      const elTop = element.getBoundingClientRect().top;
                      const offset = elTop - listTop - 5;//granular service flash position adjustment
                      serviceListEl.scrollTop += offset;
                      element.classList.add('flash-highlight');
                      setTimeout(() => element.classList.remove('flash-highlight'), 3000);
                      return;
                    }
                    elapsed += interval;
                    if (elapsed < maxWait) setTimeout(scrollToRestored, interval);
                  };
                  setTimeout(scrollToRestored, interval);

                  setTimeout(() => navVisible = true, 500);
                }, 200);
              }}>← List
            </button>
          {/if}
          </div><!--row button-wrapper-->

      {#if navVisible}
        <div class="add-nav-parent" style="bottom: {selectedService !== null ? '115px' : '140px'}" transition:fly={{ x: -850, duration: 700, opacity: 1 }}>
            <button
            class="add-nav-kids"
            title="Add Entry"
            aria-label="Add Entry menu"
            on:click={() => {clearMessages(), openAddEntry()}}>+
          </button>
          <button
            class="add-nav-kids"
            title="Left navigation"
            on:click={() => {navigateService('prev'), clearMessages()}}
            aria-label="Go to left item">←
          </button>
          <button
            class="add-nav-kids"
            title="Right navigation"
            on:click={() => {navigateService('next'), clearMessages()}}
            aria-label="Go to right item">→
          </button>
          <button
            class="add-nav-kids"
            title="Backup"
            aria-label="Backup Database"
            disabled={isBackingUp}
            on:click={startBackup}
            class:error={!!errorMessage}
            class:success={typeof infoMessage === 'string' && infoMessage.includes('✅')}
          >
            {#if isBackingUp}
              ⏳
            {:else if errorMessage}
              ⚠️
            {:else}
              ☁️
            {/if}
          </button>
          <div class="search-bar">
            <input
              id="search-vault"
              type="text"
              bind:value={searchTerm}
              use:persistentFocus={modalOpen}
              on:input={() => { if (searchTerm.trim()) showSearchModal = true; }}
              on:keydown={handleSearchKeydown}
              placeholder="&nbsp;Enter search term"
              spellcheck="false"
            />
          </div>
        </div><!--add-nav-parent-->
      {/if}


  <!-- ========================== SERVICE LIST ================================ -->

        {#if selectedService === null}
          <div class="service-list-parent -webkit-scrollbar-thumb" bind:this={serviceListEl}>
            {#each sortedEntries as e}
              <div class="service-row">
                <button
                  class="service"
                  type="button" 
                  on:click={async () => {
                    selectedService = e;
                    selectedSecret = null;
                    await sendToBackend(`get_secret:${e}`);
                    clearMessages();
                  }}
                >
                  {e}
                </button>
                <button 
                  class="star-button" 
                  on:click={(event) => {
                    event.stopPropagation();
                    toggleFavorite(e);
                  }}
                  aria-label={favorites.has(e) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <span class="star" class:favorited={favorites.has(e)}>
                    {favorites.has(e) ? '★' : '☆'}
                  </span>
                </button>
              </div>
            {/each}
          </div>
          <div class="security-static">
            <h3>Security Status</h3>
            {#if securityReport}
              {@const deficits = [
                !securityReport.totp_enabled && { icon: '⚠️', label: '2FA Disabled' },
                securityReport.nif_status !== 'active' && { icon: '❌', label: 'Memory Protection Inactive' },
                securityReport.core_dumps !== 'disabled' && { icon: '⚠️', label: 'Core Dumps Enabled' },
                securityReport.permissions_status !== 'ok' && { icon: '⚠️', label: 'Permissions Issue' },
                securityReport.backup_msg === false && { icon: '🚨', label: 'Backups Stale or Missing' },

              ].filter(Boolean)}

              <div class="report-circle">
                <span class="score-label">Score</span>
                <span class="score-value" style="color: {securityReport.rating >= 10 ? '#24A326' : securityReport.rating >= 8 ? '#DB5714' : '#e53935'}">
                  {securityReport.rating.toFixed(1)}<span class="score-max">&nbsp;/&nbsp;10</span>
                </span>
              </div>

              {#if deficits.length === 0}
                <div class="report-box">
                  <p>✅ No security events to report.</p>
                </div>
              {:else}
                <div class="report-box deficits">
                  {#each deficits as d}
                    <p>{d.icon} {d.label}</p>
                  {/each}
                </div>
              {/if}
            {:else}
              <div class="report-box">
                <p style="color: #888; font-style: italic;">Loading...</p>
              </div>
            {/if}
          </div>

  <!---------------------- SERVICE ITEM DETAIL PANEL ------------------------>

        {:else}

          <div class="item-panel">
            <button class="service-header" on:click={() => handleCopy(selectedService)}
                title="Click to copy Service Name" aria-label="Service Item Name">
                <span
                  class="header-star clickable"
                  role="button"
                  tabindex="0"
                  aria-label={`Favorite ${isCurrentServiceFavorited ? ' (favorited)' : ''}`}
                  aria-pressed={isCurrentServiceFavorited}
                  title="Click to favorite/unfavorite"
                  style:color={isCurrentServiceFavorited ? 'orange' : '#888888'}
                  on:click={(e) =>{e.stopPropagation(); toggleFavorite(selectedService)}}
                  on:keydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation(); 
                      toggleFavorite(selectedService);
                    }
                  }}
                >
                  {isCurrentServiceFavorited ? '★' : '☆'}
                </span>
                {#key selectedIconPath}
                  {#if selectedIconPath}
                    <img
                      src={selectedIconPath}
                      class="service-icon"
                      on:error={(e) => e.target.style.display = 'none'}
                      alt=""
                    />
                  {/if}
                {/key}
              {selectedService}
            </button>
          </div>

          <div class="fields-container">
            <div class="login">
              <label for="username-input">Username/Login</label>
              <button
                class="clickable field-like"
                type="button"
                on:click={() => handleCopy(selectedUsername)}
                title="Click to copy username"
                disabled={!selectedUsername}
              >
                {selectedUsername ?? "Loading..."}
              </button>
            </div>

          <!-- Password / secret -->
          <div class="secret-block">
            <label for="password-input">Password</label>
            <button
              class="clickable field-like"
              on:click={() => handleCopy(selectedSecretRaw)}
              title="Click to copy {selectedSecretRaw}"
              >{selectedSecretDisplay ?? "Loading…"}
            </button>
          </div>

          <div class="service-specific-settings">
            <button 
            class="cog-trigger"
            on:click={() => openActionMenu = !openActionMenu}
            on:click={() => showServiceOverlay = !showServiceOverlay}
            aria-expanded={openActionMenu}
            >
              <img src={cogSrc} alt="Settings" class="cog-icon" />
            </button>
            <button class="clickable site-go-to" on:click={() => { 
                if (selectedWebsite) { 
                  sendToBackend(`open_url:${selectedWebsite}`);
                }
              }} 
              title="Click to open website"
            >🌐
            </button>
          </div>
          <!-- URL -->
          <div class="site"> 
            <label for="website-input">URL</label>
              <button class="clickable field-like" 
              on:click={() => handleCopy(selectedWebsite)}
              title="Click to copy{selectedWebsite}">
                {selectedWebsite || 'N/A'}
              </button>
          </div>

          <!-- Note -->
          {#if selectedNote}
            <div class="note-label-parent"><label for="note-visibility">⬇︎ Scroll for Note</label></div>
            <div class="note">
              <label for="note-input">Note</label>
                <button
                  class="clickable field-like-notes field-like"
                  on:click={() => handleCopy(selectedNote)}
                  title="Click to copy contents"
                  >{selectedNote || " "}
                </button>
            </div>
          {/if}

          {#if showNerdPanel}
            <div class="nerd-stats">
              <div class="stats-banner">
                <div class="label">Stats</div>
                <button class="menu-close"
                  aria-label="Close menu"
                  on:click={() => {
                  showNerdPanel = false;
                  localStorage.setItem('nerdPanelActive', 'false');
                  setMessage("🧠 Nerd Stats Inactive.", false, false)
                  }}
                >
                ✕
                </button>
              </div>
                <div class="heat-stack-container">
                  <div class="label">Password strength</div>

                  <div class="heat-stack">
                    {#each heatStack as color}
                      <div class="bar" style="background-color: {color};"></div>
                    {/each}
                  </div>

                  <div class="heat-label">{(selectedStrengthScore / 2).toFixed(1)} / 5</div>
                </div>
              </div>
          {/if}
        </div><!--fields-container CLOSE-->          
      {/if} 

      {#if showServiceOverlay}
        <div 
          class="service-item-overlay" transition:fade={{duration: 200}}
          on:click={() => {closeServiceOverlay(); openActionMenu = false}} 
          on:keydown={(e) => e.key === 'Escape' && closeServiceOverlay()}
          role="button"
          tabindex="0"
          aria-label="Close overlay"
          >
          <div class="detail-container slide-out-actions" transition:fly={{ x: -280, duration: 150, opacity: 1 }}>        
            <div class="action-menu-container">
              <div 
                class="slide-out-actions" 
                class:active={openActionMenu}
                aria-hidden={!openActionMenu}
              >
                <!-- Icon selector section -->
                <div class="service-buttons-parent" >
                  <button class="panel-close service-x" type="button" aria-label="Close service item button panel" on:click={() => openActionMenu = false}>✕</button>
                  <button class="btn btn-icon" on:click={autoFetchIcon}>🌐 Get Icon</button>
                  <button class="btn btn-icon" on:click={selectLocalIcon}>📁 Browse</button>
                  <button class="btn btn-icon danger" on:click={deleteService}>🗑️ Delete</button>
                  <button class="btn btn-icon" on:click={editService}>✏️ Edit</button>
                </div>
              </div>
            </div><!--action-menu-container-->
          </div><!--detail-container-->
        </div>
      {/if}
     
      {#if authMode === 'recovery'}

        <div class="panel" in:slideUp>
          <div class="pre-auth">
            <p>📦 EMERGENCY RECOVERY KIT 📦 </p>
            {#if recoveryCode && backendStatus === 'authenticated'}
              <p>Kit generated successfully. Store this offline immediately. If lost, your data is GONE.</p>
            {:else}
              <p>Enter your 64-character recovery code to restore vault access.</p>
            {/if}
          </div>

          {#if recoveryCode && backendStatus === 'authenticated'}
            <div class="kit-display" style="background: rgba(0,0,0,0.2); padding: 15px; border: 1px dashed #3B6166; border-radius: 4px; margin: 15px 0;">
              <code style="word-break: break-all; color: #00ff41; font-family: monospace; font-size: 1.1em;">{recoveryCode}</code>
            </div>
          {:else}
            <input class="input" type="text" bind:value={recoveryCode} placeholder="8a654a44..." use:focus />
          {/if}

          <div class="row" style="justify-content: center; gap: 10px; margin-top: 10px;">
            {#if backendStatus === 'authenticated'}
              <button class="btn" on:click={() => { setAuthenticated(); recoveryCode = ''; }}>Done</button>
            {:else}
              <button class="btn" on:click={attemptRecovery}>Restore</button>
              <button class="btn" on:click={() => { authMode = 'locked'; recoveryCode = ''; }}>Cancel</button>
            {/if}
          </div>
        </div>

      {/if}

  <!--——————————————————————————————————— MENUS —————————————————————————————————————————-->

      {#if menuOpen}

        <div
          class="menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-title"
          tabindex="-1"
          transition:fade={{ duration: 300 }}
          on:click|self={closeMenu}
          on:keydown={handleMenuKeydown}
        >
            <div
              class="menu-panel"
              transition:fly={{ x: -280, duration: 300, opacity: 1 }}
            >
              <button
                class="menu-close"
                aria-label="Close menu"
                on:click={closeMenu}
              >
                ✕
              </button>

              <!-- Optional visible title for screen readers -->
              <h2 id="menu-title" class="menu-title" style="background: none;">Main Menu</h2>

              <div class="menu-items" class:slide-left={activeSubMenu !== ''}>
                <button class="menu-item" on:click={(e) => { e.stopPropagation(); showAddEntryPanel = true; closeMenu(); openAddEntry(); }}>
                  ➕ Add Entry
                </button>
                <button class="menu-item" on:click={() => {
                  showNerdPanel = !showNerdPanel;
                  localStorage.setItem('nerdPanelActive', String(showNerdPanel));
                  setMessage(showNerdPanel ? "🧠 Nerd Stats Active." : "🧠 Nerd Stats Inactive.", false, false)
                }}>
                🧠 Nerd Stats<span class="nerd-tick sub-menu-indicators">{showNerdPanel === true ? '✅' : ''}</span>
                </button>
                <button
                  class="menu-item" on:click={() => toggleSubMenu('settings')}>
                  <span>⚙️</span> Settings<span class="sub-menu-indicators" style="color: {activeSubMenu === 'settings' ? '#ff4b4b' : '#FFA54B'};">{activeSubMenu === 'settings' ? '-' : '+'}</span>
                </button>
                <button class="menu-item" on:click={() => toggleSubMenu('security')}>
                  👮🏻‍♂️ Security <span class="sub-menu-indicators" style="color: {activeSubMenu === 'security' ? '#ff4b4b' : '#FFA54B'};">{activeSubMenu === 'security' ? '-' : '+'}</span>
                </button>
                <button class="menu-item" on:click={() => { closeMenu(); lockVault(); }}>
                  🔒 Lock Vault
                </button>
              </div>
            </div><!--menu-panel-->

            {#if activeSubMenu === 'security'}
              <div class="sub-menu-panel"
                role="menu"
                tabindex = "0"                    
                aria-label="Security actions"
                on:click|stopPropagation
                on:keydown|capture={handleMenuKeydown}
                transition:fly={{x: -50, duration: 100 }}>

                <div class="sub-menu-panel-child">
                  <h2 class="menu-title">Security</h2>
                  <div class="menu-items">

                    <button
                      class="menu-item"
                      role="menuitem"
                      on:click={() => {
                        triggerSecurityAction('totp_settings');
                        closeMenu();
                      }}
                    >
                      📱 2FA Settings
                    </button>

                    <button
                      class="menu-item"
                      role="menuitem"
                      on:click={() => {
                        triggerSecurityAction('security_report');
                        closeMenu();
                      }}
                    >
                      🔎 Security Report
                    </button>

                    <button
                      class="menu-item"
                      role="menuitem"
                      on:click={() => {
                        closeMenu();
                        startChange();
                      }}
                    >
                      🦾 Change Password
                    </button>
                    <button
                      class="menu-item"
                      role="menuitem"
                      on:click={() => {
                        triggerSecurityAction('in_secure');
                        closeMenu();
                      }}
                    >
                      🫙 Silo Mode
                    </button>
                  </div>
                </div>
              </div>
            {/if}

            {#if menuOpen && activeSubMenu === 'import/export'}
              <div class="sub-menu-panel" transition:fly={{ x: -50, duration: 100 }}>
                <div class="sub-menu-panel-child">
                  <h2 class="menu-title">Import/Export</h2>
                  <div class="menu-items">
                    <button
                      class="menu-item"
                      on:click={() => {openImportPicker()}}
                    >
                      ⤵️ Import
                    </button>                    
                    <button
                      class="menu-item"
                    >
                      ⤴️ Export
                    </button>
                    <button
                      class="menu-item"
                      on:click={() => {startBatchUpdate()
                      }}
                    >
                      🪣 Batch Update Icons
                    </button>
                  </div>
                </div>
              </div>
            {/if}

            {#if menuOpen && activeSubMenu === 'appearance'}
              <div class="sub-menu-panel" transition:fly={{ x: -50, duration: 100 }}>
                <div class="sub-menu-panel-child">
                  <h2 class="menu-title">Appearance</h2>
                  <div class="menu-items">
                    <button
                      class="menu-item"
                      on:click={() => { showThemePicker = true; closeMenu(); }}
                    >
                      🎨 Themes
                    </button>
                    <button
                      class="menu-item"
                      on:click={() => { showLockBgPicker = true; closeMenu(); }}
                    >
                      🏞️ Lock Screen Background
                    </button>
                  </div>
                </div>
              </div>
            {/if}

            {#if menuOpen && activeSubMenu === 'settings'}
              <div class="sub-menu-panel" transition:fly={{ x: -50, duration: 100 }}>
                <div class="sub-menu-panel-child">
                  <h2 class="menu-title">Settings</h2>
                  <div class="menu-items">
                    <button
                      class="menu-item"
                      on:click={openTimeoutSettings}
                    >
                      ⏱️ Timeout
                    </button>
                    <button
                      class="menu-item"
                      role="menuitem"               
                      on:click={async () => {
                        isGeneratingBackup = true;
                        backupCode = '';
                        displayPanelTitle = 'High Entropy Recovery Code';
                        displayPanel = true;
                        try {
                          await invoke('dispatch_to_erlang', {
                            message: 'security:generate_backup_code'
                          });
                        } catch (err) {
                          errorMessage = 'Failed to request recovery code';
                          isGeneratingBackup = false;
                        }
                        closeMenu();
                      }}
                    >
                      🔑 Recovery Code
                    </button>
                    <button
                      class="menu-item"
                      on:click={() => toggleSubMenu('appearance')}
                    >
                      🎨 Appearance <span class="sub-menu-indicators" style="color: {activeSubMenu === 'appearance' ? '#ff4b4b' : '#FFA54B'};">{activeSubMenu === 'appearance' ? '-' : '+'}</span>
                    </button>                 
                    <button
                      class="menu-item"
                      on:click={async () => {
                        closeMenu(); 
                        await invoke('dispatch_to_erlang',{ message: 'get_backup_config'}); 
                        showBackupModal = true;
                      }}
                    >
                      ☁️ Backup Settings
                    </button>
   
                    <button
                      class="menu-item"
                      on:click={() => toggleSubMenu('import/export')}
                    >
                      ↔️ Import/Export <span class="sub-menu-indicators" style="color: {activeSubMenu === 'appearance' ? '#ff4b4b' : '#FFA54B'};">{activeSubMenu === 'appearance' ? '-' : '+'}</span>
                    </button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
      {/if}<!--menuOpen-->
    {/if}

  </div><!--Card-->
</div><!--Container-->

<!-- ================= PERSISTENT INFO + Z-INDEXED MODALS HIGHER THAN CONTAINER DIV ================= -->

<div class="message-container" class:totp-open={showTotpModal}>
  {#key errorMessage || infoMessage}
    {#if errorMessage}
      <!-- out/in transitions now overlap cleanly -->
      <div class="error" transition:fade={{ duration: 300 }}>{errorMessage}</div>
    {:else if infoMessage}
      <div class="info-alert" transition:fade={{ duration: 300 }}><div>{infoMessage}</div></div>
    {/if}
  {/key}
</div>

{#if displayPanel}<!--backup code-->
  <div class="display-panel-order">
    <div class="display-panel entropy">
      <button
        class="panel-close"
        type="button"
        aria-label="Close panel"
        on:click={() => displayPanel = false}
      >✕</button>
      <h2 class="header-title">{displayPanelTitle}</h2>
      <div class="panel-content">{displayPanelContent}
        <div style="text-align: center; padding: 20px 0; color: lemonchiffon;">
          {#if isGeneratingBackup}
              Generating recovery code...
          {:else if backupCode}
            <div style="
              font-family: monospace;
              word-break: break-all;
              background: #111;
              padding: 16px;
              border-radius: 6px;
              color: #eee;
              user-select: text;
              margin: 16px 0;
              font-size: 15px;
              line-height: 1.4;
            ">
              {backupCode}
            </div>
          {:else}
            <div style="text-align: center; padding: 20px 0; color: #888;">
              No code generated yet
            </div>
          {/if}
        </div>

        <div class="panel-buttons">
          <button
            class="btn"
            type="button"
            disabled={isGeneratingBackup || !backupCode}
            on:click={async () => {
              handleCopy(backupCode);
              // Notify backend to actually perform the backup now 📥 
              await invoke('dispatch_to_erlang', { message: 'security:confirm_backup_save' });
              // Modal dismissal handled by IPC response or locally:
              displayPanel = false;
              backupCode = '';
            }}
          >
            Copy
          </button>

          <button
            class="btn"
            type="button"
            on:click={() => {
              displayPanel = false;
              backupCode = '';  
              isGeneratingBackup = false;
            }}
          >
          Close
          </button>
        </div>
      </div>
    </div><!--display-panel entropy-->
  </div><!--display-panel-order-->
    <div class="overlay"
      role="button"
      tabindex="0"
      on:click={() => displayPanel = false}
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          displayPanel = false;
        }
      }}
      aria-label="Close panel (click outside)"
    >
    </div>
{/if}

{#if showDeletePanel}
  <div class="display-panel-order delete">
    <div class="display-panel" style="border-color: #666;">
      <button
        class="panel-close delete-x"
        type="button"
        aria-label="Close panel"
        on:click={() => showDeletePanel = false}
      >✕</button>
      
      <h2 class="header-title" style="color: indianred">⚠️ Delete Confirmation ⚠️</h2>
      
      <div class="delete-check" style="padding: 20px; text-align: center; color: #666;">
        <p>Are you sure you want to permanently delete the <span class="deleting_service"><strong>{selectedService}</strong></span> vault item?</p>
        <p style="font-size: 0.9em;"><u>This action cannot be undone.</u></p>
      </div>

      <div class="panel-buttons">
        <button
          class="btn"
          type="button"
          on:click={confirmDelete}
        >
          ✅
        </button>
        <button
          class="btn"
          type="button"
          on:click={() => showDeletePanel = false}
        >
          ❌
        </button>
      </div>
    </div>
  </div>

  <div class="overlay"
    role="button"
    tabindex="0"
    on:click={() => showDeletePanel = false}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showDeletePanel = false;
      }
    }}
    aria-label="Close delete overlay"
    >
  </div>
{/if} <!--showDeletePanel-->

{#if showLoginAttemptPanel && attemptDetails.length > 0}
  <div class="display-panel-order" style="top: -525px;">
    <div class="display-panel">
      <h2>⚠️ Security Alert ⚠️</h2>
      
      <div>
        <p style="font-size: 1.1em; margin-bottom: 15px;">
          <strong style="color: var(--text-primary);">Unauthorized login attempt(s) detected</strong>
        </p>
        <div class="attempt-list">
          {#each deduplicatedAttempts as attempt, i}
            <div class="attempt-row">
              <p><strong>Time:</strong> {attempt.time}</p>
              <p><strong>IP Address:</strong> {attempt.ipAddress}</p>
              <p><strong>Origin:</strong> {attempt.location}</p>
              <p><strong>Device:</strong> {attempt.device}</p>
            </div>
          {/each}
        </div>
        <p style="font-size: 0.95em; color: var(--text-primary);"> 
          Please acknowledge your receipt of this notification by clicking below.
        </p>
      </div>
      
      <div class="panel-buttons">
        <button
          class="btn"
          type="button"
          on:click={acknowledgeLoginAttempt}
        >
          ✅
        </button>
      </div>
    </div>
  </div>
  <div 
    class="overlay overlay-non-clickable"
    aria-label="Security alert overlay"
  >
  </div>
{/if}<!--showLoginAttemptPanel-->

{#if showSecurityModal}
  <div class="display-panel-order">
    <div class="display-panel modal">
      
      <button class="panel-close" type="button" aria-label="Close panel" on:click={() => showSecurityModal = false}>x</button>

      <div class="modal-header">
        <h2 class="header-title" style="margin-top: 40px;">Security Audit Report</h2>
      </div>
      
      <div class="modal-content">
        <div class="rating-circle" style="border-color: {ratingColor(securityReport.rating)};">
              <span class="score" style="color: {ratingColor(securityReport.rating)};">{securityReport.rating.toFixed(1)}</span>

          <span class="label">Vault Rating<br>Maximum 10.0</span>
        </div>

        <ul class="status-list">
          <li>
            <span>{securityReport.nif_status === 'active' ? '✅' : '❌'} Memory Protection</span>
            <span class="status-tag">{capitalize(securityReport.nif_status)}</span>
          </li>
          <li>
            <span>{securityReport.totp_enabled ? '✅' : '⚠️ '} Two-Factor Auth</span>
            <span class="status-tag">{securityReport.totp_enabled ? 'Enabled' : 'Disabled'}</span>
          </li>
          <li>
            <span>{securityReport.core_dumps === 'disabled' ? '✅' : '⚠️'} Core Dumps</span>
            <span class="status-tag">{capitalize(securityReport.core_dumps)}</span>
          </li>
          <li>
            <span>{securityReport.backup_msg === true ? '✅' : '⚠️'} Backups</span>
            <span class="status-tag">{securityReport.backup_msg === true ? 'Fresh' : 'Stale'}</span>
          </li>
          <li>
            <span>{securityReport.permissions_status === 'ok' ? '✅' : '⚠️'} Permissions</span>
            <span class="status-tag">{capitalize(securityReport.permissions_status)}</span>
          </li>
          <li>
            <span>{securityReport.defcon_level === 1 ? '🎯' : '🟢'} Threat Level (Unrated)</span>
            <span class="status-tag">DEFCON {securityReport.defcon_level}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div class="overlay"
    role="button"
    tabindex="0"
    on:click={() => showSecurityModal = false}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showSecurityModal = false;
      }
    }}
    aria-label="Close panel (click outside)"
    >
  </div>
{/if}<!--showSecurityModal-->

{#if showRecoveryWarning}
  <div class="display-panel-order recover">
    <div class="display-panel modal" transition:fly={{ y: 20, duration: 300 }}>
      <h2>🔐 Final Security Step Required</h2>
      <p>{recoveryModalMessage}</p>
      <p class="important">Important: The recovery code will not be active until you click 'Copy'.</p>

      <div class="code-box">
        {#if generatedCode && !recoveryCodeGenerated}
          <div class="code-displayed">{generatedCode}<div class="gray-box"></div></div>
        {:else if recoveryCodeGenerated}
          Copied! Code is now active.
        {/if}
      </div>

      <div class="recovery-buttons-parent">
        <div class="panel-buttons">
          {#if !generatedCode && !recoveryCodeGenerated}
            <button class="btn left" on:click={generateNewRecoveryCode}>
              Generate New Recovery Code
            </button>
          {:else if generatedCode && !recoveryCodeGenerated}  
            <button class="btn left" on:click={copyAndActivate}>
              Copy
            </button>
          {:else}
            <button class="btn right" on:click={completeAndUnlock}>
              Proceed To Vault
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
  <div class="overlay"
    role="button"
    tabindex="0"
    on:click={() => showSecurityModal = false}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showSecurityModal = false;
      }
    }}
    aria-label="Close panel (click outside)"
    >
  </div><!--overlay-->

{/if}<!--showRecoveryWarning-->

{#if showForcePassword}
  <div class="display-panel-order">
    <div class="display-panel modal" style="height: 400px;" transition:fly={{ y: 20, duration: 300 }}>
      <button class="panel-close" type="button" aria-label="Close panel" on:click={() => showForcePassword = false}>x</button>
      <div class="modal-header">
        <h2 class="header-title">⚠️ Force Password Warning ⚠️</h2>
      </div>

      <div class="force-password-notice">
        <p>Please acknowledge your acceptance that all safeguards <br>will be severely diminished if you force a weak password.</p>
      </div>

      <div class="panel-buttons">
        <div class="changing_new special">
          <button class="btn left danger" type="button" on:click={() => {
            showForcePassword = false; 
            handleForcePassword();
          }}>✅ Proceed</button>
          <button class="btn right" type="button" on:click={() => {
            showForcePassword = false; clearForced();
          }}>❌ Cancel</button>
        </div>
      </div>
    </div>
  </div><!--display-panel-order-->

  <div class="overlay"
    role="button"
    tabindex="0"
    on:click={() => {showForcePassword = false;}}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showForcePassword = false;
      }
    }}
    aria-label="Close panel (click outside)"
    >
  </div>
  
{/if}<!--showForcePassword-->

{#if showThemePicker}
  <ThemePicker
    {activeThemeId}
    on:change={(e) => activeThemeId = e.detail}
    on:close={() => showThemePicker = false}
  />
{/if}

{#if showLockBgPicker}
  <LockScreenPicker
    currentBg={lockBg}
    {setMessage}
    on:change={(e) => { applyLockBg(e.detail); showLockBgPicker = false; }}
    on:close={() => showLockBgPicker = false}
  />
{/if}
<LockScreenContrastToggle {lockBg} {authMode} on:change={e => lockContrastMode = e.detail} />
<div class="info-panel"> protection by CodeBlack 🔵</div>


<!-- ============================= PROPS ============================= -->

<TimeoutModal
  {showTimeoutModal}
  {currentTimeout}
  timeoutMinutes={timeoutMinutes}
  {sendToBackend}
  {setMessage}
  onclose={() => showTimeoutModal = false}
/>

<ImportModal
  bind:showImportModal
  {importHeaders}
  {importSample}
  {importFilePath}
  submitImportMapping={(mapping) => {
    const parts = Object.entries(mapping)
      .map(([field, idx]) => `${field}:${idx}`)
      .join('|');
    sendToBackend(`import_apply_mapping:${importFilePath}~${parts}`);
  }}
  on:close={() => showImportModal = false}
/>

<BackupModal
  {showBackupModal}
  {provider}
  {backupEnabled}
  {backupInterval}
  {intervalUnit}
  {endpoint}
  {username}
  {backupPassword}
  {retention}
  {encrypt}
  {sendToBackend}
  {setMessage}
  onclose={() => showBackupModal = false}
/>

<AddEntryModal
  {setMessage}
  bind:showAddEntryPanel
  bind:editMode
  bind:newServiceName
  bind:newUsername
  bind:newPasswordDisplay
  bind:strengthScore={strengthScore}
  bind:newWebsite
  bind:newNote
  {submitNewEntry}
  {handleAddEntryKeydown}
  {handleNewPasswordInput}
  {handlePasswordPaste}
  validationError={validationError}
  feedbackMessage={feedbackMessage}
  on:close={() => {
    showAddEntryPanel = false;
    editMode = false;
    editingServiceName = '';
    originalService = '';
  }}
/>

<SearchModal
  bind:showSearchModal
  bind:highlightedIndex
  {searchTerm}
  {searchResults}
  on:refocus={() => document.getElementById('search-vault').focus()}
  on:select={(e) => processSelection(e.detail)}
  collapsed={collapsed}
/>

<TotpModal
  bind:showTotpModal
  {totpStatus}
  {totpSecret}
  {backupCodes}
  {authMode}
  {authStep}
  on:toggle={handleToggleTotp}
  on:resetPasswordStates={resetPasswordStates}
  onclose={() => { showTotpModal = false; }}
  setMessage={setMessage}
  startWatchdog={startAuthWatchdog}
  clearWatchdog={clearAuthTimeout}
/>

<style>

/*=============================================== CSS =================================================*/


/*===================== MAIN SETUP =====================*/

  :root {
      --message-count: 6; 
      --message-duration: 2.5s;
      --total-animation-time: 15s;
      --input-field-height: 40px; /* Adjust this if master-input-container height is different */
  }

  :global(html, body) {
    background-image: radial-gradient(
      circle at center, 
      #aaa 0%, 
      #08080a 100%);
    height: 100%;
    overflow: hidden; /*ESSENTIAL for non-scroll*/
    margin: 0;
    background: white;
    font-family: helvetica neue;
  }

  .container {
    margin: 0;
    padding: 0px 30px;
    width: 100vw;
    height: 100%;
    min-width: 800px;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    position: relative;
  }

/* ================== LOCKED SCREEN ====================== */

  .container.locked-screen {/* ============== For Static BGs =============== */
  /*  background-image: url('Bruce.png');
    background-image: url('Steve.png');*/
  }

  .header-wrapper.locked-screen {
    margin: 40px 20px 0 20px;
  }

/* ===================== VIEWPORT ====================== */

  .card {
    position: absolute;
    width: 100%;
    max-width: 1200px;
    background: transparent;
    padding: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    max-height: 52vh; /* ESSENTIAL height for list view */
    transition: max-height 0.5s ease-in-out;
  }

   /* Expand when a service is selected */
  .card.selected {
    max-height: 75vh; /*ESSENTIAL*/
  }

  .card.authenticated {
    margin-bottom: 175px;
  }

/*===================== BACKGROUND ==========================*/

  .container {
    margin: 0;
    padding-top: 10vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;

    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    position: relative;
  }

  /* Dark overlay for readability (adjust opacity to taste) */
  .container::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.0);
    z-index: 1;
  }

  /* Make all content appear above the overlay */
  .container > * {
    position: relative;
    z-index: 2;
  }


/* =================== BASIC HEADERS ================== */

  h2 {
    font_size: 35px;
  }

/* ======================================= FAVORITING/STAR Styling ========================================= */
  
  .header-star {
    font-size: 22px;
    transition: color 0.3s ease;
    cursor: pointer;
  }

  .header-star.clickable:hover {
    transform: scale(1.3);
  }

  .header-star.clickable {
    color: orange;
  }

/* ———————————————— for SERVICE LIST —————————————————*/

  .service-row:first-child .star-button .star {
    position: absolute;
    bottom: -3px;
  }
  
  .star-button {
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    margin: 10px 0 0 -50px;
    transition: transform 0.2s ease;
    color: yellow;
  }

  .star-button:hover {
    transform: scale(1.2);
  }

  .star {
    font-size: 18px;
    color: orange;
    transition: color 0.3s ease;
  }

  .star-button:hover .star {
    color: orange;
  }


/*=========================================== INPUTS ==================================================*/


/* ============ MAIN INPUT FIELD + DYNAMIC PLACEHOLDER ============= */


.pre-auth-input {
  margin: 0 auto 200px;
  padding-top: 35px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 355px;
  background: rgba(100, 100, 100, 0.2);
  box-shadow: 0 1px 0 0 var(--border-super-soft);
  border-radius:6px;
  height: 150px;
}

.pre-auth-input .main-login {
  position: relative;
  padding-top: 20px;
  display: flex;
  bottom: -20px;
  flex-direction: row;
  gap: 15px;
  width: 275px;
}

.pre-auth-input .main-login button {
  background: rgba(220, 220, 220, 0.5);
  box-shadow: 0 2px 0 0 var(--border-super-soft);
  width: 140px;
  height: 50px;
  padding-left: 5px;
  font-weight: 400;
  font-size: 1em;
  color:var(--text-secondary);
}

.pre-auth-input .main-login button:active {
  box-shadow: none;
}

.pre-auth-input .main-login button:hover {
  background: var(--hover-btn);
}

/* 1. Target the placeholder specifically when the input is focused */
#new-master-password:focus::placeholder,
#confirm-master-password:focus::placeholder, 
#old-password-input:focus::placeholder {
  color: transparent;
  opacity: 0;
}

/* 2. Ensure the placeholder is visible by default */
#new-master-password::placeholder,
#confirm-master-password::placeholder, 
#old-password-input::placeholder {
  font-size: 0.8em;
  opacity: 0.8;
  transition: opacity 0.1s ease; /* Makes the disappear effect smoother */
}

/* When the input is focused, hide the sliding div */
.input-group:focus-within .placeholder {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease;
}

.input-group.has-value .placeholder {
  display: none;
  opacity: 0;
}

.input-group {
  position: relative;
}

.placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.input {/* ===================================================== MAIN INPUT*/
  top: 0;
  padding-left: 10px;
  height: 35px;/*Match with .master-input-container*/
  position: relative; /* ← needed to honour z-index */
  z-index: 2;         /* ← sits above the placeholder */
  box-shadow: inset 0 6px 8px -4px rgba(0, 0, 0, 0.5);
}

.in-recovery {
  border: 1px solid firebrick;
}

/* General Container for Input/Placeholder */
  .master-input-container {
    border: transparent;
    position: relative; 
    width: 100%;
    height: 42px; /*ESSENTIAL: must move in inverse correlation with input element height*/
    padding: 5px 0 0;/*ESSENTIAL: for correctly hiding rolling text.*/
    overflow: hidden;
  }

  .master-input-container input{
    font-size: 1.2em;
    text-align: center;
    color: #fff;
  }

  /* 2. The Sliding Wrapper - The element that is animated */
  .placeholder-slide-wrapper {
    /* Set the total height of the wrapper to fit all messages */
    height: var(--input-field-height);
    display: flex;
    flex-direction: column;
    animation: slidePlaceholder var(--total-animation-time) linear infinite;
  }

  /* 3. Individual Messages */
  .placeholder-slide-wrapper > span {
    /* CRITICAL: Must have the exact height and line-height */
    height: var(--input-field-height); 
    line-height: var(--input-field-height); /* Enforce vertical centering */
    display: flex;
    justify-content: center;
    color: rgba(255, 255, 255, 1); 
    font-size: 15px; 
    font-style: italic;
    /* Prevents messages from shrinking */
    flex-shrink: 0; 
  }

  /* 4. Keyframes: Simple translation for a linear scroll */
  @keyframes slidePlaceholder {
    0% {
        transform: translateY(0);
    }
    100% {
        /* CRITICAL FIX: The wrapper must move up by the height of ALL messages */
        /* Total movement is 6 messages * 50px = 300px */
        transform: translateY(calc(-1 * var(--message-count) * var(--input-field-height)));
    }
  }

  span.red {
    color: #b00;
  }

  input {
    background: var(--bg-input);
  }

  .fields-container {
    background: var(--bg-fields);
  }

  /*===================== WRAPPERS =====================*/

  .header-wrapper-parent {
    position: relative;
    width: 50%;
    height: 325px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    top: 15px;
  }

  .header-wrapper {
    position: absolute;
    width: 100%;
    height: 135px;
    margin: 0 auto;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transform-origin: top left;
    transition:
      transform 750ms ease,
      opacity 750ms ease,
      max-height 750ms ease;
    max-height: 150px;
    opacity: 1;
  }

  .main-header {
    position: relative;
    width: 60%;
    font-size: 3em;
    font-weight: 1000;
    padding-bottom: 10px;
  }

  .main-header span {/* ======================== SIGNATURE LINE ============================= */
    position: absolute;
    bottom: 0;
    left: 0;
    padding-top: 3px;
    background: indianred;
    width: 100%;
    height: 2px;
    border-radius: 4px;
    box-shadow: inset 0 3px 4px -2px rgba(0, 0, 0, 0.75);
  }

  .header-wrapper h1 {
    margin: 185px 0 0;/* ========== ESSENTIAL =========== */
    border-radius: 1px;
    font-weight: 500;
  }

  .header-wrapper h3, h3 {
    font-weight: 500;
    margin: 15px 0 50px;
  }

  /*————————————————— MINIMIZATION —————————————————*/

  .header-wrapper.minimized {/* ===== selectedService ===== */
    display: flex;
    transform: scale(0.8) translate(45px, -150px);
  }

  .header-wrapper.list-adjusted .main-header {
    font-size: 3em;
    font-weight: 500;
  }

  /* ==================================================== UPPER BELT */

  .header-item, .header-list {
    position: absolute;
    top: 0;
    background: rgba(100, 100, 100, 0.5);
    height: 185px;
    width: 100%;
    z-index: 0;
  }

  .header-list {
    height: 160px;
  }

  /* =============================== BUTTON WRAPPER ================================ */

  .button-wrapper {
    position: relative;
    transition:
      transform 750ms ease,
      opacity 750ms ease,
      margin-left 750ms ease;
  }

  .button-wrapper.minimized { /* selectedService */
    position: relative;
    top: -60px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    transform: scale(0.95) translate(0px, 0px);
    margin: 0 auto;
    opacity: 0.9;
    height: 75px;
  }

  .button-wrapper.minimized button {
    font-weight: 500;
  }

  /* ================================= LIST VIEW WRAPPERS ==================================== */

  .container.list-view .header-wrapper.minimized {
    transform: scale(0.8) translate(12%, 0);
    transition: transform 0.75s ease-in-out;
  }

  .container.list-view .header-wrapper.minimized .main-header {
    margin: -150px 0 -15px 0;
  }

  .container.list-view .button-wrapper.minimized {
    top: -70px; /* ← raise this further if needed */
  }

  /*========================== LIST STYLES=============================*/

  /*—————————————————————————— MULTIPLE ITEMS —————————————————————————*/

  .service-list-parent {
    margin: -50px 0 20px; /*ESSENTIAL!*/
    width: 60%;
    overflow-y: auto;
    overflow-x: hidden;
    height: 300px;
  }

  .service {
    width: 99%;
    padding: 10px;
    margin: 10px 5px 0 0; /*gaps between each*/
    border-radius: 8px;
    font-size: 15px;
    font-weight: 400;
    transform: translateY(0); 
    transition: all 0.2s ease-out; 
  }

  .service-list-parent div:first-child .service {
    margin-top: 0;
  }

  .service:active {
    transform: translateY(2px); 
    box-shadow: 0 0 0 0 #777; 
    background-color: #999;
  }

  .service-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .service-row .service {
    text-align: left;
  }


  /*————————————————— INDIVIDUAL SERVICE ITEMS/DETAIL —————————————————*/

  .service-header {
    display: flex;/*ESSENTIAL*/
    border: 1px solid var(--border-soft);
    border-radius: 6px;
    font-size: 30px;
    text-overflow: ellipsis;
    white-space: wrap;
    margin: -20px auto 20px;
    padding: 1px 30px;
    height: 45px;
    min-width: 350px;
    max-width: 90%;
    overflow: hidden;
    text-align: center;
    align-items: center;
    justify-content: center; /* Center the text and icon together */
    gap: 12px;
  }


  .item-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: -5px;
    text-align: left;
  }

  .service-icon {/*favicon*/
    width: 45px;
    height: 45px;
    border: 1px solid #999;
  }

 
  /*======================= LOWER SECTION/FIELDS + =========================*/

  .service-specific-settings {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    width: 45px;
    height: 115px;
    bottom: 0;
    margin-bottom: 25px;
  }

  .cog-icon {
    width: 27px;
    height: 27px;
    padding: 5px 5px 5px 3px;
    display: block;
    pointer-events: none;
  }

  .cog-trigger{
    padding: 3px 38px 3px 5px;
    width: 35px;
    border-radius: 8px;
    font-size: 30px;
    top: 0;
  }

  .site-go-to{
    position: absolute;
    bottom:0;
    border-radius: 8px;
    margin:10px 50px 0;
    padding-top:5px;
    font-size: 25px;
  }

  .secret-block, .login, .site, .note {
    margin-bottom: 25px;
    max-height: 45px;
  }

  .secret-block label,
  .login label,
  .site label,
  .note label {
    position: absolute;
    margin:10px 60px;
    display:inline-flex;
    left: 0;
    font-size: 15px;
    font-weight: 400;
    padding: 5px;
  }

  .login label {
    left:0;
  }

  .secret-block label {
    left:45px;
  }

  .site label, .note label {
    left:80px;
  }

  .note-label-parent {
    position: absolute;
    right: 40px;
    bottom: 25px;
    font-size: 13px;
    font-weight: 400;
  }

  .fields-container {/*=============== VIEWPORT ==================*/
    border:1px solid rgba(75, 75, 75, 0.8);
    border-radius: 4px;
    background: rgba(10, 30, 30, 0.2);
    position: relative;
    height: 195px;
    display: flex;
    flex-direction: column; 
    padding: 10px;
    overflow-y: auto; 
    flex-grow: 1;
  }

/*----------------------- FIELD-LIKE BUTTONS ----------------------------*/

  .field-like {
    margin: 5px 0;
    min-height:42px;/*ESSENTIAL*/
    border-radius: 6px;
    padding: 12px 12px;
    width: 50%;
    text-align: center;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    transition: all 0.15s;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .field-like-notes {
    overflow: none;
    text-overflow: none;
    max-height: none;
  }

  .field-like:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--focus-ring);
    border-color: var(--focus-border);
  }

  .field-like:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .field-like:active {
    background: #279CF5;
  }

  .site {
    white-space: nowrap;    
  }

/*------------------------ BUTTONS -------------------------*/
 

  .changing_verify {
    margin: -20px auto;
    width: 300px;
    height: 100px;
    display: flex;
    flex-direction: row;
  }

  .auth-container .form-field input {
    color: aliceblue;
    font-size: 18px;
  }

  .changing_verify button{
    width: 125px;
  }


/*===================================== SLIDE-OUT (MAIN) MENU PROPERTIES =====================================*/

  .menu-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    z-index: 10000;
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
    cursor: pointer;
  }

  .menu-panel {
    width: 280px;
    backdrop-filter: blur(12px);
    border-right: 1px solid #555;
    padding: 20px;
    display: flex;
    flex-direction: column;
    cursor: auto; 
  }

  .menu-panel h2, .sub-menu-panel h2 {
    top: -30px;
    border-bottom: 1px solid #999;
    padding: 20px;
  }

  .menu-title {
    font-weight: 350;
  }

  .menu-close {
    align-self: flex-end;
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 8px;
    margin-bottom: 20px;
  }

  .menu-close:hover {
    color: rgba(245, 15, 15, 1); 
  }

  .menu-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .menu-item {
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    text-align: left;
    transition: all 200ms ease;
  }

  /*--------------------------------- SUB-MENU ----------------------------------------*/

  .sub-menu-panel {
    width: 235px;
    backdrop-filter: blur(12px);
    padding: 20px;
    display: flex;
    flex-direction: column;
    cursor: auto;
  }

  .sub-menu-panel-child {
    margin-top: 65px;
    padding-top: 2px;
  }

  .sub-menu-indicators {
    float: right;
    font-size: 20px;
    font-type: bold;
  }


/*-------------------------------------- SERVICE ITEM (MINI) MENU ----------------------------------------------*/

/* ⚙️ Action Menu Styles */

  .service-buttons-parent{
    background: rgba(40, 40, 40, 0.95);
    border: 1px solid #333;
    margin: 60px -45px -50px;
    width:160px;
    height: auto;
    padding: 35px 20px 20px 10px;
    border-radius: 8px;
    cursor: auto;
  }

  .service-buttons-parent button{
    font-weight: 400;
  }

  .detail-container {
    border-radius: 8px;
    position: fixed;
    left:0;
    top:225px;
    display: flex;
    padding: 0 20px;
    gap: 12px;
    width:100vw;
    height: 100vh;
  }

  .service-item-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw; /* 📏 Full viewport width */
    height: 110vh; /* 📏 Full viewport height */
    background: rgba(20, 20, 20, 0.85);
    display: flex;
    z-index: 100;
    cursor: pointer;
  }

  .service-x{
    position: fixed;
    top: 35px;
    right: -10px;
  }

  .btn-icon {
    font-size: 14px;
    margin: 5px;
    width: 100%;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    height:40px;
  }

  .slide-out-actions {
    position: relative;
    display: flex;
    padding: 4px 8px;
    border-radius: 6px;
    /*border: 1px solid rgba(255, 255, 255, 0.1);*/
    transform: translateX(125px); /*entry direction*/
    opacity: 1;
    pointer-events: none;
    z-index: 10;
  }

  .slide-out-actions.active {
    transform: translateX(5px);
    opacity: 1;
    pointer-events: auto;
  }
 


  /*==================================== DELETE =====================================*/


  .delete h2 {
    margin: -30px;
    color: #F5CF27;
  }

  .delete-x{
    top: 10px;
    margin-right: -25px;
  }

  .delete .panel-buttons{
    border-top:1px solid #666;
    padding-top: 20px;
    margin: -20px 30px 30px;
  }

  .deleting_service {
    color: indianred;
  }


/*================================ NERD STATS =========================================*/

  .nerd-tick{
    margin-right: -5px;
  }

  .nerd-stats{
    border-radius: 8px; 
    background: rgba(100, 100, 100, 0.2);
    margin-top: 5px;
    width: 150px;
    height: 125px;
    position:absolute;
    right: 20px;
  }

  .stats-banner{
    text-align: center;
    padding: 5px;
    height: 30px;
  }

  .nerd-stats button{
    position: absolute;
    top: -10px;
    right: -5px;
    font-size: 1em;
  }

  .heat-stack-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 16px 5px;
    font-family: Fixedsys, monospace;
    font-weight: 100;
  }

   .heat-stack-container .label{/*Password Strength*/
    background: rgba(75, 75, 75, 0.2);
    border: 1px solid #555;
    border-radius: 6px;       
    margin: 0 25px 0 10px;
    padding: 3px;
    font-size: 12px;
    width: 50%;
    position: absolute;
    left:0;
  }

   .label{
      font-family: Fixedsys, monospace;
      /*color: rgba(66, 245, 39, 1);*/
      margin-top: 5px;
   }

  .heat-stack {
    position: absolute;
    right: 0;
    margin: 0px 10px;
    display: flex;
    flex-direction: column-reverse;
    height: 55px;         
    width: 35px; 
    border: 1px solid #555;        
    border-radius: 6px;
    overflow: hidden;
    padding: 2px;
    background: transparent;/*==========================================================ESSENTIAL*/
    /*box-shadow: 0 2px 8px rgba(0,0,0,0.4);*/
    gap: 2px;
  }

  .bar {
    width: 100%;
    border-radius: 1px;
    transition: background-color 0.3s ease;
    height: 10px;
    border-radius: 1px;
  }

  .heat-label {
    position: absolute;
    bottom: 0;
    left: 0;
    margin: 0 35px 5px;
    font-size: 12px;
    font-weight: 500;
    font-family: monaco, monospace;
    letter-spacing: -0.9px;
    text-align: center;
  }


/* ==================================== BACKUP CODE ======================================= */

  .entropy .panel-close {
    margin-right: -25px;
  }

  .panel-content {
    background: rgba(100, 100, 100, 0.4);
    border-radius: 6px;
    margin-bottom: 25px;
    padding: 25px;
  }


/* ==================================== RECOVERY ======================================= */


  .recover .modal{
    max-height: 375px;
  }

  .recover .modal h2 {
    padding: 30px 0;
  }

  .important{
    margin-top: -10px;
  }

  .recovery-buttons-parent {
    position: relative;
    gap:10px;
    height: 100px;
  }

  .recovery-buttons-parent .panel-buttons {
      margin-top: 20px;
  }

  .panel-buttons .left {
    left: 0;
  }

  .panel-buttons .right {
    right: 0;
  }

  .panel-buttons .left, .panel-buttons .right {
    position: relative;
    height: 60px;
    margin: -35px 5px;
    font-size: 0.85em;
  }

  .code-box {
    background: rgba(100, 100, 100, 0.2);
    border-radius: 6px;
    position: relative;
    margin: -25px auto;
    height: 60px;
    width: 95%;
    display: flex;
    justify-content: center;
    align-items: center;    
    gap: 20px;
  }

  .code-displayed {
    border: 1px solid firebrick;
    border-radius: 6px;
    font-size: 1em;
    max-width: 425px;
    height: 25px;
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 10px;
  }


/*============================== SECURITY REPORT (STATIC) ===============================*/


  .security-static {
    position: absolute;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 280px;
    height: 275px;
    padding-bottom: 15px;
    top: 35px; /*alter this and 'right' in absence of 'center-block'*/
    right: 5px;
  }

  .security-static h3 {
    border-bottom: 1px solid #777;
    border-top: 1px solid #777;
    width: 100%;
    top: 0;
    padding: 15px 0;
  }

  .report-circle {
    border: 1px solid #666;
    border-radius: 100px;
    min-width: 100px;
    height: 100px;
    box-sizing: border-box;
    flex-shrink: 0;
    padding: 25px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: -35px 0 3px;
    position: static;
  }

  .report-box {
    position: static;
    border: 1px solid #777;
    border-radius: 6px;
    background: rgba(75, 75, 75, 0.2);
    padding: 10px 0 5px;
    width: 85%;
    height: auto;
    max-height: 90%;
    flex-shrink: 1;
    overflow-y: auto;
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .report-box p {
    position: relative;
    border: none;
    font-size: 0.9em;
    font-weight: 300;
    padding: 0 10px;
  }

  .report-box.deficits {
    overflow-y: auto;
    max-height: 100px;
  }

  .report-box.deficits p, .security-static p {
    margin: 0 0 5px;
    max-height: 20px;
    padding: 5px 0 10px;
  }

  .security-static p {
    padding-bottom: 10px;
    width: 100%;
  }

  .score-label {
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .score-value {
    font-size: 1.6em;
    font-weight: 500;
    line-height: 1.2;
  }

  .score-max {
    font-size: 0.55em;
  }

  .report-circle,
  .security-static h3,
  .report-box.deficits p, 
  .security-static p {
    background: rgba(125, 125, 125, 0.35);
  }



/*======================================== SECURITY REPORT MODAL ===============================================*/

  .modal {
    margin:-200px auto;
    width: 300px;
  }

  .modal button {
    position: absolute;
    top: 35px;  
    right: 65px;
  }

  .modal-header{
    text-align: center;
    color: #ccc;
    margin: -50px 0 50px;
  }

  .rating-circle {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: rgba(55,55,255,0.03);
    border-radius: 50%;
    width: 90px;
    height: 90px;
    margin: 0px auto 25px;
    border: 2px solid #f59f27;
  }

  .rating-circle .score { font-size: 32px; font-weight: bold; color: #f59f27; }
  .rating-circle .label { font-size: 12px; text-transform: uppercase; opacity: 0.6; }
  .status-tag { font-family: monaco, monospace; color: #f59f27; font-weight: regular; }
  .status-list { list-style: none; padding: 0; margin-top: 20px; }
  .status-list li { 
    display: flex; 
    justify-content: space-between; 
    padding: 10px 0; 
    border-bottom: 1px solid rgba(55,55,55,0.3); 
    font-size: 14px;
  }

  .status-list li:last-child {
    border-top:2px solid #666;
  }


/* =============================== LOGIN ATTEMPT NOTIFICATION ================================== */


  /* Ensure display panel is clickable even when overlay isn't */
  .display-panel-order {
    pointer-events: auto;
  }

  .attempt-list {
    background: rgba(200, 200, 200, 0.75);
    display: block;
    height: 200px;
    overflow-y: auto;
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
    text-align: left;
    max-height: 300px;
    overflow-y: auto;
  }

/* ========================================= AUTH/PASSWORD CHANGE============================================ */



  .auth-container{
    background: rgba(100, 100, 100, 0.2);
    padding: 10px 0 30px;
    border-radius: 6px;
    border: 1px solid rgba(120, 120, 120, 0.8);
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 350px;
  }

  .header-wrapper.totp-challenge h1 {
    margin-top: -15px;
  }
  
  .header-wrapper-parent.changeNew {
    top: 25px;
    height: 225px;
    padding: 0;
    margin: 0 0 50px;
  }
  
  .auth-container.changing_new {
    margin: -60px auto 60px;
    padding: 5px 0 30px;
  }

  .auth-container.changing_new p {
    margin: -40px 0 30px 0;
  }

  .auth-container.changing_new .error {
    display: none;
  }

  .header-wrapper-parent.changeVerify {
    top: 50px;
  }

  .auth-container.changing_verify_bg {
    margin: 0px auto 120px;
    max-height: 200px;
  }

  .changing-new button{
    margin: 0 auto;
  }

  .auth-container h2{
    font-weight: 300;
    padding: 0 0 10px;
    margin-bottom: 35px;
  }

  .changing_new .panel-buttons {
    margin: 0 auto;
  }

  .changing_new .form-field input {
    color: aliceblue;
    font-size: 18px;
  }

  .changing_new h2, .changing_verify_bg h2 {
    font-size: 1.2em;
  }

  .auth-container input {
    background: rgba(39, 180, 245, 0.25);
    border: 1px solid #aaa;
    text-align: center;
    width: 245px;
    margin: 0 auto;
  }

  .auth-container input::placeholder {
    color: #000;
  }

  .auth-container button {
    margin-top: -20px;
  }

  .btn.key-flash {
    background-color: var(--hover-btn) !important;
    transform: translateY(3px);
    box-shadow: 0 0 0 0 #0056b3;
  }


/* ======================================== FORCE ============================================= */

  
  .force-password-notice{
    position: relative;
    width: 100%; 
    text-align: center;
    background: rgba(100, 100, 100, 0.4);
    margin-bottom: 25px;
  }

  .force-password-notice p{
    color: #ccc;
  }

  .force{
    padding: 5px 20px;
    height: 70px;
  }

  .changing-new {/* ===============FLEX EXEMPLAR */
    position: relative;
    margin: -15px auto;
    align-items: center;
    display: flex;
    gap: 15px;
    height: 50px;
    width: 270px;
  }

  .special {
    position: relative;
    background: rgba(100, 100, 100, 0.2);
    border-radius: 8px;
    height: 100px;
    width: 370px;
    display: flex;
    margin: 0;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  .special button {
    position: absolute;
    top: 0;
  }

  .special .btn {
    font-size: 1em;
  }


/* ================== CONTRAST TOGGLE ====================== */

:global(.locked-screen-light) h1,
:global(.locked-screen-light) h3,
:global(.locked-screen-light) .info-alert,
:global(.locked-screen-light) .info-panel,
:global(.locked-screen-light) .pre-auth-input .main-login button {
  color: oldlace !important;
}

:global(.locked-screen-dark) h1,
:global(.locked-screen-dark) h3,
:global(.locked-screen-dark) .info-alert,
:global(.locked-screen-dark) .info-panel,
:global(.locked-screen-dark) .pre-auth-input .main-login button {
  color: darkslategray !important;
} 

/*================================= THE PERSISTENT ELEMENTS =====================================*/

  .footer-wrapper {
    position: absolute;
    display: none;
    border-top: 1px solid #666;
    bottom: 0;
    background: rgba(150, 150, 150, 0.2);
    width: 100%;
    height: 170px;
  }


/*------------------------------------ INFO/ERROR ---------------------------------------*/

  .message-container {
    position: sticky;
    z-index: 0;
    bottom: 100px;
    min-height: 25px;
    margin-bottom: -30px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .info-alert, .error {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    margin: 10px 0 -110px;
    z-index: 99;
  }

  .message-container.totp-open {
    z-index: 11;
  }

  .message-container.totp-open div:last-child {
    color: floralwhite;
  }

  .error {
    color: #BA3D3D;
  }

  .info-panel { /*==============================CodeBlack*/
    position: fixed;
    bottom: 25px;
    right: 20px;
    padding: 5px 8px;
    background: rgba(250, 250, 250, 0.55);
    border-radius: 8px;
    font-size: 0.6rem;
    max-width: 260px;
    z-index: 9;
    pointer-events: none;
    user-select: none;
  }


/*========================================== ADD/NAV =======================================*/

  .add-nav-parent{
    background: rgba(100, 100, 100, 0.2);
    border-radius: 8px; 
    position: fixed;
    padding: 5px 5px 3px 40px;
    margin: 0 30px -20px;
    left: -43px;
    bottom: 140px;
    width: 100%;
    z-index: 10;
    height: 40px;
    display: flex;       
    flex-direction: row;   
    flex-wrap: nowrap;
    gap: 2px;  
    overflow: hidden;
  }

  .add-nav-kids {
    /*GOLD
    border: 1px solid #F59F30;
    color: #F59F30;*/
    /*STEALTH*/
    border-radius: 8px;
    left:0;
    font-size: 20px;
    font-weight: 200;
    height: 95%;
    min-width: 40px;
  }

  /* --------------------------------------- SEARCH ---------------------------------------- */

  .search-bar{
    margin-top: 45px;
    width: 250px;
    display: flex;
    flex-direction: row;
    padding-left: 3px;
  }

  .search-bar input {
    background: rgba(70, 70, 70, 0.11);
    padding-left: 10px;
    height: 25px;
    font-size: 0.75em;
    font-weight: 300;
  }

/* ======================================= LIST ITEM FLASH ================================================ */


@keyframes flash {
  0%   { background-color: transparent; }
  50%  { background-color: var(--hover-btn); }
  100% { background-color: transparent; }
}

:global(.service.flash-highlight) {
  animation: flash 1s ease-in-out 1s forwards;
}

/* ==================================================================================== */

 
</style>

