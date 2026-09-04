import './globals.css';
import './professional.css';
import './trust.css';
import { getLocale } from '../i18n/config.js';

const locale = getLocale('en');

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
