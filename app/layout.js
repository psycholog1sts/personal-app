import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
const description = 'Continuous Supabase authorization release gate for AI-built apps: test RLS and tenant isolation, expose coverage, block regressions, and re-test fixes before release.';

export const metadata = {
  title: 'RLSProof — Supabase Authorization Release Gate',
  description,
  ...(siteUrl ? {
    metadataBase: new URL(siteUrl),
    alternates: { canonical: siteUrl },
  } : {}),
  robots: { index: true, follow: true },
  openGraph: {
    title: 'RLSProof — Supabase Authorization Release Gate',
    description,
    type: 'website',
    ...(siteUrl ? { url: siteUrl } : {}),
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
