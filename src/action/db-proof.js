import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { runTool } from '../adapters/process.js';

const MODES = new Set(['off', 'auto', 'required']);
const TEST_EXTENSIONS = new Set(['.sql', '.pg']);

async function hasPgTapTests(root) {
  const testsRoot = path.join(root, 'supabase', 'tests');

  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT') return false;
      throw error;
    }

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (await walk(entryPath)) return true;
        continue;
      }
      if (entry.isFile() && TEST_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) return true;
    }
    return false;
  }

  return walk(testsRoot);
}

function result(mode, status, { attempted = false, complete = false, blocking = false } = {}) {
  return { mode, status, attempted, complete, blocking };
}

export async function evaluateDbProof({ mode = 'off', target = '.', run = runTool } = {}) {
  if (!MODES.has(mode)) {
    throw new TypeError(`db-proof mode must be one of: ${[...MODES].join(', ')}`);
  }

  if (mode === 'off') return result(mode, 'off');

  const testsPresent = await hasPgTapTests(target);
  if (!testsPresent) {
    return result(mode, mode === 'required' ? 'missing-tests' : 'not-configured', {
      blocking: mode === 'required',
    });
  }

  const execution = await run('supabase', ['test', 'db'], {
    cwd: target,
    timeoutMs: 10 * 60_000,
    maxOutputBytes: 2 * 1024 * 1024,
  });

  if (execution?.missing) {
    return result(mode, 'missing-cli', { blocking: mode === 'required' });
  }

  if (!execution?.ok) {
    return result(mode, 'failed', { attempted: true, complete: true, blocking: true });
  }

  return result(mode, 'passed', { attempted: true, complete: true, blocking: false });
}

export function combineReleaseGate(staticGate, dbProof) {
  if (staticGate === 'blocked' || dbProof?.blocking) return 'blocked';
  if (dbProof?.mode !== 'off' && dbProof?.complete !== true && staticGate === 'clear') return 'incomplete';
  return staticGate;
}
