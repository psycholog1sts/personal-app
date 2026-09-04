import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('premium product surface communicates enterprise release-proof value', async () => {
  const [page, css, layout, scanner, pricing, faq] = await Promise.all([
    read('app/page.js'),
    read('app/globals.css'),
    read('app/layout.js'),
    read('app/components/ScannerForm.js'),
    read('app/components/PricingSection.js'),
    read('app/components/FaqSection.js'),
  ]);

  assert.match(page, /Ship Supabase changes with proof, not hope\./);
  assert.match(page, /ProductConsole/);
  assert.match(page, /CapabilityBento/);
  assert.match(page, /PricingSection/);
  assert.match(page, /FaqSection/);
  assert.doesNotMatch(page, /working name/i);
  assert.match(page, /<table className="proofMatrix"/);
  assert.match(page, /scope="col"/);
  assert.match(page, /scope="row"/);

  assert.match(pricing, /Launch Proof/);
  assert.match(pricing, /\$499/);
  assert.match(pricing, /Fix \+ Verify/);
  assert.match(pricing, /\$990/);
  assert.match(pricing, /Private beta/);
  assert.match(pricing, /validation-stage pilot offers/i);

  assert.match(scanner, /Quick assessment/);
  assert.match(scanner, /Risk posture/);
  assert.match(scanner, /Coverage/);
  assert.match(scanner, /Findings/);
  assert.match(scanner, /Next action/);

  assert.match(faq, /penetration test or security certification/i);
  assert.match(faq, /source code leave the browser/i);
  assert.match(faq, /check cannot run/i);

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
  assert.match(layout, /NEXT_PUBLIC_PUBLIC_INDEXING/);
  assert.match(layout, /index:\s*allowIndexing/);
  assert.match(layout, /follow:\s*allowIndexing/);
});
