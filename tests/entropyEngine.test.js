// tests/entropyEngine.test.js

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
    it('uses a charset of 26 for lowercase-only strings', () => {
      // L=4, R=26 → floor(4 * log2(26)) = floor(4 * 4.7) = 18
      expect(calculateEntropy('abcd')).toBe(Math.floor(4 * Math.log2(26)));
    });

    it('uses a charset of 26 for uppercase-only strings', () => {
      expect(calculateEntropy('ABCD')).toBe(Math.floor(4 * Math.log2(26)));
    });

    it('uses a charset of 52 for mixed-case strings', () => {
      expect(calculateEntropy('AbCd')).toBe(Math.floor(4 * Math.log2(52)));
    });

    it('uses a charset of 62 for alphanumeric strings', () => {
      expect(calculateEntropy('Abc1')).toBe(Math.floor(4 * Math.log2(62)));
    });

    it('uses a charset of 94 for strings with special characters', () => {
      expect(calculateEntropy('Abc1!')).toBe(Math.floor(5 * Math.log2(94)));
    });

    it('uses a charset of 32 for special-character-only strings', () => {
      expect(calculateEntropy('!@#$')).toBe(Math.floor(4 * Math.log2(32)));
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
    it('scores a lowercase-only password purely on length', () => {
      // len=4, variety=0 → min(10, 4*0.4 + 0) = 1.6
      expect(calculateStrengthScore('abcd')).toBeCloseTo(1.6);
    });

    it('adds 1.5 for uppercase presence', () => {
      // len=4, variety=1.5 → min(10, 1.6 + 1.5) = 3.1
      expect(calculateStrengthScore('abcD')).toBeCloseTo(3.1);
    });

    it('adds 1.5 for digit presence', () => {
      // len=4, variety=1.5 → min(10, 1.6 + 1.5) = 3.1
      expect(calculateStrengthScore('abc1')).toBeCloseTo(3.1);
    });

    it('adds 2 for special character presence', () => {
      // len=4, variety=2 → min(10, 1.6 + 2) = 3.6
      expect(calculateStrengthScore('abc!')).toBeCloseTo(3.6);
    });

    it('scores a fully mixed password correctly', () => {
      // len=4, variety=5 → min(10, 1.6 + 5) = 6.6
      expect(calculateStrengthScore('aB1!')).toBeCloseTo(6.6);
    });

    it('caps the score at 10', () => {
      expect(calculateStrengthScore('aB1!aB1!aB1!aB1!aB1!aB1!')).toBe(10);
    });

    it('produces a higher score for a longer password with the same character mix', () => {
      const short = calculateStrengthScore('aB1!');
      const long  = calculateStrengthScore('aB1!aB1!aB1!');
      expect(long).toBeGreaterThanOrEqual(short);
    });
  });

});