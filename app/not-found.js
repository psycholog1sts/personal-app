import Link from 'next/link';

export const metadata = {
  title: 'Page not found — RLSProof',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="shell legal notFoundPage">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you requested does not exist or has moved.</p>
      <p><Link href="/">Return to RLSProof</Link></p>
    </main>
  );
}
