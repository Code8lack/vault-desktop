// src/lib/gui/triggerLock.ts
import { invoke } from '@tauri-apps/api/core';

export async function triggerLock(): Promise<void> {
  try {
    // 1) Try to find the existing working lock button in the DOM
    const btn = document.querySelector<HTMLElement>('[data-lock-button]');
    if (btn) {
      // Programmatically click the existing button so its original handler runs
      btn.click();
      return;
    }

    // 2) Fallback: try the backend invoke (still safe, last resort)
    // Use the IPC path your backend expects (adjust if different in your codebase)
    await invoke('send_to_erlang', { message: 'lock' });
  } catch (err) {
    // Always log so we can debug if needed
    console.error('triggerLock failed:', err);
  }
}
