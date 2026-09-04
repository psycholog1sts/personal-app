const findingMeta = [
  { id: 'update-boundary', severity: 'HIGH', category: 'RLS', path: 'supabase/migrations/041_orders.sql:86', state: 'BLOCKS RELEASE' },
  { id: 'auth-role', severity: 'MEDIUM', category: 'AUTH', path: 'supabase/migrations/038_profiles.sql:41', state: 'REVIEW' },
  { id: 'profile-retest', severity: 'VERIFIED', category: 'RE-TEST', path: 'proof/tenant-isolation.sql', state: 'VERIFIED' },
];

export default function FindingsExplorer({ copy }) {
  const findings = findingMeta.map((meta) => ({ ...meta, ...copy.items.find((item) => item.id === meta.id) }));

  return (
    <section className="section shell evidenceSection" aria-labelledby="findings-title">
      <div className="sectionHeading">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="findings-title">{copy.title}</h2>
      </div>
      <div className="findingsExplorer">
        <div className="explorerToolbar">
          <div><span className="sampleBadge">{copy.sampleBadge}</span><strong>checkout-refactor #184</strong></div>
          <div className="filterChips" aria-label={copy.filtersLabel}>
            {copy.filters.map((filter) => <span key={filter.id}>{filter.label}</span>)}
          </div>
        </div>
        <div className="explorerList">
          {findings.map((finding) => (
            <article className="explorerFinding" key={finding.id}>
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
