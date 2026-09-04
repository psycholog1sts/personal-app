import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const installerUrl = new URL('../scripts/install-external-scanners.sh', import.meta.url);

test('external scanner installer pins verified Linux x64 assets and fails closed on unsupported runners', async () => {
  const installer = await readFile(installerUrl, 'utf8');

  assert.match(installer, /set -euo pipefail/);
  assert.match(installer, /8\.30\.1/);
  assert.match(installer, /551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb/);
  assert.match(installer, /2\.5\.1/);
  assert.match(installer, /f9f25499a2c8cc367b3af45df2ea7eeca7fbccceab9c35079968f4b3652194be/);
  assert.match(installer, /1\.29\.0/);
  assert.match(installer, /3365ef49d04893e01338d85d9bbd49b2bd5261ad4c9c0df0a6a0f8d44232ae13/);
  assert.match(installer, /sha256sum --check --strict/);
  assert.match(installer, /uname -s/);
  assert.match(installer, /uname -m/);
  assert.match(installer, /unsupported/i);
  assert.doesNotMatch(installer, /\bcurl\b[^\n]*\|[^\n]*(?:sh|bash)\b/i);
  assert.doesNotMatch(installer, /\beval\b/);
});

test('CI consumes the shared external scanner installer instead of duplicating release digests', async () => {
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(workflow, /scripts\/install-external-scanners\.sh/);
  assert.doesNotMatch(workflow, /551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb/);
  assert.doesNotMatch(workflow, /f9f25499a2c8cc367b3af45df2ea7eeca7fbccceab9c35079968f4b3652194be/);
  assert.doesNotMatch(workflow, /3365ef49d04893e01338d85d9bbd49b2bd5261ad4c9c0df0a6a0f8d44232ae13/);
});