/**
 * SecurityHandler.js
 */

export function parseAttackBatch(payload) {
  const cleanPayload = typeof payload === 'string' ? payload.replace(/^"|"$/g, '') : '';
  if (!cleanPayload.includes(':')) return [];

  const data = cleanPayload.split(':').slice(1).join(':');
  if (!data) return [];

  const rows = data.split(';');

  return rows.map(function(row) {
    const fields = row.split('|');
    let origin = fields[2] || 'GUI';
    
    // 🛡️ Logic to ensure we show CLI or GUI, NOT both
    if (origin.toUpperCase().indexOf('CLI') !== -1) {
      origin = 'CLI';
    } else {
      origin = 'GUI';
    }

    return {
      time: fields[0] || 'Unknown',
      ipAddress: fields[1] || 'Unknown',
      location: origin,
      device: fields[3] || 'Unknown'
    };
  });
}