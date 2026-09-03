import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata = {
  title: 'Guardian — AI App Production Readiness',
  description: 'Free bounded security and production-readiness scan for public GitHub repositories built with AI tools and Supabase.',
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Guardian — AI App Production Readiness',
    description: 'Find obvious security blockers in AI-built apps before launch.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
