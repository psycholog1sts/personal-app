import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('product surface explains recurring release-proof value instead of a one-off scanner', async () => {
  const [page, bento, consoleSource, css] = await Promise.all([
    read('app/page.js'),
    read('app/components/CapabilityBento.js'),
    read('app/components/ProductConsole.js'),
    read('app/globals.css'),
  ]);

  assert.match(page, /release gate/i);
  assert.match(page, /tenant isolation/i);
  assert.match(page, /re-?test/i);
  assert.match(page, /pull request/i);
  assert.match(page, /deploy/i);
  assert.match(page, /sample proof/i);
  assert.match(page, /not a penetration test or compliance certification/i);
  assert.match(bento, /drift signal/i);
  assert.match(bento, /finding → fix → re-test → gate/i);
  assert.match(consoleSource, /sample release proof/i);

  assert.match(css, /productConsole/);
  assert.match(css, /proofMatrix/);
  assert.match(css, /workflowRail/);
});
