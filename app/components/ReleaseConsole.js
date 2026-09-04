const checkStates = ['EXECUTED', 'EXECUTED', 'EXECUTED', 'EXECUTED'];

export default function ReleaseConsole({ copy }) {
  return (
    <section className="releaseConsole" aria-label={copy.ariaLabel}>
      <div className="consoleChrome" aria-hidden="true">
        <span /><span /><span />
        <code>release / checkout-refactor #184</code>
      </div>
      <div className="consoleTopline">
        <div>
          <p className="panelKicker">{copy.kicker}</p>
          <h2>{copy.title}</h2>
        </div>
        <span className="gatePill gateClear">CLEAR</span>
      </div>

      <div className="headlineMetric">
        <div>
          <span className="metricValue">0</span>
          <span className="metricLabel">{copy.leaksLabel}</span>
        </div>
        <div className="metricAside">
          <strong>18 / 18</strong>
          <span>{copy.requiredExecuted}</span>
        </div>
      </div>

      <div className="consoleCheckList">
        {copy.checks.map((check, index) => (
          <div className="consoleCheck" key={check.id}>
            <span className="checkMark" aria-hidden="true">✓</span>
            <div><strong>{check.label}</strong><span>{check.detail}</span></div>
            <b>{checkStates[index]}</b>
          </div>
        ))}
      </div>

      <div className="consoleFooter">
        <span>{copy.commitLabel} <code>8f31c9a</code></span>
        <span>{copy.evidenceScope} <strong>{copy.sample}</strong></span>
      </div>
    </section>
  );
}
