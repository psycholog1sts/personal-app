import Link from 'next/link';
import ScannerForm from './components/ScannerForm.js';

const checks = [
  ['Supabase access-control risk', 'Public tables created without RLS and service-role exposure in application code.'],
  ['Secret exposure', 'Committed environment files and sensitive Supabase credentials in application code.'],
  ['Dangerous execution', 'Dynamic eval usage that can turn runtime input into executable code.'],
];

export default function Home() {
  const checkoutUrl = process.env.AUDIT_CHECKOUT_URL ?? '';

  return (
    <main>
      <header className="siteHeader shell">
        <Link href="/" className="brand" aria-label="RLSProof home">RLSProof</Link>
        <nav aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </header>

      <section className="hero shell">
        <div className="heroCopy">
          <p className="eyebrow">Supabase access-control proof for AI-built apps</p>
          <h1>Find launch-blocking access-control mistakes before your Supabase app goes live.</h1>
          <p className="heroText">
            Paste a public GitHub repository. RLSProof performs a bounded static scan for common Supabase RLS,
            credential and JavaScript production risks, then shows the evidence and the next fix.
          </p>
          <div className="trustRow" aria-label="Product properties">
            <span>No signup</span>
            <span>No paid AI API</span>
            <span>No source retention</span>
          </div>
        </div>
        <ScannerForm checkoutUrl={checkoutUrl} />
      </section>

      <section className="section shell" id="how-it-works">
        <div className="sectionHeading">
          <p className="eyebrow">What the free scan checks</p>
          <h2>A narrow Supabase-focused check that tells the truth about its coverage.</h2>
          <p>We do not call a limited scan a security certification. The report explicitly marks coverage as incomplete.</p>
        </div>
        <div className="featureGrid">
          {checks.map(([title, body]) => (
            <article className="featureCard" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell pricing" id="pricing">
        <div className="sectionHeading">
          <p className="eyebrow">From quick signal to verified release</p>
          <h2>Use the free scan first. Pay only when you need deeper verification.</h2>
        </div>
        <div className="pricingGrid">
          <article className="priceCard">
            <p className="priceLabel">Quick Scan</p>
            <p className="price">$0</p>
            <p>Bounded public-repository scan with Supabase-focused evidence and remediation guidance.</p>
            <a className="secondaryButton" href="#scan">Scan a repository</a>
          </article>
          <article className="priceCard featured">
            <p className="priceLabel">Launch Audit</p>
            <p className="price">$149</p>
            <p>Full Gitleaks, OSV-Scanner and Opengrep coverage plus reviewed findings and a verification report.</p>
            {checkoutUrl ? (
              <a className="primaryButton" href={checkoutUrl} rel="noreferrer">Buy launch audit</a>
            ) : (
              <span className="disabledButton" aria-disabled="true">Checkout being configured</span>
            )}
          </article>
          <article className="priceCard">
            <p className="priceLabel">Fix &amp; Verify</p>
            <p className="price">$499</p>
            <p>Remediation implementation, re-scan evidence, and a release-gate verification pass.</p>
            <p className="smallMuted">Offered after audit scope is confirmed.</p>
          </article>
        </div>
      </section>

      <footer className="footer shell">
        <p>RLSProof is a security-development aid, not a penetration test or compliance certification.</p>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </footer>
    </main>
  );
}
