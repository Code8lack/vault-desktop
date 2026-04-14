// src/lib/InputValidator.js

/**
 * Validates a service name input.
 * Returns { valid: true } or { valid: false, message: string }.
 */
export function validateServiceName(name) {
  if (hasEmoji(name)) {
    return { valid: false, message: '❌ Service names cannot contain emojis.' };
  }
  return { valid: true };
}

function hasEmoji(str) {
  return /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(str);
}