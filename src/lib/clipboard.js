/**
 * copies text to the clipboard and returns a boolean success state.
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
    if (!text) return false;
    
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error("Failed to copy text: ", err);
        // Fallback for older browsers or non-secure contexts if necessary
        return fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Keep it fixed and invisible to prevent UI flicker
    textArea.style.position = "fixed"; 
    textArea.style.opacity = "0"; // Added to match your inline version's stealth
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        document.body.removeChild(textArea);
        return false;
    }
}