import Link from 'next/link';

export const metadata = { title: 'Privacy — Guardian' };

export default function PrivacyPage() {
  return (
    <main className="shell legal">
      <p className="eyebrow">Guardian</p>
      <h1>Privacy</h1>
      <p>Last updated: September 3, 2026.</p>
      <h2>What the free scan processes</h2>
      <p>Guardian Quick Scan accepts a public GitHub repository identifier, requests a bounded set of eligible public source files from GitHub, scans them in a temporary directory, returns normalized findings, and deletes the temporary directory after the request completes.</p>
      <h2>What we do not intentionally retain</h2>
      <p>The Quick Scan application does not intentionally persist repository source files, GitHub blob contents, or raw secrets in an application database. Findings are designed to omit secret values. Hosting and network providers may still retain normal operational logs according to their own policies.</p>
      <h2>Data sent to third parties</h2>
      <p>GitHub receives the repository API requests needed to retrieve public content. If you purchase a paid service, the payment provider receives the information necessary to process that transaction. Guardian does not use a paid AI model for the free scan.</p>
      <h2>Limits</h2>
      <p>Do not submit private credentials, tokens, or repositories you are not authorized to assess. The free scan supports public GitHub repositories only.</p>
      <p><Link href="/">Return to Guardian</Link></p>
    </main>
  );
}
