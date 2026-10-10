/**
 * Utility functions for text cleaning and formatting
 */

/**
 * Removes emoji characters and cleans up surrounding whitespace/punctuation
 * @param {string} str - Input text
 * @returns {string} Cleaned text without emojis
 */
export function stripEmoji(str) {
  if (!str) return '';
  return str
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]+/gu, '')
    .replace(/\s+\)/g, ')')
    .replace(/\(\s+/g, '(')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
