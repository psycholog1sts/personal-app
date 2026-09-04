import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildWebSiteStructuredData, serializeStructuredData } from '../i18n/structured-data.js';

const root = new URL('../', import.meta.url);
const read = (filePath) => readFile(new URL(filePath, root), 'utf8');

async function exists(filePath) {
  try {
    await read(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

test('public trust architecture exposes a dedicated security page', async () => {
  assert.equal(await exists('app/security/page.js'), true);
  const [page, dictionary] = await Promise.all([
    read('app/security/page.js'),
    read('i18n/dictionaries/en.js'),
  ]);

  assert.match(page, /pathname:\s*'\/security'/);
  assert.match(page, /dictionary\.security/);
  assert.match(dictionary, /Security model and verification boundaries/);
  assert.match(dictionary, /A skipped or unavailable required check is never presented as PASS/);
  assert.match(dictionary, /disposable, local or dedicated test/i);
});

test('sitemap and public navigation include the security page through shared site chrome', async () => {
  const [sitemap, dictionary, home, footer] = await Promise.all([
    read('app/sitemap.js'),
    read('i18n/dictionaries/en.js'),
    read('app/page.js'),
    read('app/components/SiteFooter.js'),
  ]);

  assert.match(sitemap, /pathname:\s*'\/security'/);
  assert.match(dictionary, /label:\s*'Security',\s*href:\s*'\/security'/);
  assert.match(home, /SiteFooter/);
  assert.match(home, /copy=\{copy\.footer\}/);
  assert.match(footer, /copy\.security/);
  assert.match(footer, /href="\/security"/);
});

test('WebSite structured data stays truthful, safely serialized and free of review claims', async () => {
  assert.equal(await exists('i18n/structured-data.js'), true);
  const source = await read('i18n/structured-data.js');
  const data = buildWebSiteStructuredData('https://example.com/product/?ignored=1#ignored', '<unsafe>');

  assert.equal(data['@type'], 'WebSite');
  assert.equal(data.name, 'RLSProof');
  assert.equal(data.url, 'https://example.com/product/');
  assert.equal(buildWebSiteStructuredData('javascript:alert(1)'), null);
  assert.doesNotMatch(source, /aggregateRating|review|ratingValue|Organization/i);

  const serialized = serializeStructuredData(data);
  assert.equal(serialized.includes('<'), false);
  assert.equal(serialized.includes('\\u003c'), true);
});

test('custom not-found page is explicitly non-indexable', async () => {
  assert.equal(await exists('app/not-found.js'), true);
  const notFound = await read('app/not-found.js');
  assert.match(notFound, /index:\s*false/);
  assert.match(notFound, /follow:\s*false/);
  assert.match(notFound, /Page not found/);
});
