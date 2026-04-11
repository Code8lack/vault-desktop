use tauri::State;
use crate::AppState;
use std::io::Write;

#[tauri::command]
pub fn dispatch_to_erlang(message: String, state: State<'_, AppState>) -> Result<String, String> {
    // Access the lock through the public field
    let mut guard = state.erlang_child.lock().unwrap();
    
    if let Some(child) = guard.as_mut() {
        let stdin = child.stdin.as_mut().ok_or("Failed to open stdin")?;
        let bytes = format!("{}\n", message).into_bytes();
        
        stdin.write_all(&bytes)
            .map_err(|e| format!("[RUST] ❌ Failed to write to Erlang: {}", e))?;
        
        stdin.flush().map_err(|e| e.to_string())?;
        
        Ok("Message sent".to_string())
    } else {
        Err("Erlang process not running".to_string())
    }
}