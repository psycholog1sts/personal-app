import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

async function readOrEmpty(relativePath) {
  try {
    return await read(relativePath);
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
}

async function readSurface() {
  const paths = [
    'app/page.js',
    'app/components/HeroCommandCenter.js',
    'app/components/ReleaseConsole.js',
    'app/components/ProofMatrix.js',
    'app/components/WorkflowTimeline.js',
    'app/components/FindingsExplorer.js',
    'app/components/CoveragePanel.js',
    'app/components/EvidencePanel.js',
    'app/components/InstallPanel.js',
    'app/components/TrustMethodology.js',
    'app/components/PricingSection.js',
    'app/components/FaqSection.js',
  ];

  return (await Promise.all(paths.map(readOrEmpty))).join('\n');
}

test('product surface explains recurring release-proof value instead of a one-off scanner', async () => {
  const surface = await readSurface();
  const css = await read('app/globals.css');

  assert.match(surface, /Can User B access User A['’]s data\?/i);
  assert.match(surface, /every pull request/i);
  assert.match(surface, /every deploy/i);
  assert.match(surface, /tenant isolation/i);
  assert.match(surface, /re-?test/i);
  assert.match(surface, /policy drift/i);
  assert.match(surface, /sample proof/i);
  assert.match(surface, /not a security certification/i);

  assert.match(css, /proofMatrix/);
  assert.match(css, /workflowGrid/);
  assert.match(css, /proofTimeline/);
});

test('premium command center exposes explicit proof coverage, install, trust and accessibility contracts', async () => {
  const page = await read('app/page.js');
  const css = await read('app/globals.css');
  const layout = await read('app/layout.js');
  const coverage = await readOrEmpty('app/components/CoveragePanel.js');
  const releaseConsole = await readOrEmpty('app/components/ReleaseConsole.js');
  const install = await readOrEmpty('app/components/InstallPanel.js');
  const trust = await readOrEmpty('app/components/TrustMethodology.js');
  const faq = await readOrEmpty('app/components/FaqSection.js');

  assert.match(page, /HeroCommandCenter/);
  assert.match(page, /ProofMatrix/);
  assert.match(page, /CoveragePanel/);
  assert.match(page, /InstallPanel/);
  assert.match(page, /TrustMethodology/);
  assert.match(page, /FaqSection/);

  assert.match(css, /--surface-1:/);
  assert.match(css, /--text-primary:/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);

  assert.match(layout, /release gate/i);
  assert.match(layout, /tenant isolation/i);

  assert.match(coverage, /Executed/i);
  assert.match(coverage, /Passed/i);
  assert.match(coverage, /Failed/i);
  assert.match(coverage, /Skipped/i);
  assert.match(coverage, /Unavailable/i);
  assert.match(coverage, /never a PASS/i);

  assert.match(releaseConsole, /Sample/i);
  assert.match(releaseConsole, /release gate/i);
  assert.match(install, /db-proof/i);
  assert.match(install, /required/i);
  assert.match(trust, /browser/i);
  assert.match(trust, /not a security certification/i);
  assert.match(faq, /production database/i);
});

test('mobile bento panels contain horizontally scrollable evidence instead of widening the page', async () => {
  const css = await read('app/globals.css');

  assert.match(css, /\.bentoPanel\s*\{[^}]*min-width:\s*0;/s);
  assert.match(css, /\.coverageLedger\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;/s);
});
