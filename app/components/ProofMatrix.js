function stateClass(value) {
  return ['ALLOW', 'DENY', 'SCOPED'].includes(value) ? `matrixState matrix-${value.toLowerCase()}` : '';
}

export default function ProofMatrix({ copy }) {
  return (
    <section className="section shell" id="proof" aria-labelledby="proof-title">
      <div className="sectionHeading splitHeading">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="proof-title">{copy.title}</h2>
        </div>
        <p>{copy.body}</p>
      </div>

      <div className="proofFrame">
        <div className="proofFrameHead">
          <div><span className="liveDot" aria-hidden="true" /><strong>{copy.matrixTitle}</strong></div>
          <span className="sampleBadge">{copy.sampleBadge}</span>
        </div>
        <div className="proofMatrix" role="region" aria-label={copy.regionLabel} tabIndex="0">
          <table>
            <thead>
              <tr><th scope="col">{copy.headers.identity}</th><th scope="col">{copy.headers.target}</th><th scope="col">SELECT</th><th scope="col">INSERT</th><th scope="col">UPDATE</th><th scope="col">DELETE</th></tr>
            </thead>
            <tbody>
              {copy.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.identity}</td>
                  <td>{row.target}</td>
                  {row.states.map((state, index) => <td key={`${row.id}-${index}`}><span className={stateClass(state)}>{state}</span></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="proofRule">
          <span aria-hidden="true">!</span>
          <p><strong>{copy.ruleTitle}</strong> {copy.ruleBody}</p>
        </div>
      </div>
    </section>
  );
}
