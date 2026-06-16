import { describe, it, expect } from 'vitest';
import { calculateEntropy, calculateStrengthScore } from '../src/lib/EntropyEngine.js';
// ---------------------------------------------------------------------------
describe('calculateEntropy()', () => {
  describe('edge cases', () => {
    it('returns 0 for an empty string', () => {
      expect(calculateEntropy('')).toBe(0);
    });
    it('returns 0 for a null value', () => {
      expect(calculateEntropy(null)).toBe(0);
    });
    it('returns 0 for undefined', () => {
      expect(calculateEntropy(undefined)).toBe(0);
    });
  });
  describe('charset detection', () => {
    it('uses a charset of 25 for lowercase-only strings', () => {
      // L=4, R=25 → parseFloat((4 * log2(25)).toFixed(2))
      expect(calculateEntropy('abcd')).toBe(parseFloat((4 * Math.log2(25)).toFixed(2)));
    });
    it('uses a charset of 24 for uppercase-only strings', () => {
      // L=4, R=24 → parseFloat((4 * log2(24)).toFixed(2))
      expect(calculateEntropy('ABCD')).toBe(parseFloat((4 * Math.log2(24)).toFixed(2)));
    });
    it('uses a charset of 49 for mixed-case strings', () => {
      // L=4, R=25+24=49 → parseFloat((4 * log2(49)).toFixed(2))
      expect(calculateEntropy('AbCd')).toBe(parseFloat((4 * Math.log2(49)).toFixed(2)));
    });
    it('uses a charset of 57 for alphanumeric strings', () => {
      // L=4, R=25+24+8=57 → parseFloat((4 * log2(57)).toFixed(2))
      expect(calculateEntropy('Abc1')).toBe(parseFloat((4 * Math.log2(57)).toFixed(2)));
    });
    it('uses a charset of 83 for strings with special characters', () => {
      // L=5, R=25+24+8+26=83 → parseFloat((5 * log2(83)).toFixed(2))
      expect(calculateEntropy('Abc1!')).toBe(parseFloat((5 * Math.log2(83)).toFixed(2)));
    });
    it('uses a charset of 26 for special-character-only strings', () => {
      // L=4, R=26 → parseFloat((4 * log2(26)).toFixed(2))
      expect(calculateEntropy('!@#$')).toBe(parseFloat((4 * Math.log2(26)).toFixed(2)));
    });
  });
  describe('entropy scales with length', () => {
    it('produces higher entropy for a longer password with the same charset', () => {
      const short = calculateEntropy('abc');
      const long  = calculateEntropy('abcdefghij');
      expect(long).toBeGreaterThan(short);
    });
  });
});
describe('calculateStrengthScore()', () => {
  describe('edge cases', () => {
    it('returns 0 for an empty string', () => {
      expect(calculateStrengthScore('')).toBe(0);
    });
    it('returns 0 for a null value', () => {
      expect(calculateStrengthScore(null)).toBe(0);
    });
    it('returns 0 for undefined', () => {
      expect(calculateStrengthScore(undefined)).toBe(0);
    });
  });
  describe('scoring', () => {
    it('scores a lowercase-only password correctly', () => {
      // L=4, R=25 → entropy/13
      expect(calculateStrengthScore('abcd')).toBeCloseTo(
        parseFloat((4 * Math.log2(25)).toFixed(2)) / 13
      );
    });
    it('scores a mixed-case password correctly', () => {
      // L=4, R=49 → entropy/13
      expect(calculateStrengthScore('abcD')).toBeCloseTo(
        parseFloat((4 * Math.log2(49)).toFixed(2)) / 13
      );
    });
    it('scores a password with digits correctly', () => {
      // L=4, R=25+8=33 → entropy/13
      expect(calculateStrengthScore('abc1')).toBeCloseTo(
        parseFloat((4 * Math.log2(33)).toFixed(2)) / 13
      );
    });
    it('scores a password with special characters correctly', () => {
      // L=4, R=25+26=51 → entropy/13
      expect(calculateStrengthScore('abc!')).toBeCloseTo(
        parseFloat((4 * Math.log2(51)).toFixed(2)) / 13
      );
    });
    it('scores a fully mixed password correctly', () => {
      // L=4, R=83 → entropy/13
      expect(calculateStrengthScore('aB1!')).toBeCloseTo(
        parseFloat((4 * Math.log2(83)).toFixed(2)) / 13
      );
    });
  });
});