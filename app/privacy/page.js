import Link from 'next/link';
import { getDictionary } from '../../i18n/get-dictionary.js';
import { buildPageMetadata } from '../../i18n/seo.js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
const dictionary = getDictionary('en');

export const metadata = buildPageMetadata({
  locale: 'en',
  pathname: '/privacy',
  title: dictionary.meta.privacy.title,
  description: dictionary.meta.privacy.description,
  siteUrl,
});

export default function PrivacyPage() {
  const copy = dictionary.legal.privacy;

  return (
    <main className="shell legal">
      <p className="eyebrow">{copy.brand}</p>
      <h1>{copy.title}</h1>
      <p>{copy.updated}</p>
      {copy.sections.map((section) => (
        <section key={section.id}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <p><Link href="/">{copy.returnHome}</Link></p>
    </main>
  );
}
