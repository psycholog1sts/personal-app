import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

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

test('sitemap and public navigation include the security page', async () => {
  const [sitemap, dictionary, home] = await Promise.all([
    read('app/sitemap.js'),
    read('i18n/dictionaries/en.js'),
    read('app/page.js'),
  ]);

  assert.match(sitemap, /pathname:\s*'\/security'/);
  assert.match(dictionary, /label:\s*'Security',\s*href:\s*'\/security'/);
  assert.match(home, /copy\.footer\.security/);
});

test('WebSite structured data stays truthful and cannot smuggle review claims', async () => {
  assert.equal(await exists('i18n/structured-data.js'), true);
  const source = await read('i18n/structured-data.js');

  assert.match(source, /['"]@type['"]:\s*['"]WebSite['"]/);
  assert.match(source, /name:\s*['"]RLSProof['"]/);
  assert.doesNotMatch(source, /aggregateRating|review|ratingValue|Organization/i);
  assert.match(source, /replaceAll\(['"]<['"],\s*['"]\\u003c['"]\)/);
});

test('custom not-found page is explicitly non-indexable', async () => {
  assert.equal(await exists('app/not-found.js'), true);
  const notFound = await read('app/not-found.js');
  assert.match(notFound, /index:\s*false/);
  assert.match(notFound, /follow:\s*false/);
  assert.match(notFound, /Page not found/);
});
