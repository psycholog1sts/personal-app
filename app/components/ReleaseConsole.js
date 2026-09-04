const checks = [
  ['Static security', 'EXECUTED', 'Native + pinned engines'],
  ['Tenant isolation', 'EXECUTED', '12 identity / operation checks'],
  ['Policy drift', 'EXECUTED', 'Migration posture compared'],
  ['Fix verification', 'EXECUTED', '3 remediations re-tested'],
];

export default function ReleaseConsole() {
  return (
    <section className="releaseConsole" aria-label="Sample release gate evidence">
      <div className="consoleChrome" aria-hidden="true">
        <span /><span /><span />
        <code>release / checkout-refactor #184</code>
      </div>
      <div className="consoleTopline">
        <div>
          <p className="panelKicker">Sample release gate</p>
          <h2>Authorization boundary</h2>
        </div>
        <span className="gatePill gateClear">CLEAR</span>
      </div>

      <div className="headlineMetric">
        <div>
          <span className="metricValue">0</span>
          <span className="metricLabel">cross-tenant leaks observed</span>
        </div>
        <div className="metricAside">
          <strong>18 / 18</strong>
          <span>required checks executed</span>
        </div>
      </div>

      <div className="consoleCheckList">
        {checks.map(([label, state, detail]) => (
          <div className="consoleCheck" key={label}>
            <span className="checkMark" aria-hidden="true">✓</span>
            <div><strong>{label}</strong><span>{detail}</span></div>
            <b>{state}</b>
          </div>
        ))}
      </div>

      <div className="consoleFooter">
        <span>Commit <code>8f31c9a</code></span>
        <span>Evidence scope <strong>sample</strong></span>
      </div>
    </section>
  );
}
