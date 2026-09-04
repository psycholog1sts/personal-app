const findings = [
  {
    severity: 'HIGH', category: 'RLS', title: 'Cross-tenant UPDATE predicate is broader than SELECT',
    path: 'supabase/migrations/041_orders.sql:86', detail: 'Tenant identity is checked in USING, but the write boundary lacks an equivalent WITH CHECK constraint.',
    state: 'BLOCKS RELEASE',
  },
  {
    severity: 'MEDIUM', category: 'AUTH', title: 'Deprecated auth.role() authorization branch',
    path: 'supabase/migrations/038_profiles.sql:41', detail: 'Replace deprecated role branching with explicit identity claims and a policy that can be exercised by tests.',
    state: 'REVIEW',
  },
  {
    severity: 'VERIFIED', category: 'RE-TEST', title: 'Profile tenant predicate re-tested',
    path: 'proof/tenant-isolation.sql', detail: 'The original negative control was repeated after remediation and Tenant B remained denied.',
    state: 'VERIFIED',
  },
];

const filters = ['Critical', 'High', 'Medium', 'RLS', 'Secrets', 'Dependencies'];

export default function FindingsExplorer() {
  return (
    <section className="section shell evidenceSection" aria-labelledby="findings-title">
      <div className="sectionHeading">
        <p className="eyebrow">Finding → remediation → proof</p>
        <h2 id="findings-title">Turn a blocker into a reproducible engineering task.</h2>
      </div>
      <div className="findingsExplorer">
        <div className="explorerToolbar">
          <div><span className="sampleBadge">Sample findings</span><strong>checkout-refactor #184</strong></div>
          <div className="filterChips" aria-label="Example finding filters">
            {filters.map((filter) => <span key={filter}>{filter}</span>)}
          </div>
        </div>
        <div className="explorerList">
          {findings.map((finding) => (
            <article className="explorerFinding" key={finding.title}>
              <div className="findingMeta">
                <span className={`severityBadge severity-${finding.severity.toLowerCase()}`}>{finding.severity}</span>
                <span>{finding.category}</span>
                <code>{finding.path}</code>
              </div>
              <div className="findingBody"><h3>{finding.title}</h3><p>{finding.detail}</p></div>
              <span className="findingState">{finding.state}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
