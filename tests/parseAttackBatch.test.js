// tests/parseAttackBatch.test.js

import { describe, it, expect } from 'vitest';
import { parseAttackBatch } from '../src/lib/SecurityHandler.js';

describe('parseAttackBatch()', () => {

  describe('input sanitisation', () => {
    it('returns an empty array when payload is not a string', () => {
      expect(parseAttackBatch(null)).toEqual([]);
      expect(parseAttackBatch(undefined)).toEqual([]);
      expect(parseAttackBatch(123)).toEqual([]);
      expect(parseAttackBatch({})).toEqual([]);
    });

    it('returns an empty array when payload contains no colon', () => {
      expect(parseAttackBatch('no_colon_here')).toEqual([]);
    });

    it('returns an empty array when payload has a prefix but no data after it', () => {
      expect(parseAttackBatch('attack_batch:')).toEqual([]);
    });

    it('strips wrapping quotes from a quoted payload string', () => {
      const result = parseAttackBatch('"attack_batch:12:00|192.168.1.1|CLI|MacBook;13:00|10.0.0.1|GUI|iPhone"');
      expect(result).toHaveLength(2);
    });
  });

  describe('row parsing', () => {
    it('parses a single well-formed CLI row correctly', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1|CLI|MacBook');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        time: '12:00',
        ipAddress: '192.168.1.1',
        location: 'CLI',
        device: 'MacBook'
      });
    });

    it('parses a single well-formed GUI row correctly', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1|GUI|MacBook');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        time: '12:00',
        ipAddress: '192.168.1.1',
        location: 'GUI',
        device: 'MacBook'
      });
    });

    it('parses multiple rows separated by semicolons', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1|CLI|MacBook;13:00|10.0.0.1|GUI|iPhone');
      expect(result).toHaveLength(2);
      expect(result[0].ipAddress).toBe('192.168.1.1');
      expect(result[1].ipAddress).toBe('10.0.0.1');
    });
  });

  describe('origin normalisation', () => {
    it('normalises any CLI variant to "CLI"', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1|cli|MacBook');
      expect(result[0].location).toBe('CLI');
    });

    it('normalises any non-CLI origin to "GUI"', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1|MOBILE|MacBook');
      expect(result[0].location).toBe('GUI');
    });

    it('defaults to "GUI" when origin field is missing', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1||MacBook');
      expect(result[0].location).toBe('GUI');
    });

    it('normalises a CLI string with surrounding whitespace to "GUI" as whitespace breaks the match', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1| CLI |MacBook');
      expect(result[0].location).toBe('GUI');
    });

    it('normalises a numeric origin field to "GUI"', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1|42|MacBook');
      expect(result[0].location).toBe('GUI');
    });

    it('normalises a special character origin field to "GUI"', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1|@#$%|MacBook');
      expect(result[0].location).toBe('GUI');
    });

    it('normalises an explicitly empty origin field to "GUI"', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1||MacBook');
      expect(result[0].location).toBe('GUI');
    });
  });

  describe('missing field fallbacks', () => {
    it('falls back to "Unknown" for a missing time field', () => {
      const result = parseAttackBatch('attack_batch:|192.168.1.1|GUI|MacBook');
      expect(result[0].time).toBe('Unknown');
    });

    it('falls back to "Unknown" for a missing IP field', () => {
      const result = parseAttackBatch('attack_batch:12:00||GUI|MacBook');
      expect(result[0].ipAddress).toBe('Unknown');
    });

    it('falls back to "Unknown" for a missing device field', () => {
      const result = parseAttackBatch('attack_batch:12:00|192.168.1.1|GUI|');
      expect(result[0].device).toBe('Unknown');
    });

    it('returns a fully unknown row when all fields are missing', () => {
    const result = parseAttackBatch('attack_batch:|||');
    expect(result[0]).toEqual({
      time: 'Unknown',
      ipAddress: 'Unknown',
      location: 'GUI',
      device: 'Unknown'
    });
  });
  });

});