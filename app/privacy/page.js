import Link from 'next/link';

export const metadata = { title: 'Privacy — RLSProof' };

export default function PrivacyPage() {
  return (
    <main className="shell legal">
      <p className="eyebrow">RLSProof</p>
      <h1>Privacy</h1>
      <p>Last updated: September 4, 2026.</p>
      <h2>What the free scan processes</h2>
      <p>RLSProof Quick Scan runs in your browser. Your browser requests a bounded set of eligible public source files directly from the GitHub API, keeps the selected content in browser memory while the scan runs, and produces normalized findings locally.</p>
      <h2>What RLSProof does not intentionally receive or retain</h2>
      <p>The RLSProof site does not intentionally receive or persist repository source files, GitHub blob contents, or raw secrets for the free Quick Scan. Findings are designed to omit secret values. The static site host and network providers may still retain ordinary request logs according to their own policies.</p>
      <h2>Data sent to third parties</h2>
      <p>GitHub receives the API requests needed to retrieve public repository content. If you purchase a paid service, the payment provider receives the information necessary to process that transaction. RLSProof does not use a paid AI model for the free scan.</p>
      <h2>Limits</h2>
      <p>Do not submit private credentials, tokens, or repositories you are not authorized to assess. The free scan supports public GitHub repositories only and is intentionally bounded; it is not a penetration test, certification, or complete security review.</p>
      <p><Link href="/">Return to RLSProof</Link></p>
    </main>
  );
}
