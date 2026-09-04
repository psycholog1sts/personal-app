import './globals.css';
import './professional.css';
import './trust.css';
import { getLocale } from '../i18n/config.js';

const locale = getLocale('en');
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? '';

export const metadata = {
  ...(siteUrl ? { metadataBase: new URL(`${siteUrl}/`) } : {}),
  icons: {
    icon: siteUrl ? `${siteUrl}/icon.svg` : '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang={locale.htmlLang} dir={locale.dir}>
      <body>
        <a className="skipLink" href="#main-content">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
