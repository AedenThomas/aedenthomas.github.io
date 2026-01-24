
/**
 * Safely copies text to clipboard, handling both secure (HTTPS) and insecure (HTTP) contexts.
 * Falls back to legacy execCommand for insecure contexts.
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} - Resolves true if successful, false otherwise
 */
export async function copyToClipboard(text) {
  try {
    // Try the modern API first (works in secure contexts)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error('Clipboard API unavailable');
  } catch (err) {
    // Fallback for insecure contexts or older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Ensure it's not visible but part of the DOM
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) return true;
      console.error('Fallback: Copying text command failed', err);
      return false;
    } catch (fallbackErr) {
      console.error('Fallback: Unable to copy', fallbackErr);
      return false;
    }
  }
}
