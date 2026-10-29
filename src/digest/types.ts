// Plan morning-digest § 1. Every part of section 2 builds against this file.
export type RunStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null; // views show null as "—"
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that did not parse: counted, never thrown
  counts: Record<RunStatus, number>; // log lines per status, for the board
};

// Returns null when runs/<night>.jsonl does not exist (the route answers 404).
export type ReadNight = (runsDir: string, night: string) => Night | null;
