/* EntropyEngine.js */
/**
 * Calculates Shannon Entropy for a string.
 * Aligned with vault_password_generator.erl pool definitions.
 */
export const calculateEntropy = (str) => {
  if (!str) return 0;
  
  let charsetSize = 0;
  // Aligned with restricted backend sets [cite: 2]
  if (/[a-z]/.test(str)) charsetSize += 25; // Excludes 'l'
  if (/[A-Z]/.test(str)) charsetSize += 24; // Excludes 'I', 'O'
  if (/[0-9]/.test(str)) charsetSize += 8;  // Excludes '0', '1'
  if (/[!@#$%^&*()\-_=+\[\]{}|;:,.<>?]/.test(str)) charsetSize += 26;  
  
  return charsetSize === 0 ? 0 : parseFloat((str.length * Math.log2(charsetSize)).toFixed(2));
};

export const calculateStrengthScore = (str) => {
  const entropy = calculateEntropy(str);
  // Maps 150 bits to the 0-10 humorous remark scale 
  return Math.min(10, (entropy / 13 )); 
};