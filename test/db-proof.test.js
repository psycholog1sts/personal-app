import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { evaluateDbProof, combineReleaseGate } from '../src/action/db-proof.js';

async function withProject(fn, { withTests = false } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'rlsproof-db-proof-'));
  try {
    if (withTests) {
      const testsDir = path.join(root, 'supabase', 'tests');
      await mkdir(testsDir, { recursive: true });
      await writeFile(path.join(testsDir, 'tenant_rls.test.sql'), 'select 1;\n', 'utf8');
    }
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('db proof off never invokes Supabase CLI', async () => {
  await withProject(async (root) => {
    let invoked = false;
    const proof = await evaluateDbProof({
      mode: 'off',
      target: root,
      run: async () => {
        invoked = true;
        return { ok: true, missing: false, code: 0 };
      },
    });

    assert.equal(invoked, false);
    assert.deepEqual(proof, {
      mode: 'off', status: 'off', attempted: false, complete: false, blocking: false,
    });
  });
});

test('auto mode reports incomplete coverage when no pgTAP tests exist', async () => {
  await withProject(async (root) => {
    const proof = await evaluateDbProof({ mode: 'auto', target: root, run: async () => assert.fail('must not run') });
    assert.equal(proof.status, 'not-configured');
    assert.equal(proof.complete, false);
    assert.equal(proof.blocking, false);
    assert.equal(combineReleaseGate('clear', proof), 'incomplete');
  });
});

test('required mode blocks when pgTAP tests are missing', async () => {
  await withProject(async (root) => {
    const proof = await evaluateDbProof({ mode: 'required', target: root, run: async () => assert.fail('must not run') });
    assert.equal(proof.status, 'missing-tests');
    assert.equal(proof.blocking, true);
    assert.equal(combineReleaseGate('clear', proof), 'blocked');
  });
});

test('auto mode does not fake PASS when Supabase CLI is unavailable', async () => {
  await withProject(async (root) => {
    const proof = await evaluateDbProof({
      mode: 'auto',
      target: root,
      run: async () => ({ ok: false, missing: true, code: null, stdout: '', stderr: '' }),
    });
    assert.equal(proof.status, 'missing-cli');
    assert.equal(proof.complete, false);
    assert.equal(proof.blocking, false);
    assert.equal(combineReleaseGate('clear', proof), 'incomplete');
  }, { withTests: true });
});

test('pgTAP success produces completed DB proof', async () => {
  await withProject(async (root) => {
    let invocation;
    const proof = await evaluateDbProof({
      mode: 'required',
      target: root,
      run: async (command, args, options) => {
        invocation = { command, args, cwd: options.cwd };
        return { ok: true, missing: false, code: 0, stdout: 'ok', stderr: '' };
      },
    });
    assert.deepEqual(invocation, { command: 'supabase', args: ['test', 'db'], cwd: root });
    assert.equal(proof.status, 'passed');
    assert.equal(proof.complete, true);
    assert.equal(proof.blocking, false);
    assert.equal(combineReleaseGate('clear', proof), 'clear');
  }, { withTests: true });
});

test('a failing pgTAP suite blocks the effective release gate without echoing raw output', async () => {
  await withProject(async (root) => {
    const proof = await evaluateDbProof({
      mode: 'required',
      target: root,
      run: async () => ({ ok: false, missing: false, code: 1, stdout: 'SECRET ROW DATA', stderr: 'not ok tenant B' }),
    });
    assert.equal(proof.status, 'failed');
    assert.equal(proof.complete, true);
    assert.equal(proof.blocking, true);
    assert.equal(Object.values(proof).join(' ').includes('SECRET ROW DATA'), false);
    assert.equal(combineReleaseGate('review', proof), 'blocked');
  }, { withTests: true });
});
