import Link from 'next/link';
import SiteFooter from '../components/SiteFooter.js';
import SiteHeader from '../components/SiteHeader.js';
import { getDictionary } from '../../i18n/get-dictionary.js';
import { buildPageMetadata } from '../../i18n/seo.js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
const dictionary = getDictionary('en');

export const metadata = buildPageMetadata({
  locale: 'en',
  pathname: '/contact',
  title: dictionary.meta.contact.title,
  description: dictionary.meta.contact.description,
  siteUrl,
});

export default function ContactPage() {
  const copy = dictionary.contact;

  return (
    <>
      <SiteHeader copy={dictionary.nav} homeAnchors />
      <main id="main-content" className="shell legal publicContentPage contactPage">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="securityIntro">{copy.intro}</p>

        <div className="contactGrid">
          {copy.methods.map((method) => (
            <section className="contactCard" key={method.id}>
              <h2>{method.heading}</h2>
              <p>{method.body}</p>
              {method.href.startsWith('/')
                ? <Link href={method.href}>{method.linkLabel}</Link>
                : <a href={method.href} rel="noreferrer">{method.linkLabel}</a>}
            </section>
          ))}
        </div>

        <p className="contactRepository">
          <a href="https://github.com/psycholog1sts/personal-app" rel="noreferrer">{copy.repositoryLabel}</a>
        </p>
      </main>
      <SiteFooter copy={dictionary.footer} />
    </>
  );
}
