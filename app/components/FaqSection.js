const faqs = [
  ['What does the free assessment actually check?', 'It runs a bounded browser-side pass over selected public-repository files for Supabase-focused production risks, including access-control patterns, risky service-role usage, eval, and SQL/RLS signals. It is intentionally not full coverage.'],
  ['Does repository source code leave the browser?', 'The public quick assessment fetches bounded public GitHub content directly in the browser. The static site does not upload that source to an RLSProof application server. GitHub still serves the repository content because it is the source host.'],
  ['Is this a penetration test or security certification?', 'No. The product is a security-development and release-evidence tool. A PASS means the checks that were explicitly in scope executed successfully; it is not a penetration-test report, compliance attestation, or guarantee that an application is secure.'],
  ['Why use this if GitHub already scans secrets and dependencies?', 'Generic secrets, dependency and SAST coverage are valuable and increasingly commoditized. The differentiated layer is Supabase authorization proof: identities, operations, negative controls, DB tests, explicit coverage and re-test evidence tied to a release.'],
  ['What does Supabase DB proof require?', 'The DB-proof mode uses the official Supabase CLI and pgTAP-style database tests when they exist in the project. In required mode, missing tests, a missing CLI, or a failing suite cannot be silently converted into PASS.'],
  ['What happens when a check cannot run?', 'Coverage becomes incomplete. The release signal stays honest about what did and did not execute. A skipped or unavailable proof is never represented as a successful check.'],
];

export default function FaqSection() {
  return (
    <section className="section shell faqSection" id="faq">
      <div className="sectionHeading faqHeading">
        <div>
          <p className="eyebrow">Before you rely on the signal</p>
          <h2>Clear scope beats security theatre.</h2>
        </div>
        <p>Every result should make it obvious what ran, what did not run, and what a team still needs to verify before release.</p>
      </div>
      <div className="faqList">
        {faqs.map(([question, answer], index) => (
          <details className="faqItem" key={question} open={index === 0}>
            <summary><span>{question}</span><span className="faqPlus" aria-hidden="true">+</span></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
