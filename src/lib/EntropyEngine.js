
/**
 * Calculates Shannon Entropy for a string.
 * Aligned with vault_password_generator.erl pool definitions.
 */
export const calculateEntropy = (str) => {
  if (!str) return 0;
  
  let charsetSize = 0;
  if (/[a-z]/.test(str)) charsetSize += 26;
  if (/[A-Z]/.test(str)) charsetSize += 26;
  if (/[0-9]/.test(str)) charsetSize += 8;
  if (/[!@#$%^&*-_=+]/.test(str)) charsetSize += 12;
  
  // Use precision instead of floor to track progress toward 150 bits
  return charsetSize === 0 ? 0 : parseFloat((str.length * Math.log2(charsetSize)).toFixed(2));
};

export const calculateStrengthScore = (str) => {
  const entropy = calculateEntropy(str);
  // Map 0-150 bits to a 0-10 score if you still want a legacy "gauge"
  return Math.min(10, (entropy / 15)); 
};