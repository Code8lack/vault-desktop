// tests/payloadParsing.test.js

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inline reimplementations of the parsing patterns from the listener.
// No proprietary module is imported — these functions replicate only the
// parsing logic, tested against the protocol shape the backend produces.
// ---------------------------------------------------------------------------

const dot = '•';

function parseSecretResult(payload) {
  const innerPayload = payload.slice(14);
  const parts = innerPayload.split('|');
  if (parts.length !== 6) return null;
  const [selectedSecretRaw, selectedUsername, selectedWebsite, selectedNote, selectedIconPath] = parts;
  return {
    selectedSecretRaw,
    selectedUsername,
    selectedWebsite,
    selectedNote: selectedNote.replace(/\\n/g, '\n'),
    selectedIconPath,
    selectedSecretDisplay: dot.repeat(selectedSecretRaw.length)
  };
}

function parseBackupConfig(payload) {
  const rawData = payload.replace('backup_config:', '');
  const parts = rawData.split('|');
  const rawMins = parseInt(parts[1]);
  const intervalUnit = (rawMins % 1440 === 0) ? 'days' : 'hours';
  return {
    enabled: parts[0] === 'true',
    intervalUnit,
    backupInterval: intervalUnit === 'days' ? rawMins / 1440 : rawMins / 60,
    interval_min: rawMins,
    provider: parts[2],
    endpoint: parts[3],
    username: parts[4],
    password: parts[5],
    retention: parseInt(parts[6]),
    encrypt: parts[7] === 'true'
  };
}

function parseSecurityReport(payload, prefix) {
  const rawData = payload.split(prefix)[1];
  const [rating, nif, totp, defcon, core, backup, permissions] = rawData.split('|');
  return {
    rating: parseFloat(rating),
    nif_status: nif.trim(),
    totp_enabled: totp === 'true',
    defcon_level: parseInt(defcon),
    core_dumps: core,
    backup_msg: backup.startsWith('✅'),
    permissions_status: permissions
  };
}

function parsePasswordLiveUpdate(payload) {
  const [status, score, humor] = payload.replace('password_live_update:', '').split('|');
  return {
    strengthScore: parseFloat(score),
    validationError: status === 'ok' ? '' : status,
    feedbackMessage: humor
  };
}

// ---------------------------------------------------------------------------

describe('payload parsing — secret_result', () => {

  it('parses a well-formed secret_result payload into the correct shape', () => {
    const payload = 'secret_result:mypassword|myuser|https://example.com|a note|/path/to/icon|extra';
    const result = parseSecretResult(payload);
    expect(result).not.toBeNull();
    expect(result.selectedSecretRaw).toBe('mypassword');
    expect(result.selectedUsername).toBe('myuser');
    expect(result.selectedWebsite).toBe('https://example.com');
    expect(result.selectedIconPath).toBe('/path/to/icon');
  });

  it('masks the secret as dot characters matching the secret length', () => {
    const payload = 'secret_result:abc123|user|site|note|icon|extra';
    const result = parseSecretResult(payload);
    expect(result.selectedSecretDisplay).toBe('••••••');
  });

  it('converts escaped newlines in notes to real newlines', () => {
    const payload = 'secret_result:pass|user|site|line1\\nline2|icon|extra';
    const result = parseSecretResult(payload);
    expect(result.selectedNote).toBe('line1\nline2');
  });

  it('returns null when the payload does not contain exactly 6 pipe-delimited fields', () => {
    const payload = 'secret_result:pass|user|site';
    expect(parseSecretResult(payload)).toBeNull();
  });

});

describe('payload parsing — backup_config', () => {

  it('parses interval in minutes as hours when not divisible by 1440', () => {
    const payload = 'backup_config:true|120|s3|https://endpoint.com|admin|secret|7|true';
    const result = parseBackupConfig(payload);
    expect(result.intervalUnit).toBe('hours');
    expect(result.backupInterval).toBe(2);
  });

  it('parses interval in minutes as days when divisible by 1440', () => {
    const payload = 'backup_config:true|2880|s3|https://endpoint.com|admin|secret|7|true';
    const result = parseBackupConfig(payload);
    expect(result.intervalUnit).toBe('days');
    expect(result.backupInterval).toBe(2);
  });

  it('parses enabled flag correctly', () => {
    const on  = parseBackupConfig('backup_config:true|60|s3|ep|user|pass|7|false');
    const off = parseBackupConfig('backup_config:false|60|s3|ep|user|pass|7|false');
    expect(on.enabled).toBe(true);
    expect(off.enabled).toBe(false);
  });

  it('parses encrypt flag correctly', () => {
    const result = parseBackupConfig('backup_config:true|60|s3|ep|user|pass|7|true');
    expect(result.encrypt).toBe(true);
  });

});

describe('payload parsing — security_report', () => {

  const sample = 'security_report_data:87.5|active|true|2|none|✅ Backed up|ok';

  it('parses the rating as a float', () => {
    const result = parseSecurityReport(sample, 'security_report_data:');
    expect(result.rating).toBe(87.5);
  });

  it('parses totp_enabled as a boolean', () => {
    const result = parseSecurityReport(sample, 'security_report_data:');
    expect(result.totp_enabled).toBe(true);
  });

  it('parses defcon_level as an integer', () => {
    const result = parseSecurityReport(sample, 'security_report_data:');
    expect(result.defcon_level).toBe(2);
  });

  it('sets backup_msg to true when backup field starts with ✅', () => {
    const result = parseSecurityReport(sample, 'security_report_data:');
    expect(result.backup_msg).toBe(true);
  });

  it('sets backup_msg to false when backup field does not start with ✅', () => {
    const noBackup = 'security_report_data:87.5|active|true|2|none|No backup|ok';
    const result = parseSecurityReport(noBackup, 'security_report_data:');
    expect(result.backup_msg).toBe(false);
  });

});

describe('payload parsing — password_live_update', () => {

  it('parses strength score as a float', () => {
    const result = parsePasswordLiveUpdate('password_live_update:ok|72.5|Not bad');
    expect(result.strengthScore).toBe(72.5);
  });

  it('clears validationError when status is "ok"', () => {
    const result = parsePasswordLiveUpdate('password_live_update:ok|72.5|Not bad');
    expect(result.validationError).toBe('');
  });

  it('sets validationError to the status string when status is not "ok"', () => {
    const result = parsePasswordLiveUpdate('password_live_update:too_short|12.0|Try harder');
    expect(result.validationError).toBe('too_short');
  });

  it('captures the humor/feedback message', () => {
    const result = parsePasswordLiveUpdate('password_live_update:ok|80.0|Solid choice');
    expect(result.feedbackMessage).toBe('Solid choice');
  });

});