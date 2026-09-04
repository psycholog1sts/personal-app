const cards = [
  ['Deterministic gate', 'AI may explain a finding or draft a remediation prompt. It does not decide PASS / FAIL. The gate is derived from executed checks and observed results.'],
  ['Source privacy', 'The public Quick Scan executes in your browser. The full GitHub Action executes in your CI runner; source does not need to be uploaded to a product backend.'],
  ['Scope is explicit', 'Static analysis, DB proof and external engines report their coverage independently. Skipped or unavailable checks remain incomplete, never silently green.'],
  ['Limitations', 'This is a security-development aid and evidence workflow, not a security certification, penetration test, or compliance attestation.'],
];

export default function TrustMethodology() {
  return (
    <section className="section trustSection" id="methodology" aria-labelledby="methodology-title">
      <div className="shell">
        <div className="sectionHeading splitHeading">
          <div><p className="eyebrow">Trust through inspectability</p><h2 id="methodology-title">Show the method, not marketing theater.</h2></div>
          <p>Trust comes from bounded claims, pinned tooling, explicit coverage and evidence that can be reproduced on the same commit.</p>
        </div>
        <div className="trustGrid">
          {cards.map(([title, body], index) => (
            <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
      </div>
    </section>
  );
}
