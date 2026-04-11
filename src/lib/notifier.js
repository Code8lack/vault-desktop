// 🧠 Vault UI Notifier Module
let msgTimer;
let errorTimer;

/**
 * Handles message state for both info and error channels.
 * @param {Object} stores - Pass your reactive store setters here (e.g., setInfo, setError)
 * @param {string} msg - The message text
 * @param {boolean} isPersistent - If true, the message won't auto-clear
 * @param {boolean} isError - Targets the error channel if true
 */
export function setMessage(stores, msg, isPersistent = false, isError = false) {
    const { setInfo, setError } = stores;

    if (isError) {
        clearTimeout(errorTimer);
        setError(msg);
        setInfo(''); // 🛠️ Clear info if an error occurs to avoid UI clutter
        
        if (!isPersistent && msg !== '') {
            errorTimer = setTimeout(() => setError(''), 6000);
        }
    } else {
        clearTimeout(msgTimer);
        setInfo(msg);
        
        if (!isPersistent && msg !== '') {
            msgTimer = setTimeout(() => setInfo(''), 6000);
        }
    }
}