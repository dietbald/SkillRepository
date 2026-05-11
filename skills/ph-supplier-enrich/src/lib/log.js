// Tiny structured logger. Stamps each line with ISO time + level.
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

let logFile = null;

export function setLogFile(path) {
  if (path) {
    mkdirSync(dirname(path), { recursive: true });
    logFile = path;
  }
}

function emit(level, msg, extra) {
  const ts = new Date().toISOString();
  const line = extra
    ? `[${ts}] [${level}] ${msg} ${JSON.stringify(extra)}`
    : `[${ts}] [${level}] ${msg}`;
  console.error(line);
  if (logFile) {
    try { appendFileSync(logFile, line + '\n', 'utf8'); } catch {}
  }
}

export const log = {
  info: (m, e) => emit('INFO', m, e),
  warn: (m, e) => emit('WARN', m, e),
  err:  (m, e) => emit('ERR ', m, e),
  dbg:  (m, e) => process.env.DEBUG ? emit('DBG ', m, e) : null,
};
