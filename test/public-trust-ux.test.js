import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('public trust pages exist and use the same site chrome as the homepage', async () => {
  const [home, security, privacy, terms, about, contact] = await Promise.all([
    read('app/page.js'),
    read('app/security/page.js'),
    read('app/privacy/page.js'),
    read('app/terms/page.js'),
    read('app/about/page.js'),
    read('app/contact/page.js'),
  ]);

  assert.match(home, /SiteFooter/);
  for (const source of [security, privacy, terms, about, contact]) {
    assert.match(source, /SiteHeader/);
    assert.match(source, /homeAnchors/);
    assert.match(source, /SiteFooter/);
    assert.match(source, /id="main-content"/);
  }
});

test('header resolves homepage section links correctly from secondary pages', async () => {
  const header = await read('app/components/SiteHeader.js');
  assert.match(header, /homeAnchors/);
  assert.match(header, /\/\#\$\{item\.href\.slice\(1\)\}/);
  assert.match(header, /href\.startsWith\('\/'\)/);
});

test('public dictionary exposes truthful About and Contact metadata without inventing a company', async () => {
  const dictionary = await read('i18n/dictionaries/en.js');

  assert.match(dictionary, /about:\s*\{\s*title:\s*'About — RLSProof'/s);
  assert.match(dictionary, /contact:\s*\{\s*title:\s*'Contact — RLSProof'/s);
  assert.match(dictionary, /independent software product/i);
  assert.match(dictionary, /GitHub Issues/i);
  assert.doesNotMatch(dictionary, /Inc\.|LLC|Ltd\.|MERS[Iİ]S|tax number|registered company/i);
});

test('sitemap and footer publish About and Contact as first-class trust routes', async () => {
  const [sitemap, dictionary] = await Promise.all([
    read('app/sitemap.js'),
    read('i18n/dictionaries/en.js'),
  ]);

  assert.match(sitemap, /pathname:\s*'\/about'/);
  assert.match(sitemap, /pathname:\s*'\/contact'/);
  assert.match(dictionary, /about:\s*'About'/);
  assert.match(dictionary, /contact:\s*'Contact'/);
});

test('responsible disclosure policy is published without asking reporters to expose secrets publicly', async () => {
  const [securityPolicy, securityTxt] = await Promise.all([
    read('SECURITY.md'),
    read('public/.well-known/security.txt'),
  ]);

  assert.match(securityPolicy, /do not.*public issue.*secret|do not.*public issue.*credential/is);
  assert.match(securityPolicy, /private vulnerability reporting|Security tab/i);
  assert.match(securityTxt, /^Contact:\s+https:\/\/github\.com\/psycholog1sts\/personal-app\/security/m);
  assert.match(securityTxt, /^Policy:\s+https:\/\/github\.com\/psycholog1sts\/personal-app\/blob\/main\/SECURITY\.md/m);
  assert.match(securityTxt, /^Canonical:\s+https:\/\/psycholog1sts\.github\.io\/personal-app\/\.well-known\/security\.txt/m);
  assert.match(securityTxt, /^Expires:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/m);
});
