import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('web app is a browser-only static export for GitHub Pages', async () => {
  const scanner = await read('app/components/ScannerForm.js');
  const config = await read('next.config.mjs');
  const privacy = await read('app/privacy/page.js');

  assert.match(scanner, /browserQuickScanGithubRepo/);
  assert.doesNotMatch(scanner, /['"]\/api\/scan['"]/);

  assert.match(config, /output\s*:\s*['"]export['"]/);
  assert.match(config, /basePath/);
  assert.match(config, /trailingSlash\s*:\s*true/);

  assert.equal(existsSync(new URL('app/api/scan/route.js', root)), false);
  assert.equal(existsSync(new URL('app/api/health/route.js', root)), false);

  assert.match(privacy, /runs in your browser/i);
  assert.doesNotMatch(privacy, /temporary directory/i);
});
