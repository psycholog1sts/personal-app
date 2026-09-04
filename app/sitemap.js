import { getPublishedLocalizedUrls } from '../i18n/seo.js';

export const dynamic = 'force-static';

export default function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (!siteUrl) return [];

  const lastModified = new Date();
  const routes = [
    { pathname: '/', changeFrequency: 'weekly', priority: 1 },
    { pathname: '/security', changeFrequency: 'monthly', priority: 0.7 },
    { pathname: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { pathname: '/contact', changeFrequency: 'monthly', priority: 0.5 },
    { pathname: '/privacy', changeFrequency: 'monthly', priority: 0.2 },
    { pathname: '/terms', changeFrequency: 'monthly', priority: 0.2 },
  ];

  return routes.flatMap((route) => getPublishedLocalizedUrls(route.pathname, siteUrl).map((url) => ({
    url,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  })));
}
