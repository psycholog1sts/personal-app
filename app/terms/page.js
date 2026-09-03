import Link from 'next/link';

export const metadata = { title: 'Terms — Guardian' };

export default function TermsPage() {
  return (
    <main className="shell legal">
      <p className="eyebrow">Guardian</p>
      <h1>Terms</h1>
      <p>Last updated: September 3, 2026.</p>
      <h2>Authorized use only</h2>
      <p>You may submit only repositories you are authorized to assess. The free service is limited to public GitHub repositories and is intended for defensive software-development use.</p>
      <h2>No security certification</h2>
      <p>Guardian is an engineering aid. A clean result does not prove that software is secure, compliant, free of vulnerabilities, or safe to deploy. Quick Scan intentionally performs partial static checks and marks its coverage incomplete.</p>
      <h2>Paid services</h2>
      <p>Any paid audit or remediation engagement is limited to the scope stated at purchase or in the accompanying written scope. Findings and recommendations are based on the code and evidence available at the time of review.</p>
      <h2>Availability</h2>
      <p>The service may reject repositories that exceed resource limits, API quotas, or safety constraints. Features and limits may change as the product is validated and improved.</p>
      <h2>Responsible use</h2>
      <p>Do not use Guardian to access private systems without authorization, expose credentials, evade access controls, or perform harmful activity.</p>
      <p><Link href="/">Return to Guardian</Link></p>
    </main>
  );
}
