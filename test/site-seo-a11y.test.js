import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (filePath) => readFile(new URL(filePath, root), 'utf8');

test('root document keeps semantic language, main content and labelled navigation', async () => {
  const [layout, page, header, hero] = await Promise.all([
    read('app/layout.js'),
    read('app/page.js'),
    read('app/components/SiteHeader.js'),
    read('app/components/HeroCommandCenter.js'),
  ]);

  assert.match(layout, /<html lang=\{locale\.htmlLang\} dir=\{locale\.dir\}>/);
  assert.match(page, /<main>/);
  assert.match(header, /<header className="siteHeaderWrap">/);
  assert.match(header, /aria-label=\{copy\.primaryLabel\}/);
  assert.equal((hero.match(/<h1\b/g) ?? []).length, 1);
});

test('site keeps keyboard, reduced-motion and touch-target accessibility safeguards', async () => {
  const [baseCss, professionalCss] = await Promise.all([
    read('app/globals.css'),
    read('app/professional.css'),
  ]);

  assert.match(baseCss, /:focus-visible\s*\{/);
  assert.match(baseCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(baseCss, /min-height:\s*44px/);
  assert.match(professionalCss, /min-height:\s*46px/);
});

test('professional visual layer stays static-first and dependency-free', async () => {
  const [layout, professionalCss, pkgText] = await Promise.all([
    read('app/layout.js'),
    read('app/professional.css'),
    read('package.json'),
  ]);
  const pkg = JSON.parse(pkgText);

  assert.match(layout, /import '\.\/globals\.css';\s*\nimport '\.\/professional\.css';/);
  assert.doesNotMatch(professionalCss, /@font-face|@import\s+url|https?:\/\//i);
  assert.doesNotMatch(professionalCss, /\banimation\s*:/i);
  for (const dependency of ['framer-motion', 'gsap', '@react-spring/web', 'three']) {
    assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies ?? {}, dependency), false);
  }
});

test('homepage metadata is concise, product-specific and contains no meta-keyword strategy', async () => {
  const [dictionary, seo] = await Promise.all([
    read('i18n/dictionaries/en.js'),
    read('i18n/seo.js'),
  ]);

  assert.match(dictionary, /RLSProof — Supabase RLS & Tenant Isolation Checks/);
  assert.match(dictionary, /Test Supabase RLS and tenant isolation/);
  assert.doesNotMatch(dictionary, /AI-built apps|keyword stuffing|meta keywords/i);
  assert.doesNotMatch(seo, /\bkeywords\s*:/i);
});
