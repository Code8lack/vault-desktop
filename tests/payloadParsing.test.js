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

function parseListResult(jsonStr) {
  return JSON.parse(jsonStr);
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

  it('produces an empty mask string when the secret is empty', () => {
    const payload = 'secret_result:|user|site|note|icon|extra';
    const result = parseSecretResult(payload);
    expect(result.selectedSecretDisplay).toBe('');
  });

  it('returns null when the payload contains too many pipe-delimited fields', () => {
    const payload = 'secret_result:pass|user|site|note|icon|extra|unexpected';
    expect(parseSecretResult(payload)).toBeNull();
  });

  it('preserves a base64 icon string without corruption', () => {
    const b64 = 'data:image/png;base64,iVBORw0KGgo=';
    const payload = `secret_result:pass|user|site|note|${b64}|extra`;
    const result = parseSecretResult(payload);
    expect(result.selectedIconPath).toBe(b64);
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

  it('handles a zero interval without producing NaN', () => {
    const result = parseBackupConfig('backup_config:true|0|s3|ep|user|pass|7|false');
    expect(Number.isNaN(result.backupInterval)).toBe(false);
    expect(result.interval_min).toBe(0);
  });

  it('produces NaN for retention when the retention field is non-numeric', () => {
    const result = parseBackupConfig('backup_config:true|60|s3|ep|user|pass|none|false');
    expect(Number.isNaN(result.retention)).toBe(true);
  });

  it('returns undefined for missing fields when the payload is truncated', () => {
    const result = parseBackupConfig('backup_config:true|60|s3');
    expect(result.username).toBeUndefined();
    expect(result.password).toBeUndefined();
    expect(result.encrypt).toBe(false);
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

  it('produces identical output from security_report_data and security_report_silent for the same input', () => {
    const data   = 'security_report_data:92.0|active|true|1|none|✅ Backed up|ok';
    const silent = 'security_report_silent:92.0|active|true|1|none|✅ Backed up|ok';
    const resultData   = parseSecurityReport(data,   'security_report_data:');
    const resultSilent = parseSecurityReport(silent, 'security_report_silent:');
    expect(resultData).toEqual(resultSilent);
  });

  it('trims whitespace from nif_status in both report variants', () => {
    const data   = 'security_report_data:90.0|  active  |true|1|none|✅ Backed up|ok';
    const silent = 'security_report_silent:90.0|  active  |true|1|none|✅ Backed up|ok';
    expect(parseSecurityReport(data,   'security_report_data:').nif_status).toBe('active');
    expect(parseSecurityReport(silent, 'security_report_silent:').nif_status).toBe('active');
  });

  it('handles a zero rating without producing NaN in either variant', () => {
    const data   = 'security_report_data:0|active|false|5|none|No backup|warn';
    const silent = 'security_report_silent:0|active|false|5|none|No backup|warn';
    expect(Number.isNaN(parseSecurityReport(data,   'security_report_data:').rating)).toBe(false);
    expect(Number.isNaN(parseSecurityReport(silent, 'security_report_silent:').rating)).toBe(false);
  });

  it('parses totp_enabled as false when the field is not exactly "true"', () => {
    const data   = 'security_report_data:80.0|active|false|2|none|✅ Backed up|ok';
    const silent = 'security_report_silent:80.0|active|false|2|none|✅ Backed up|ok';
    expect(parseSecurityReport(data,   'security_report_data:').totp_enabled).toBe(false);
    expect(parseSecurityReport(silent, 'security_report_silent:').totp_enabled).toBe(false);
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

// ---------------------------------------------------------------------------
// Emoji in service names — known breaking scenario
// ---------------------------------------------------------------------------

describe('payload parsing — emoji in service names', () => {

  it('preserves an emoji at the start of a service name through JSON parsing', () => {
    const payload = JSON.stringify(['🔑MyService', 'NormalService']);
    const result = parseListResult(payload);
    expect(result[0]).toBe('🔑MyService');
  });

  it('preserves an emoji in the middle of a service name through JSON parsing', () => {
    const payload = JSON.stringify(['My🔑Service']);
    const result = parseListResult(payload);
    expect(result[0]).toBe('My🔑Service');
  });

  it('preserves an emoji service name through the secret_result pipe parser', () => {
    const payload = 'secret_result:pass|🔑MyService|site|note|icon|extra';
    const result = parseSecretResult(payload);
    expect(result.selectedUsername).toBe('🔑MyService');
  });

  it('preserves a multi-emoji service name without truncation or corruption', () => {
    const payload = JSON.stringify(['🔑🛡️MyService']);
    const result = parseListResult(payload);
    expect(result[0]).toBe('🔑🛡️MyService');
  });

});