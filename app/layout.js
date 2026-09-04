import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

export const metadata = {
  title: 'RLSProof — Supabase Tenant Isolation Release Gate',
  description: 'Continuous Supabase authorization proof for AI-built apps: tenant isolation evidence, explicit coverage, GitHub release gating, and fix re-testing before deployment.',
  keywords: ['Supabase RLS', 'tenant isolation', 'release gate', 'authorization testing', 'AI-built apps', 'GitHub Action'],
  ...(siteUrl ? {
    metadataBase: new URL(siteUrl),
    alternates: { canonical: siteUrl },
  } : {}),
  robots: { index: true, follow: true },
  openGraph: {
    title: 'RLSProof — Supabase Tenant Isolation Release Gate',
    description: 'Prove Supabase authorization boundaries before a pull request or deploy becomes a production incident.',
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
