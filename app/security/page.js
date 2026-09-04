import Link from 'next/link';
import { getDictionary } from '../../i18n/get-dictionary.js';
import { buildPageMetadata } from '../../i18n/seo.js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
const dictionary = getDictionary('en');

export const metadata = buildPageMetadata({
  locale: 'en',
  pathname: '/security',
  title: dictionary.meta.security.title,
  description: dictionary.meta.security.description,
  siteUrl,
});

export default function SecurityPage() {
  const copy = dictionary.security;

  return (
    <main className="shell legal securityPage">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="securityIntro">{copy.intro}</p>
      <p>{copy.updated}</p>

      {copy.sections.map((section) => (
        <section key={section.id}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}

      <div className="securityLinks">
        <a href="https://github.com/psycholog1sts/personal-app" rel="noreferrer">{copy.repositoryLabel}</a>
        <Link href="/">{copy.returnHome}</Link>
      </div>
    </main>
  );
}
