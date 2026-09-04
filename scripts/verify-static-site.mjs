import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'out');
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://psycholog1sts.github.io/personal-app').replace(/\/+$/, '');

async function read(relativePath) {
  return readFile(resolve(root, relativePath), 'utf8');
}

function values(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function assertNoLocalhost(name, html) {
  assert.doesNotMatch(html, /(?:localhost|127\.0\.0\.1)(?::\d+)?/i, `${name} must not publish localhost metadata`);
}

function assertPage({ name, html, canonical, expectSocial = true }) {
  assertNoLocalhost(name, html);
  assert.match(html, /<main\b[^>]*id="main-content"/i, `${name} needs the skip-link target`);

  const canonicals = values(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"[^>]*>/gi);
  assert.deepEqual(canonicals, [canonical], `${name} canonical mismatch`);

  if (expectSocial) {
    const ogImages = values(html, /<meta[^>]+property="og:image"[^>]+content="([^"]+)"[^>]*>/gi);
    const twitterImages = values(html, /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"[^>]*>/gi);
    assert.ok(ogImages.some((url) => url.startsWith(`${siteUrl}/`)), `${name} needs a production Open Graph image`);
    assert.ok(twitterImages.some((url) => url.startsWith(`${siteUrl}/`)), `${name} needs a production Twitter image`);
  }

  const icons = values(html, /<link[^>]+rel="icon"[^>]+href="([^"]+)"[^>]*>/gi);
  assert.ok(icons.includes(`${siteUrl}/icon.svg`), `${name} needs the base-path-safe favicon`);
}

const [home, security, privacy, terms, notFound, sitemap] = await Promise.all([
  read('index.html'),
  read('security/index.html'),
  read('privacy/index.html'),
  read('terms/index.html'),
  read('404.html'),
  read('sitemap.xml'),
]);

assertPage({ name: 'home', html: home, canonical: `${siteUrl}/` });
assertPage({ name: 'security', html: security, canonical: `${siteUrl}/security/` });
assertPage({ name: 'privacy', html: privacy, canonical: `${siteUrl}/privacy/` });
assertPage({ name: 'terms', html: terms, canonical: `${siteUrl}/terms/` });

assertNoLocalhost('404', notFound);
assert.doesNotMatch(notFound, /rel="canonical"/i, '404 must not publish a canonical URL');
assert.match(notFound, /name="robots"[^>]+content="[^"]*noindex/i, '404 must remain noindex');
assert.match(notFound, /The requested RLSProof page could not be found\./, '404 description must remain route-specific');
assert.match(notFound, /<main\b[^>]*id="main-content"/i, '404 needs the skip-link target');

assert.match(home, /class="skipLink"[^>]+href="#main-content"|href="#main-content"[^>]+class="skipLink"/i, 'home needs a keyboard skip link');
assert.match(home, /<details[^>]+class="mobileNav"/i, 'home needs no-JS mobile navigation');
assert.match(home, /"@type":"WebSite"/, 'home needs truthful WebSite structured data');
assert.doesNotMatch(home, /aggregateRating|ratingValue/i, 'home must not publish fabricated rating schema');

for (const asset of ['opengraph-image', 'twitter-image', 'icon.svg']) {
  await readFile(resolve(root, asset));
}

const sitemapUrls = values(sitemap, /<loc>([^<]+)<\/loc>/gi);
assert.deepEqual(sitemapUrls, [
  `${siteUrl}/`,
  `${siteUrl}/security/`,
  `${siteUrl}/privacy/`,
  `${siteUrl}/terms/`,
]);

console.log(`Static publication verification passed for ${siteUrl}`);
