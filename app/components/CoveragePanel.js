const coverageValues = {
  executed: '16',
  passed: '15',
  failed: '0',
  skipped: '1',
  unavailable: '1',
};

export default function CoveragePanel({ copy }) {
  return (
    <section className="bentoPanel coveragePanel" aria-labelledby="coverage-title">
      <div className="panelTitleRow">
        <div><p className="panelKicker">{copy.kicker}</p><h3 id="coverage-title">{copy.title}</h3></div>
        <span className="gatePill gateIncomplete">INCOMPLETE</span>
      </div>
      <div className="coverageLedger">
        {copy.items.map((item) => (
          <div key={item.id}><strong>{coverageValues[item.id]}</strong><span>{item.label}</span><small>{item.detail}</small></div>
        ))}
      </div>
      <p className="coverageRule"><strong>{copy.ruleTitle}</strong> {copy.ruleBody}</p>
    </section>
  );
}
