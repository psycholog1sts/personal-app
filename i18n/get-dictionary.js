import { assertPublishedLocale, getPublishedLocales } from './config.js';
import { englishDictionary } from './dictionaries/en.js';
import { validateDictionary } from './validate-locales.js';

const dictionaries = new Map([
  ['en', englishDictionary],
]);

export function getDictionary(localeCode) {
  assertPublishedLocale(localeCode);
  const dictionary = dictionaries.get(localeCode);
  if (!dictionary) throw new Error(`Published locale has no dictionary: ${localeCode}`);

  const validation = validateDictionary(englishDictionary, dictionary);
  if (!validation.ok) {
    throw new Error(`Invalid dictionary for ${localeCode}:\n${validation.errors.join('\n')}`);
  }
  return dictionary;
}

export function validatePublishedDictionaries() {
  const errors = [];
  for (const locale of getPublishedLocales()) {
    const dictionary = dictionaries.get(locale.code);
    if (!dictionary) {
      errors.push(`${locale.code}: published locale has no dictionary`);
      continue;
    }
    const validation = validateDictionary(englishDictionary, dictionary);
    for (const error of validation.errors) errors.push(`${locale.code}: ${error}`);
  }
  return { ok: errors.length === 0, errors };
}
