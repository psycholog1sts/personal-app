const faqs = [
  ['Does AI decide whether a release is safe?', 'No. AI can help explain findings or draft remediation. Release states come from deterministic checks, observed authorization tests and explicit coverage.'],
  ['Does my repository source get uploaded?', 'The public Quick Scan runs in the browser. The full action runs in your GitHub runner. The product direction avoids requiring source upload to a hosted scanner backend.'],
  ['What happens when a scanner or DB test cannot run?', 'It is reported as skipped, unavailable or incomplete according to the configured mode. Missing execution is not converted into PASS.'],
  ['Can DB proof run against my production database?', 'It should not. Authorization fixtures belong in a disposable, local or dedicated test Supabase/Postgres environment. Do not run destructive proof fixtures against a production database.'],
  ['Is this a security certification?', 'No. It is a development-time authorization evidence and release-gate system, not a penetration test, compliance certification or guarantee of security.'],
];

export default function FaqSection() {
  return (
    <section className="section shell faqSection" id="faq" aria-labelledby="faq-title">
      <div className="sectionHeading"><p className="eyebrow">Technical FAQ</p><h2 id="faq-title">The objections a security gate should answer directly.</h2></div>
      <div className="faqList">
        {faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}
      </div>
    </section>
  );
}
