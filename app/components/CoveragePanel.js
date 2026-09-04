const coverage = [
  ['Executed', '16', 'Controls with an observed result'],
  ['Passed', '15', 'Executed controls meeting the expectation'],
  ['Failed', '0', 'Observed security expectation failures'],
  ['Skipped', '1', 'Configured but not executed'],
  ['Unavailable', '1', 'Required capability missing'],
];

export default function CoveragePanel() {
  return (
    <section className="bentoPanel coveragePanel" aria-labelledby="coverage-title">
      <div className="panelTitleRow">
        <div><p className="panelKicker">Example incomplete run</p><h3 id="coverage-title">Coverage ledger</h3></div>
        <span className="gatePill gateIncomplete">INCOMPLETE</span>
      </div>
      <div className="coverageLedger">
        {coverage.map(([label, value, detail]) => (
          <div key={label}><strong>{value}</strong><span>{label}</span><small>{detail}</small></div>
        ))}
      </div>
      <p className="coverageRule"><strong>Skipped or Unavailable coverage is never a PASS.</strong> Missing proof remains visible and can block a required gate.</p>
    </section>
  );
}
