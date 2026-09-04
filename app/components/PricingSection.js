export default function PricingSection({ checkoutUrl, copy }) {
  const plans = [copy.quickScan, copy.continuous];

  return (
    <section className="section shell" id="pricing" aria-labelledby="pricing-title">
      <div className="sectionHeading splitHeading">
        <div><p className="eyebrow">{copy.eyebrow}</p><h2 id="pricing-title">{copy.title}</h2></div>
        <p>{copy.body}</p>
      </div>
      <div className="pricingGrid">
        {plans.map((plan) => (
          <article className="priceCard" key={plan.name}>
            <span className="priceBadge">{plan.badge}</span><h3>{plan.name}</h3><p className="price">{plan.price}</p><p>{plan.body}</p>
            <ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul>
            {plan === copy.quickScan
              ? <a className="secondaryButton fullButton" href="#scan">{plan.cta}</a>
              : <span className="disabledButton fullButton" aria-disabled="true">{plan.cta}</span>}
          </article>
        ))}
        <article className="priceCard featuredPrice">
          <span className="priceBadge">{copy.launch.badge}</span><h3>{copy.launch.name}</h3><p className="price">{copy.launch.price} <small>{copy.launch.priceNote}</small></p>
          <p>{copy.launch.body}</p>
          <ul>{copy.launch.items.map((item) => <li key={item}>{item}</li>)}</ul>
          {checkoutUrl ? <a className="primaryButton fullButton" href={checkoutUrl} rel="noreferrer">{copy.launch.buy}</a> : <span className="disabledButton fullButton" aria-disabled="true">{copy.launch.pending}</span>}
        </article>
      </div>
    </section>
  );
}
