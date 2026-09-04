import ReleaseConsole from './ReleaseConsole.js';

const trustItems = [
  ['Deterministic', 'PASS / FAIL comes from executed checks, not an AI opinion.'],
  ['Explicit coverage', 'Skipped and unavailable controls stay visible.'],
  ['Private by design', 'Quick Scan stays in the browser; CI runs in your runner.'],
];

export default function HeroCommandCenter() {
  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="heroCopy">
        <p className="eyebrow">Supabase authorization release control</p>
        <h1 id="hero-title">Can User B access User A’s data?</h1>
        <p className="heroText">
          Prove the boundary before it ships. Run a deterministic release gate on every pull request and every deploy,
          catch policy drift, expose what actually executed, then fix and re-test the same authorization proof.
        </p>
        <div className="heroActions">
          <a className="primaryButton" href="#scan">Run free repo scan</a>
          <a className="secondaryButton" href="#proof">Inspect sample proof</a>
        </div>
        <p className="heroDisclaimer">Security-development evidence, not a security certification.</p>
        <div className="heroTrustGrid" aria-label="Product trust properties">
          {trustItems.map(([title, body]) => (
            <div key={title}><strong>{title}</strong><span>{body}</span></div>
          ))}
        </div>
      </div>
      <div className="heroProduct">
        <div className="productHalo" aria-hidden="true" />
        <ReleaseConsole />
        <div className="heroMiniGrid" aria-label="Sample proof summary">
          <div><span>RLS proof</span><strong>12 / 12</strong><small>executed</small></div>
          <div><span>Regression</span><strong>0</strong><small>blockers</small></div>
          <div><span>Re-test</span><strong>3</strong><small>fixes verified</small></div>
        </div>
      </div>
    </section>
  );
}
