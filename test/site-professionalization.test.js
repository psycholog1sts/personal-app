import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (filePath) => readFile(new URL(filePath, root), 'utf8');

test('public English copy contains no internal strategy or temporary-brand labels', async () => {
  const dictionary = await read('i18n/dictionaries/en.js');

  assert.doesNotMatch(
    dictionary,
    /working name|Live acquisition surface|Pricing hypotheses|validation price|badge: 'Acquisition'|Beta pricing being validated/i,
  );
  assert.match(dictionary, /Prove your Supabase data boundaries before release\./);
  assert.match(dictionary, /Payment activation pending/);
});

test('header and footer no longer render temporary working-name UI', async () => {
  const [header, page] = await Promise.all([
    read('app/components/SiteHeader.js'),
    read('app/page.js'),
  ]);

  assert.doesNotMatch(header, /workingName/);
  assert.doesNotMatch(page, /footer\.workingName/);
});

test('homepage metadata is product-specific and avoids internal AI-builder positioning', async () => {
  const dictionary = await read('i18n/dictionaries/en.js');

  assert.match(dictionary, /RLSProof — Supabase RLS & Tenant Isolation Checks/);
  assert.doesNotMatch(dictionary, /AI-built apps/i);
});
