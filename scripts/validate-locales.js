import { defaultLocale, localeRegistry } from '../i18n/config.js';
import { validatePublishedDictionaries } from '../i18n/get-dictionary.js';
import { validateLocaleRegistry } from '../i18n/validate-locales.js';

const errors = [];

const registryValidation = validateLocaleRegistry(localeRegistry, defaultLocale);
errors.push(...registryValidation.errors);

const dictionaryValidation = validatePublishedDictionaries();
errors.push(...dictionaryValidation.errors);

if (errors.length > 0) {
  console.error('Localization validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Localization validation passed: ${localeRegistry.filter((locale) => locale.status === 'published').length} published locale(s).`);
}
