import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata = {
  title: 'RLSProof — Supabase Access-Control Proof',
  description: 'Free bounded Supabase-focused security and production-readiness scan for public GitHub repositories built with AI tools.',
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'RLSProof — Supabase Access-Control Proof',
    description: 'Find access-control and production blockers in AI-built Supabase apps before launch.',
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
