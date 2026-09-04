import Link from 'next/link';
import SiteFooter from '../components/SiteFooter.js';
import SiteHeader from '../components/SiteHeader.js';
import { getDictionary } from '../../i18n/get-dictionary.js';
import { buildPageMetadata } from '../../i18n/seo.js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
const dictionary = getDictionary('en');

export const metadata = buildPageMetadata({
  locale: 'en',
  pathname: '/about',
  title: dictionary.meta.about.title,
  description: dictionary.meta.about.description,
  siteUrl,
});

export default function AboutPage() {
  const copy = dictionary.about;

  return (
    <>
      <SiteHeader copy={dictionary.nav} homeAnchors />
      <main id="main-content" className="shell legal publicContentPage">
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
          <Link href="/security">{copy.securityLabel}</Link>
          <Link href="/contact">{copy.contactLabel}</Link>
        </div>
      </main>
      <SiteFooter copy={dictionary.footer} />
    </>
  );
}
