// tests/inputValidator.test.js

import { describe, it, expect } from 'vitest';
import { validateServiceName } from '../src/lib/InputValidator.js';

describe('validateServiceName()', () => {

  describe('valid inputs', () => {
    it('accepts a plain text service name', () => {
      expect(validateServiceName('Netflix').valid).toBe(true);
    });

    it('accepts a service name with numbers', () => {
      expect(validateServiceName('Service123').valid).toBe(true);
    });

    it('accepts a service name with special characters', () => {
      expect(validateServiceName('My|Service:Name;Here').valid).toBe(true);
    });

    it('accepts a service name with accented characters', () => {
      expect(validateServiceName('Hébergement').valid).toBe(true);
    });

    it('accepts an empty string', () => {
      expect(validateServiceName('').valid).toBe(true);
    });
  });

  describe('invalid inputs — emoji rejection', () => {
    it('rejects a service name starting with an emoji', () => {
      const result = validateServiceName('🔑MyService');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('❌ Service names cannot contain emojis.');
    });

    it('rejects a service name with an emoji in the middle', () => {
      expect(validateServiceName('My🔑Service').valid).toBe(false);
    });

    it('rejects a service name ending with an emoji', () => {
      expect(validateServiceName('MyService🔑').valid).toBe(false);
    });

    it('rejects a service name containing a flag emoji', () => {
      expect(validateServiceName('SWISS 🇨🇭').valid).toBe(false);
    });

    it('rejects a service name containing multiple emojis', () => {
      expect(validateServiceName('🔑🛡️Service').valid).toBe(false);
    });

    it('rejects a service name that is only an emoji', () => {
      expect(validateServiceName('🔑').valid).toBe(false);
    });
  });

});