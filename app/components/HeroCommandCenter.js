import ReleaseConsole from './ReleaseConsole.js';

export default function HeroCommandCenter({ copy, releaseConsoleCopy }) {
  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="heroCopy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="hero-title">{copy.title}</h1>
        <p className="heroText">{copy.body}</p>
        <div className="heroActions">
          <a className="primaryButton" href="#scan">{copy.primaryCta}</a>
          <a className="secondaryButton" href="#proof">{copy.secondaryCta}</a>
        </div>
        <p className="heroDisclaimer">{copy.disclaimer}</p>
        <div className="heroTrustGrid" aria-label={copy.trustLabel}>
          {copy.trustItems.map((item) => (
            <div key={item.id}><strong>{item.title}</strong><span>{item.body}</span></div>
          ))}
        </div>
      </div>
      <div className="heroProduct">
        <div className="productHalo" aria-hidden="true" />
        <ReleaseConsole copy={releaseConsoleCopy} />
        <div className="heroMiniGrid" aria-label={copy.summaryLabel}>
          {copy.summary.map((item) => (
            <div key={item.id}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div>
          ))}
        </div>
      </div>
    </section>
  );
}
