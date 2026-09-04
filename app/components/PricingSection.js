const launchFeatures = [
  'Gitleaks + OSV-Scanner + Opengrep coverage',
  'Human-reviewed critical and high findings',
  'Scoped Supabase DB proof when testable',
  'One verification pass after agreed fixes',
];

const fixFeatures = [
  'Everything in Launch Proof',
  'Scoped remediation of agreed critical/high issues',
  'Fix-by-fix verification evidence',
  'Final release-proof report tied to a commit',
];

function FeatureList({ items }) {
  return (
    <ul className="planFeatures">
      {items.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
    </ul>
  );
}

export default function PricingSection({ checkoutUrl = '' }) {
  return (
    <section className="section shell commercialSection" id="pricing">
      <div className="sectionHeading pricingHeading">
        <div>
          <p className="eyebrow">Pilot pricing</p>
          <h2>Free finds signals. Paid work closes the release risk.</h2>
        </div>
        <p>
          These are validation-stage pilot offers, not established market prices. The paid scope is human-reviewed evidence,
          verification and remediation—not another automated score.
        </p>
      </div>

      <div className="pricingBento">
        <article className="priceCard priceFree">
          <div className="priceCardTop">
            <p className="priceLabel">Quick Scan</p>
            <span className="planBadge">Self-serve</span>
          </div>
          <p className="priceValue">$0</p>
          <p className="priceDescription">A bounded public-repository assessment that runs in the browser and shows explicit coverage.</p>
          <ul className="planFeatures compactFeatures">
            <li><span aria-hidden="true">✓</span>Public GitHub repositories</li>
            <li><span aria-hidden="true">✓</span>Supabase-focused static checks</li>
            <li><span aria-hidden="true">✓</span>Redacted evidence and remediation guidance</li>
          </ul>
          <a className="secondaryButton fullWidthButton" href="#scan">Run quick assessment</a>
        </article>

        <article className="priceCard priceFeatured">
          <div className="priceCardTop">
            <p className="priceLabel">Launch Proof</p>
            <span className="planBadge planBadgeAccent">Recommended pilot</span>
          </div>
          <div className="priceLine"><p className="priceValue">$499</p><span>pilot</span></div>
          <p className="priceDescription">For a team that needs defensible evidence before shipping a meaningful release.</p>
          <FeatureList items={launchFeatures} />
          {checkoutUrl ? (
            <a className="primaryButton fullWidthButton" href={checkoutUrl} rel="noreferrer">Request Launch Proof</a>
          ) : (
            <span className="disabledButton fullWidthButton" aria-disabled="true">Payment activation pending</span>
          )}
          <p className="priceFootnote">Scope is confirmed before work begins. No certification claim.</p>
        </article>

        <article className="priceCard">
          <div className="priceCardTop">
            <p className="priceLabel">Fix + Verify</p>
            <span className="planBadge">Hands-on pilot</span>
          </div>
          <div className="priceLine"><p className="priceValue">$990</p><span>pilot</span></div>
          <p className="priceDescription">For launches where identified release blockers also need scoped remediation and proof after the change.</p>
          <FeatureList items={fixFeatures} />
          <span className="disabledButton fullWidthButton" aria-disabled="true">Intake opens with payment activation</span>
          <p className="priceFootnote">Only agreed scope is remediated; architecture rewrites are quoted separately.</p>
        </article>

        <article className="priceCard betaCard">
          <div>
            <div className="priceCardTop">
              <p className="priceLabel">Continuous Guard</p>
              <span className="planBadge betaBadge">Private beta</span>
            </div>
            <h3>Recurring proof belongs in CI—not another dashboard tab.</h3>
            <p>Private repositories, release history, policy drift and alerting remain a product-development track. This plan is not for sale yet.</p>
          </div>
          <div className="betaSignals" aria-label="Planned continuous guard capabilities">
            <span>Private repos</span><span>PR history</span><span>Drift alerts</span><span>Team controls</span>
          </div>
        </article>
      </div>
    </section>
  );
}
