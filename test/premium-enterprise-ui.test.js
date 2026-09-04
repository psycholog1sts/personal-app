import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('premium product surface communicates enterprise release-proof value', async () => {
  const [page, css, layout, scanner] = await Promise.all([
    read('app/page.js'),
    read('app/globals.css'),
    read('app/layout.js'),
    read('app/components/ScannerForm.js'),
  ]);

  assert.match(page, /Ship Supabase changes with proof, not hope\./);
  assert.match(page, /ProductConsole/);
  assert.match(page, /CapabilityBento/);
  assert.match(page, /PricingSection/);
  assert.match(page, /FaqSection/);
  assert.match(page, /Launch Proof/);
  assert.match(page, /Fix \+ Verify/);
  assert.match(page, /Private beta/);
  assert.doesNotMatch(page, /working name/i);

  assert.match(scanner, /Quick assessment/);
  assert.match(scanner, /Risk posture/);
  assert.match(scanner, /Coverage/);
  assert.match(scanner, /Findings/);
  assert.match(scanner, /Next action/);

  assert.match(css, /--surface-raised:/);
  assert.match(css, /--state-pass:/);
  assert.match(css, /--state-review:/);
  assert.match(css, /--state-blocked:/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /@media \(max-width: 680px\)/);

  assert.match(layout, /Supabase/i);
  assert.match(layout, /tenant isolation/i);
  assert.match(layout, /release gate/i);
});
