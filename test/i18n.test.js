import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertPublishedLocale,
  defaultLocale,
  getLocale,
  getPublishedLocales,
  localeRegistry,
} from '../i18n/config.js';
import { getLocalizedPath } from '../i18n/get-localized-path.js';
import { validateDictionary } from '../i18n/validate-locales.js';

const source = {
  meta: { title: 'RLSProof', description: 'Check {repo}' },
  nested: { label: 'Run scan' },
};

test('i18n registry publishes only English and keeps future locales draft', () => {
  assert.equal(defaultLocale, 'en');
  assert.deepEqual(getPublishedLocales().map((locale) => locale.code), ['en']);
  assert.equal(getLocale('ja')?.status, 'draft');
  assert.equal(getLocale('de')?.status, 'draft');
  assert.equal(getLocale('pt-BR')?.status, 'draft');
  assert.equal(localeRegistry.length, 4);
  assert.equal(assertPublishedLocale('en').code, 'en');
  assert.throws(() => assertPublishedLocale('ja'), /not published/i);
  assert.throws(() => assertPublishedLocale('xx'), /unknown locale/i);
});

test('localized paths use registered locale slugs without prefixing English', () => {
  assert.equal(getLocalizedPath('en', '/'), '/');
  assert.equal(getLocalizedPath('en', '/pricing'), '/pricing');
  assert.equal(getLocalizedPath('ja', '/pricing'), '/ja/pricing');
  assert.equal(getLocalizedPath('de', 'privacy/'), '/de/privacy');
  assert.equal(getLocalizedPath('pt-BR', '/privacy/'), '/pt-br/privacy');
  assert.throws(() => getLocalizedPath('xx', '/pricing'), /unknown locale/i);
});

test('dictionary validator rejects missing, extra, empty, type and placeholder drift', () => {
  assert.deepEqual(validateDictionary(source, structuredClone(source)), { ok: true, errors: [] });

  const missing = { meta: structuredClone(source.meta), nested: {} };
  assert.equal(validateDictionary(source, missing).ok, false);
  assert.match(validateDictionary(source, missing).errors.join('\n'), /nested\.label.*missing/i);

  const extra = structuredClone(source);
  extra.meta.stale = 'Old';
  assert.equal(validateDictionary(source, extra).ok, false);
  assert.match(validateDictionary(source, extra).errors.join('\n'), /meta\.stale.*unexpected/i);

  const empty = structuredClone(source);
  empty.nested.label = '   ';
  assert.equal(validateDictionary(source, empty).ok, false);
  assert.match(validateDictionary(source, empty).errors.join('\n'), /nested\.label.*empty/i);

  const wrongType = structuredClone(source);
  wrongType.nested = 'wrong';
  assert.equal(validateDictionary(source, wrongType).ok, false);
  assert.match(validateDictionary(source, wrongType).errors.join('\n'), /nested.*type/i);

  const placeholder = structuredClone(source);
  placeholder.meta.description = 'Check {repository}';
  assert.equal(validateDictionary(source, placeholder).ok, false);
  assert.match(validateDictionary(source, placeholder).errors.join('\n'), /meta\.description.*placeholder/i);
});
