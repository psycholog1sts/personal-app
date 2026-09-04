import { assertPublishedLocale, defaultLocale, getPublishedLocales } from './config.js';
import { getLocalizedPath } from './get-localized-path.js';

function normalizeSiteUrl(siteUrl) {
  return typeof siteUrl === 'string' ? siteUrl.replace(/\/+$/, '') : '';
}

export function buildAbsoluteUrl(siteUrl, pathname) {
  const base = normalizeSiteUrl(siteUrl);
  if (!base) return '';
  const path = pathname === '/' ? '/' : pathname;
  return `${base}${path}`;
}

export function getAlternateLanguages(pathname, siteUrl) {
  const base = normalizeSiteUrl(siteUrl);
  if (!base) return {};

  const languages = {};
  for (const locale of getPublishedLocales()) {
    languages[locale.htmlLang] = buildAbsoluteUrl(base, getLocalizedPath(locale.code, pathname));
  }
  languages['x-default'] = buildAbsoluteUrl(base, getLocalizedPath(defaultLocale, pathname));
  return languages;
}

export function getPublishedLocalizedUrls(pathname, siteUrl) {
  const base = normalizeSiteUrl(siteUrl);
  if (!base) return [];
  return getPublishedLocales().map((locale) => buildAbsoluteUrl(base, getLocalizedPath(locale.code, pathname)));
}

export function buildPageMetadata({ locale, pathname = '/', title, description, siteUrl }) {
  const localeInfo = assertPublishedLocale(locale);
  const base = normalizeSiteUrl(siteUrl);
  const canonicalPath = getLocalizedPath(locale, pathname);
  const canonical = base ? buildAbsoluteUrl(base, canonicalPath) : undefined;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    ...(base ? {
      metadataBase: new URL(`${base}/`),
      alternates: {
        canonical,
        languages: getAlternateLanguages(pathname, base),
      },
    } : {}),
    openGraph: {
      title,
      description,
      type: 'website',
      locale: localeInfo.ogLocale,
      ...(canonical ? { url: canonical } : {}),
    },
  };
}
