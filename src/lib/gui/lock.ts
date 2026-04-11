// lock.ts
import { invoke } from '@tauri-apps/api/core';

export async function lockVault() {
  try {
    await invoke('dispatch_to_erlang', { message: 'lock' });  // CHANGED: cmd → message
  } catch (err) {
    console.error('Failed to lock vault:', err);
  }
}