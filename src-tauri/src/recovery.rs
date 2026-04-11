use tauri::State;
use crate::AppState;

#[tauri::command]
pub fn generate_recovery_code(state: State<'_, AppState>) -> Result<(), String> {
    // 🚀 Update path: crate::bridge::dispatch_to_erlang
    crate::bridge::dispatch_to_erlang("generate_recovery_code".to_string(), state).map(|_| ())
}

#[tauri::command]
pub fn recovery_code_copied_and_activated(state: State<'_, AppState>) -> Result<(), String> {
    // 🛡️ Update path: crate::bridge::dispatch_to_erlang
    crate::bridge::dispatch_to_erlang("recovery_code_copied_and_activated".to_string(), state).map(|_| ())
}