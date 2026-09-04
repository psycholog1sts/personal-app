const metrics = [
  ['12/12', 'identity checks'],
  ['0', 'cross-tenant leaks'],
  ['3', 'fixes verified'],
];

const checks = [
  ['Static analysis', 'complete', 'pass'],
  ['Supabase DB proof', 'complete', 'pass'],
  ['Tenant isolation', '12/12', 'pass'],
  ['Coverage', 'complete', 'pass'],
];

const activity = [
  ['10:42', 'PR opened', 'checkout-refactor #184'],
  ['10:43', 'Release gate', 'static checks complete'],
  ['10:44', 'DB proof', 'tenant matrix passed'],
  ['10:47', 'Re-test', '3 fixes verified'],
];

export default function ProductConsole() {
  return (
    <section className="productConsole" aria-label="Sample release proof console">
      <div className="consoleChrome">
        <div className="consoleDots" aria-hidden="true"><span /><span /><span /></div>
        <span className="consoleMode">sample release proof</span>
        <span className="consoleCommit">8f31c9a</span>
      </div>

      <div className="consoleBody">
        <div className="consoleHeading">
          <div>
            <p className="panelLabel">Pull request</p>
            <h2>checkout-refactor <span>#184</span></h2>
            <p className="consoleMeta">Supabase · production candidate · commit 8f31c9a</p>
          </div>
          <span className="statePill statePass"><span className="stateDot" aria-hidden="true" />PASS</span>
        </div>

        <div className="consoleMetricGrid" aria-label="Sample release metrics">
          {metrics.map(([value, label]) => (
            <div className="consoleMetric" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="consoleSplit">
          <div className="consoleChecks">
            <div className="consoleSectionTitle">
              <span>Proof coverage</span>
              <span className="coverageBadge">4 / 4 executed</span>
            </div>
            {checks.map(([label, value, state]) => (
              <div className="consoleCheck" key={label}>
                <span className={`checkIcon check-${state}`} aria-hidden="true">✓</span>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="consoleActivity">
            <div className="consoleSectionTitle"><span>Evidence timeline</span><span>UTC</span></div>
            <ol>
              {activity.map(([time, title, body]) => (
                <li key={`${time}-${title}`}>
                  <time>{time}</time>
                  <div><strong>{title}</strong><span>{body}</span></div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="consoleFooter">
          <span><span className="lockGlyph" aria-hidden="true">◇</span> scoped evidence</span>
          <span>Sample data — not a customer result</span>
        </div>
      </div>
    </section>
  );
}
