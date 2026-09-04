const rows = [
  ['Anonymous', 'tenant_a rows', 'DENY', 'DENY', 'DENY', 'DENY'],
  ['Tenant A user', 'tenant_a rows', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW'],
  ['Tenant B user', 'tenant_a rows', 'DENY', 'DENY', 'DENY', 'DENY'],
  ['Support role', 'tenant_a rows', 'SCOPED', 'DENY', 'DENY', 'DENY'],
];

function stateClass(value) {
  return ['ALLOW', 'DENY', 'SCOPED'].includes(value) ? `matrixState matrix-${value.toLowerCase()}` : '';
}

export default function ProofMatrix() {
  return (
    <section className="section shell" id="proof" aria-labelledby="proof-title">
      <div className="sectionHeading splitHeading">
        <div>
          <p className="eyebrow">Sample proof</p>
          <h2 id="proof-title">Make tenant isolation observable.</h2>
        </div>
        <p>
          A green badge is not evidence. Test identities against the exact rows and operations they should — and should not — reach.
        </p>
      </div>

      <div className="proofFrame">
        <div className="proofFrameHead">
          <div><span className="liveDot" aria-hidden="true" /><strong>Tenant isolation matrix</strong></div>
          <span className="sampleBadge">Example · pgTAP-style proof</span>
        </div>
        <div className="proofMatrix" role="region" aria-label="Example tenant isolation access matrix" tabIndex="0">
          <table>
            <thead>
              <tr><th scope="col">Identity</th><th scope="col">Target</th><th scope="col">SELECT</th><th scope="col">INSERT</th><th scope="col">UPDATE</th><th scope="col">DELETE</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.join('-')}>
                  {row.map((cell, index) => index < 2
                    ? <td key={`${cell}-${index}`}>{cell}</td>
                    : <td key={`${cell}-${index}`}><span className={stateClass(cell)}>{cell}</span></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="proofRule">
          <span aria-hidden="true">!</span>
          <p><strong>Negative controls are first-class evidence.</strong> Tenant B reaching Tenant A data blocks the release; a test that never ran cannot produce CLEAR.</p>
        </div>
      </div>
    </section>
  );
}
