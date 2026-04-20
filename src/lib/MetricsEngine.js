// MetricsEngine.js

/**
 * Calculates Shannon Entropy for a string.
 * Formula: $$E = L \cdot \log_2(R)$$
 * Where L is length and R is the character pool size.
 */
export const calculateEntropy = (str) => {
  if (!str) return 0;
  let charsetSize = 0;
  if (/[a-z]/.test(str)) charsetSize += 26;
  if (/[A-Z]/.test(str)) charsetSize += 26;
  if (/[0-9]/.test(str)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(str)) charsetSize += 32;
  return charsetSize === 0 ? 0 : Math.floor(str.length * Math.log2(charsetSize));
};

export const calculateStrengthScore = (str) => {
  if (!str) return 0;
  const len = str.length;
  const variety = (/[A-Z]/.test(str) ? 1.5 : 0) + 
                  (/[0-9]/.test(str) ? 1.5 : 0) + 
                  (/[^A-Za-z0-9]/.test(str) ? 2 : 0);
  return Math.min(10, (len * 0.4) + variety);
};