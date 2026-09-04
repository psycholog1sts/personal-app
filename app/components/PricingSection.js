const plans = [
  {
    name: 'Quick Scan', price: '$0', badge: 'Acquisition',
    body: 'Bounded public-repository checks with Supabase-focused evidence. No account required.',
    items: ['Public repositories', 'Browser-side analysis', 'Partial coverage disclosed'],
  },
  {
    name: 'Continuous Guard', price: 'Private beta', badge: 'Recurring proof',
    body: 'Private-repository release gates, DB proof, drift visibility and regression history.',
    items: ['Every pull request', 'Every deploy', 'Required DB proof modes'],
  },
];

export default function PricingSection({ checkoutUrl }) {
  return (
    <section className="section shell" id="pricing" aria-labelledby="pricing-title">
      <div className="sectionHeading splitHeading">
        <div><p className="eyebrow">Pricing hypotheses</p><h2 id="pricing-title">Free finds risk. Paid keeps proving the boundary.</h2></div>
        <p>Recurring and service pricing remain validation hypotheses until real buyers confirm willingness to pay.</p>
      </div>
      <div className="pricingGrid">
        {plans.map((plan) => (
          <article className="priceCard" key={plan.name}>
            <span className="priceBadge">{plan.badge}</span><h3>{plan.name}</h3><p className="price">{plan.price}</p><p>{plan.body}</p>
            <ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul>
            {plan.name === 'Quick Scan' ? <a className="secondaryButton fullButton" href="#scan">Scan a repository</a> : <span className="disabledButton fullButton" aria-disabled="true">Beta pricing being validated</span>}
          </article>
        ))}
        <article className="priceCard featuredPrice">
          <span className="priceBadge">Human-reviewed service</span><h3>Launch Verification</h3><p className="price">$149 <small>validation price</small></p>
          <p>Full scanner coverage, reviewed findings and a fix → re-test evidence report before launch.</p>
          <ul><li>Pinned external engines</li><li>Reviewed remediation</li><li>Verification report</li></ul>
          {checkoutUrl ? <a className="primaryButton fullButton" href={checkoutUrl} rel="noreferrer">Buy launch verification</a> : <span className="disabledButton fullButton" aria-disabled="true">Payment activation pending</span>}
        </article>
      </div>
    </section>
  );
}
