const evidenceValues = [
  ['commit', '8f31c9a'],
  ['scope', 'app + migrations'],
  ['staticEngines', 'Native · Gitleaks · OSV · Opengrep'],
  ['dbProof', 'Supabase CLI · pgTAP'],
  ['verification', 'fix → re-test'],
];

export default function EvidencePanel({ copy }) {
  return (
    <section className="bentoPanel evidencePanel" aria-labelledby="evidence-title">
      <div className="panelTitleRow">
        <div><p className="panelKicker">{copy.kicker}</p><h3 id="evidence-title">{copy.title}</h3></div>
        <span className="sampleBadge">{copy.sampleBadge}</span>
      </div>
      <dl className="evidenceList">
        {evidenceValues.map(([key, value]) => <div key={key}><dt>{copy.labels[key]}</dt><dd>{key === 'commit' ? <code>{value}</code> : value}</dd></div>)}
      </dl>
      <p className="panelFootnote">{copy.footnote}</p>
    </section>
  );
}
