import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/reader.js';

describe('readNight', () => {
  const night = readNight('runs', '2026-10-28');

  it('makes one row per job and counts the bad line', () => {
    expect(night?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    expect(night?.badLines).toBe(1);
  });

  it('keeps a null owner and counts retries', () => {
    const rows = Object.fromEntries((night?.rows ?? []).map((r) => [r.job, r]));
    expect(rows['digest/render']?.owner).toBeNull();
    expect(rows['fixtures/refresh']).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    expect(rows['notes/backup']).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('returns null for a missing night', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
  });
});
