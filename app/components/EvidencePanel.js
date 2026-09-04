const evidence = [
  ['Commit', '8f31c9a'],
  ['Scope', 'app + migrations'],
  ['Static engines', 'Native · Gitleaks · OSV · Opengrep'],
  ['DB proof', 'Supabase CLI · pgTAP'],
  ['Verification', 'fix → re-test'],
];

export default function EvidencePanel() {
  return (
    <section className="bentoPanel evidencePanel" aria-labelledby="evidence-title">
      <div className="panelTitleRow">
        <div><p className="panelKicker">Sample evidence chain</p><h3 id="evidence-title">Reproduce the result</h3></div>
        <span className="sampleBadge">Example</span>
      </div>
      <dl className="evidenceList">
        {evidence.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{label === 'Commit' ? <code>{value}</code> : value}</dd></div>)}
      </dl>
      <p className="panelFootnote">A report is useful only when its commit, scope, coverage and verification path can be challenged later.</p>
    </section>
  );
}
