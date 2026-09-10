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
  assert.match(html, /<header\b[^>]*class="[^"]*siteHeaderWrap/i, `${name} needs the shared site header`);
  assert.match(html, /<main\b[^>]*id="main-content"/i, `${name} needs the skip-link target`);
  assert.match(html, /<footer\b[^>]*class="[^"]*footer[^"]*shell|<footer\b[^>]*class="[^"]*shell[^"]*footer/i, `${name} needs the shared site footer`);
  assert.match(html, /<details[^>]+class="mobileNav"/i, `${name} needs no-JS mobile navigation`);

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

const [home, security, about, contact, privacy, terms, refund, notFound, sitemap, securityTxt] = await Promise.all([
  read('index.html'),
  read('security/index.html'),
  read('about/index.html'),
  read('contact/index.html'),
  read('privacy/index.html'),
  read('terms/index.html'),
  read('refund/index.html'),
  read('404.html'),
  read('sitemap.xml'),
  read('.well-known/security.txt'),
]);

assertPage({ name: 'home', html: home, canonical: `${siteUrl}/` });
assertPage({ name: 'security', html: security, canonical: `${siteUrl}/security/` });
assertPage({ name: 'about', html: about, canonical: `${siteUrl}/about/` });
assertPage({ name: 'contact', html: contact, canonical: `${siteUrl}/contact/` });
assertPage({ name: 'privacy', html: privacy, canonical: `${siteUrl}/privacy/` });
assertPage({ name: 'terms', html: terms, canonical: `${siteUrl}/terms/` });

assertPage({ name: 'refund', html: refund, canonical: `${siteUrl}/refund/` });

assertNoLocalhost('404', notFound);
assert.doesNotMatch(notFound, /rel="canonical"/i, '404 must not publish a canonical URL');
assert.match(notFound, /name="robots"[^>]+content="[^"]*noindex/i, '404 must remain noindex');
assert.match(notFound, /The requested RLSProof page could not be found\./, '404 description must remain route-specific');
assert.match(notFound, /<main\b[^>]*id="main-content"/i, '404 needs the skip-link target');

assert.match(home, /class="skipLink"[^>]+href="#main-content"|href="#main-content"[^>]+class="skipLink"/i, 'home needs a keyboard skip link');
assert.match(home, /"@type":"WebSite"/, 'home needs truthful WebSite structured data');
assert.doesNotMatch(home, /aggregateRating|ratingValue/i, 'home must not publish fabricated rating schema');

for (const asset of ['opengraph-image', 'twitter-image', 'icon.svg']) {
  await readFile(resolve(root, asset));
}

assert.match(securityTxt, /^Contact:\s+https:\/\/github\.com\/psycholog1sts\/personal-app\/security/m);
assert.match(securityTxt, /^Policy:\s+https:\/\/github\.com\/psycholog1sts\/personal-app\/blob\/main\/SECURITY\.md/m);
assert.match(securityTxt, new RegExp(`^Canonical:\\s+${siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/\\.well-known\\/security\\.txt$`, 'm'));

const sitemapUrls = values(sitemap, /<loc>([^<]+)<\/loc>/gi);
assert.deepEqual(sitemapUrls, [
  `${siteUrl}/`,
  `${siteUrl}/security/`,
  `${siteUrl}/about/`,
  `${siteUrl}/contact/`,
  `${siteUrl}/privacy/`,
  `${siteUrl}/refund/`,
  `${siteUrl}/terms/`,
]);

// Inspect rendered content, excluding hydration payloads and scripts.
const visible = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const basePath = new URL(siteUrl).pathname.replace(/\/$/, '');
for (const [name, raw] of Object.entries({ home, terms, privacy, refund, contact })) {
  const html = visible(raw);
  for (const route of ['terms', 'privacy', 'refund', 'contact']) {
    assert.ok(html.includes(`href="${basePath}/${route}/"`), `${name} must link to ${route}`);
  }
  assert.match(html, /href="mailto:cmetehan161@gmail\.com"/, `${name} needs the authorized contact address`);
  assert.doesNotMatch(html, /RLSProof\s+(?:Inc\.?|LLC|Ltd\.?|Corporation)|registered company|company registration|VAT number|Paddle[- ]approved|Paddle[- ]verified|official Paddle partner/i, `${name} must not fabricate business or approval claims`);
}
for (const [name, html] of Object.entries({ terms, privacy, refund })) {
  assert.match(visible(html), /independent software product operated by an individual under the RLSProof brand/, `${name} must identify the actual operator model`);
}
for (const [name, html] of Object.entries({ home, terms, refund })) {
  const content = visible(html);
  assert.match(content, /Launch Verification/);
  assert.match(content, /\$149/);
  assert.match(content, /USD/);
  assert.match(content, /one-time payment/);
  assert.match(content, /Payment activation pending|Payment activation is pending/);
  assert.doesNotMatch(content, /href="[^" ]*(?:checkout\.paddle|buy\.paddle|buy\.stripe)/i);
  const paidPrices = [...content.matchAll(/\$(\d+(?:\.\d{2})?)/g)].map((match) => Number(match[1])).filter(Boolean);
  assert.ok(paidPrices.length > 0 && paidPrices.every((price) => price === 149), `${name} paid price must remain $149`);
}
assert.match(visible(home), /aria-disabled="true"[^>]*>Payment activation pending/);
assert.match(visible(refund), /href="https:\/\/www\.paddle\.com\/legal\/refund-policy"/);
assert.match(visible(refund), /mandatory rights/);

console.log(`Static publication verification passed for ${siteUrl}`);
