import { getLocale } from './config.js';

function normalizePathname(pathname) {
  const raw = typeof pathname === 'string' && pathname.length > 0 ? pathname : '/';
  const [pathOnly] = raw.split(/[?#]/, 1);
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  if (withLeadingSlash === '/') return '/';
  return withLeadingSlash.replace(/\/+$/, '');
}

export function getLocalizedPath(localeCode, pathname = '/') {
  const locale = getLocale(localeCode);
  if (!locale) throw new Error(`Unknown locale: ${localeCode}`);

  const normalized = normalizePathname(pathname);
  if (!locale.slug) return normalized;
  if (normalized === '/') return `/${locale.slug}`;
  return `/${locale.slug}${normalized}`;
}
