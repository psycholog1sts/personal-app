import './globals.css';
import './professional.css';
import { getLocale } from '../i18n/config.js';
import { getDictionary } from '../i18n/get-dictionary.js';
import { buildPageMetadata } from '../i18n/seo.js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
const copy = getDictionary('en');
const locale = getLocale('en');

export const metadata = buildPageMetadata({
  locale: 'en',
  pathname: '/',
  title: copy.meta.home.title,
  description: copy.meta.home.description,
  siteUrl,
});

export default function RootLayout({ children }) {
  return (
    <html lang={locale.htmlLang} dir={locale.dir}>
      <body>{children}</body>
    </html>
  );
}
