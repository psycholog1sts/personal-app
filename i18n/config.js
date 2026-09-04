export const defaultLocale = 'en';

export const localeRegistry = Object.freeze([
  Object.freeze({ code: 'en', slug: '', status: 'published', htmlLang: 'en', ogLocale: 'en_US', label: 'English', dir: 'ltr' }),
  Object.freeze({ code: 'ja', slug: 'ja', status: 'draft', htmlLang: 'ja', ogLocale: 'ja_JP', label: '日本語', dir: 'ltr' }),
  Object.freeze({ code: 'de', slug: 'de', status: 'draft', htmlLang: 'de', ogLocale: 'de_DE', label: 'Deutsch', dir: 'ltr' }),
  Object.freeze({ code: 'pt-BR', slug: 'pt-br', status: 'draft', htmlLang: 'pt-BR', ogLocale: 'pt_BR', label: 'Português (Brasil)', dir: 'ltr' }),
]);

const localeMap = new Map(localeRegistry.map((locale) => [locale.code, locale]));

export function getLocale(code) {
  return localeMap.get(code);
}

export function getPublishedLocales() {
  return localeRegistry.filter((locale) => locale.status === 'published');
}

export function assertPublishedLocale(code) {
  const locale = getLocale(code);
  if (!locale) throw new Error(`Unknown locale: ${code}`);
  if (locale.status !== 'published') throw new Error(`Locale is not published: ${code}`);
  return locale;
}
