export default function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (!siteUrl) return [];

  const lastModified = new Date();
  return [
    { url: siteUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${siteUrl}/terms`, lastModified, changeFrequency: 'monthly', priority: 0.2 },
  ];
}
