function normalizeSiteUrl(siteUrl) {
  if (typeof siteUrl !== 'string' || siteUrl.trim() === '') return '';

  try {
    const url = new URL(siteUrl.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    url.hash = '';
    url.search = '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function buildWebSiteStructuredData(siteUrl, description = '') {
  const base = normalizeSiteUrl(siteUrl);
  if (!base) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RLSProof',
    url: `${base}/`,
    inLanguage: 'en',
    ...(description ? { description } : {}),
  };
}

export function serializeStructuredData(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
