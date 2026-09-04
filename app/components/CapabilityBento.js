const capabilities = [
  {
    kicker: 'PR gate',
    title: 'Block unsafe changes before merge.',
    body: 'Run deterministic checks on every pull request and expose a release signal developers can act on before code reaches production.',
    detail: 'GitHub Action · commit-scoped evidence',
    featured: true,
  },
  {
    kicker: 'Tenant proof',
    title: 'Prove who can read and write what.',
    body: 'Exercise Supabase access rules across identities and operations so tenant isolation is demonstrated instead of inferred.',
    detail: 'anon · tenant A · tenant B · privileged',
  },
  {
    kicker: 'Drift signal',
    title: 'Treat authorization drift like a release event.',
    body: 'Surface when database posture changes outside the expected migration and review trail instead of discovering it after launch.',
    detail: 'schema · policy · migration context',
  },
  {
    kicker: 'Verification loop',
    title: 'A fix only counts after the proof passes again.',
    body: 'Carry the same evidence forward after remediation so the release decision is tied to a re-test, not an unchecked patch.',
    detail: 'finding → fix → re-test → gate',
  },
];

export default function CapabilityBento() {
  return (
    <div className="capabilityBento" aria-label="Release-proof capabilities">
      {capabilities.map((item) => (
        <article className={`bentoCard${item.featured ? ' bentoFeatured' : ''}`} key={item.title}>
          <div className="bentoTopline">
            <span className="bentoKicker">{item.kicker}</span>
            <span className="bentoMark" aria-hidden="true">↗</span>
          </div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <div className="bentoDetail">{item.detail}</div>
        </article>
      ))}
    </div>
  );
}
