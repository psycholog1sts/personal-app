import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildAbsoluteUrl, buildPageMetadata } from '../i18n/seo.js';

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

test('root layout owns shared shell, production metadata base and a keyboard skip link', async () => {
  const layout = await read('app/layout.js');
  assert.match(layout, /className="skipLink"/);
  assert.match(layout, /href="#main-content"/);
  assert.match(layout, /metadataBase/);
  assert.match(layout, /icon\.svg/);
  assert.doesNotMatch(layout, /buildPageMetadata|getDictionary\('en'\)/);
});

test('homepage owns its metadata and keeps global landmarks in semantic order', async () => {
  const page = await read('app/page.js');
  assert.match(page, /export const metadata = buildPageMetadata/);
  assert.match(page, /<SiteHeader copy=\{copy\.nav\} \/>/);
  assert.match(page, /<main id="main-content">/);
  assert.match(page, /<SiteFooter copy=\{copy\.footer\} \/>/);
  assert.ok(page.indexOf('<SiteHeader copy={copy.nav} />') < page.indexOf('<main id="main-content">'));
  assert.ok(page.indexOf('</main>') < page.indexOf('<SiteFooter copy={copy.footer} />'));
});

test('mobile navigation remains available without client-side JavaScript', async () => {
  const header = await read('app/components/SiteHeader.js');
  assert.match(header, /<details className="mobileNav">/);
  assert.match(header, /<summary aria-label=\{copy\.primaryLabel\}>Menu<\/summary>/);
  assert.match(header, /className="mobileNavCta"/);
  assert.doesNotMatch(header, /['"]use client['"]/);
});

test('all public content pages expose a skip-link target', async () => {
  const paths = [
    'app/page.js',
    'app/security/page.js',
    'app/about/page.js',
    'app/contact/page.js',
    'app/privacy/page.js',
    'app/terms/page.js',
    'app/not-found.js',
  ];
  for (const path of paths) {
    assert.match(await read(path), /<main[^>]*id="main-content"/);
  }
});

test('publication metadata uses a static favicon and local social preview generators', async () => {
  assert.equal(await exists('public/icon.svg'), true);
  assert.equal(await exists('app/icon.js'), false);

  for (const path of ['app/opengraph-image.js', 'app/twitter-image.js']) {
    assert.equal(await exists(path), true, `${path} must exist`);
    const source = await read(path);
    assert.doesNotMatch(source, /https?:\/\/.*\.(?:woff2?|ttf|otf)/i);
  }
});

test('page metadata publishes absolute production social images', () => {
  const siteUrl = 'https://psycholog1sts.github.io/personal-app';
  const metadata = buildPageMetadata({
    locale: 'en',
    pathname: '/security',
    title: 'Security — RLSProof',
    description: 'Security model.',
    siteUrl,
  });

  assert.equal(metadata.openGraph.images[0].url, `${siteUrl}/opengraph-image`);
  assert.deepEqual(metadata.twitter.images, [`${siteUrl}/twitter-image`]);
  assert.equal(metadata.twitter.card, 'summary_large_image');
});

test('canonical and sitemap helpers publish trailing-slash URLs consistently', () => {
  const siteUrl = 'https://psycholog1sts.github.io/personal-app';
  assert.equal(buildAbsoluteUrl(siteUrl, '/'), `${siteUrl}/`);
  assert.equal(buildAbsoluteUrl(siteUrl, '/security'), `${siteUrl}/security/`);
  assert.equal(buildAbsoluteUrl(siteUrl, 'privacy/'), `${siteUrl}/privacy/`);
});

test('404 metadata is self-contained and cannot inherit the homepage canonical', async () => {
  const notFound = await read('app/not-found.js');
  assert.match(notFound, /description:\s*['"]The requested RLSProof page could not be found\./);
  assert.match(notFound, /alternates:\s*\{\s*\}/);
  assert.match(notFound, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
});
