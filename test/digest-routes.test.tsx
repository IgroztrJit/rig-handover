import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

function appWith(files: Record<string, string>) {
  const runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(runsDir, name), body);
  return createApp({ adapter: 'shim', installed: 'now', beatEverySeconds: 60, runsDir });
}

const good = '{"at":"2026-10-28T23:00:02+01:00","job":"b/job","status":"ok","owner":null}\n';
const first = '{"at":"2026-10-28T22:00:00+01:00","job":"a/job","status":"fail","owner":"rook","error":"boom"}\n';

describe('digest routes', () => {
  it('page and JSON return 200 with the same jobs in the same order', async () => {
    const app = appWith({ '2026-10-28.jsonl': good + first });
    const page = await app.request('/digest/2026-10-28');
    const json = await app.request('/api/digest/2026-10-28');
    expect(page.status).toBe(200);
    expect(json.status).toBe(200);
    const jobs = ((await json.json()) as { rows: { job: string }[] }).rows.map((r) => r.job);
    expect(jobs).toEqual(['a/job', 'b/job']);
    const html = await page.text();
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('—');
  });

  it('404 for a night with no file', async () => {
    const app = appWith({});
    expect((await app.request('/digest/2026-10-28')).status).toBe(404);
    expect((await app.request('/api/digest/2026-10-28')).status).toBe(404);
  });

  it('renders "nothing ran" for an empty night', async () => {
    const app = appWith({ '2026-10-28.jsonl': '' });
    expect(await (await app.request('/digest/2026-10-28')).text()).toContain('nothing ran');
    expect(((await (await app.request('/api/digest/2026-10-28')).json()) as { rows: unknown[] }).rows).toEqual([]);
  });

  it('renders a night with a bad line', async () => {
    const app = appWith({ '2026-10-28.jsonl': good + '{broken\n' });
    const res = await app.request('/digest/2026-10-28');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('1 unreadable');
  });

  it('board links each night to its digest with counts', async () => {
    const html = await (await appWith({ '2026-10-28.jsonl': good + first }).request('/')).text();
    expect(html).toContain('href="/digest/2026-10-28"');
    expect(html).toContain('ok 1 · retry 0 · fail 1');
  });
});
