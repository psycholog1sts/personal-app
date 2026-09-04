import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('CI executes the composite action against clean and vulnerable fixtures', async () => {
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

  assert.match(workflow, /action-contract:/);
  assert.match(workflow, /uses:\s*\.\//);
  assert.match(workflow, /target:\s*test\/fixtures\/clean/);
  assert.match(workflow, /target:\s*test\/fixtures\/vulnerable/);
  assert.match(workflow, /continue-on-error:\s*true/);
  assert.match(workflow, /steps\.vulnerable\.outcome/);
  assert.match(workflow, /failure/);
});
