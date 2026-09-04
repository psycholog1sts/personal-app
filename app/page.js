import Link from 'next/link';
import ScannerForm from './components/ScannerForm.js';

const workflow = [
  ['Every pull request', 'Scan changed application code and SQL migrations before they merge.'],
  ['Every deploy', 'Re-run the release gate and record exactly what was checked on that commit.'],
  ['Policy drift', 'Detect when the database posture changes without a matching migration or review trail.'],
];

const proofRows = [
  ['Anonymous', 'profiles', 'DENY', 'DENY', 'DENY', 'DENY'],
  ['Tenant A user', 'tenant_a rows', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW'],
  ['Tenant B user', 'tenant_a rows', 'DENY', 'DENY', 'DENY', 'DENY'],
  ['Support role', 'tenant_a rows', 'SCOPED', 'DENY', 'DENY', 'DENY'],
];

const proofSteps = [
  ['01', 'Connect', 'Repository + disposable test database or CI environment.'],
  ['02', 'Prove', 'Run static checks and a tenant isolation access matrix.'],
  ['03', 'Fix', 'Turn each finding into an AI-editor-ready remediation task.'],
  ['04', 'Re-test', 'Run the exact proof again after the change.'],
  ['05', 'Gate', 'Only show PASS for checks that actually executed.'],
];

export default function Home() {
  const checkoutUrl = process.env.AUDIT_CHECKOUT_URL ?? '';

  return (
    <main>
      <header className="siteHeader shell">
        <div className="brandWrap">
          <Link href="/" className="brand" aria-label="RLSProof home">RLSProof</Link>
          <span className="workingName">working name</span>
        </div>
        <nav aria-label="Primary navigation">
          <a href="#proof">Proof model</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </header>

      <section className="hero shell">
        <div className="heroCopy">
          <p className="eyebrow">Continuous release proof for AI-built Supabase apps</p>
          <h1>Can User B access User A’s data?</h1>
          <p className="heroText">
            A one-time scanner cannot answer that reliably. The product direction is a release gate that checks every pull request,
            every deploy and policy drift, then proves tenant isolation, shows the evidence, helps fix it and re-tests before shipping.
          </p>
          <div className="trustRow" aria-label="Product properties">
            <span>Deterministic evidence</span>
            <span>Explicit coverage</span>
            <span>No paid AI API required</span>
            <span>Not a security certification</span>
          </div>
          <div className="heroActions">
            <a className="primaryButton" href="#scan">Run free repo scan</a>
            <a className="secondaryButton" href="#proof">See sample proof</a>
          </div>
        </div>

        <div className="heroStack">
          <div className="releasePanel" aria-label="Example release gate">
            <div className="releasePanelTop">
              <div>
                <p className="panelLabel">Release gate</p>
                <p className="releaseName">checkout-refactor #184</p>
              </div>
              <span className="releasePass">PASS</span>
            </div>
            <div className="releaseMetricGrid">
              <div><strong>12/12</strong><span>identity checks</span></div>
              <div><strong>0</strong><span>cross-tenant leaks</span></div>
              <div><strong>3</strong><span>fixes verified</span></div>
            </div>
            <div className="releaseLine"><span>Static analysis</span><b>complete</b></div>
            <div className="releaseLine"><span>Tenant isolation</span><b>complete</b></div>
            <div className="releaseLine"><span>Policy drift</span><b>complete</b></div>
            <div className="releaseLine"><span>Commit</span><code>8f31c9a</code></div>
          </div>
          <ScannerForm checkoutUrl={checkoutUrl} />
        </div>
      </section>

      <section className="signalStrip">
        <div className="shell signalGrid">
          <div><span className="signalValue">PR</span><span className="signalLabel">pre-merge gate</span></div>
          <div><span className="signalValue">Deploy</span><span className="signalLabel">release evidence</span></div>
          <div><span className="signalValue">Drift</span><span className="signalLabel">database vs migrations</span></div>
          <div><span className="signalValue">Re-test</span><span className="signalLabel">fix verification</span></div>
        </div>
      </section>

      <section className="section shell" id="workflow">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="eyebrow">Why people come back</p>
            <h2>The product runs when the app changes, not when someone remembers to visit a scanner.</h2>
          </div>
          <p>
            The website is acquisition and control plane. Retention comes from embedding the proof into the software lifecycle so a security regression becomes a visible engineering event.
          </p>
        </div>
        <div className="workflowGrid">
          {workflow.map(([title, body], index) => (
            <article className="workflowCard" key={title}>
              <span className="workflowIndex">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell proofSection" id="proof">
        <div className="proofIntro">
          <p className="eyebrow">Sample proof</p>
          <h2>Tenant isolation should be demonstrated as an access matrix, not inferred from a green badge.</h2>
          <p>
            The defensible wedge is Supabase authorization proof: anon, tenant A, tenant B and privileged identities tested against the operations they should and should not perform.
          </p>
        </div>

        <div className="proofMatrix" role="table" aria-label="Example tenant isolation access matrix">
          <div className="proofMatrixRow proofMatrixHead" role="row">
            <span>Identity</span><span>Target</span><span>SELECT</span><span>INSERT</span><span>UPDATE</span><span>DELETE</span>
          </div>
          {proofRows.map((row) => (
            <div className="proofMatrixRow" role="row" key={row.join('-')}>
              {row.map((cell, index) => (
                <span key={`${cell}-${index}`} className={['ALLOW', 'DENY', 'SCOPED'].includes(cell) ? `matrixState matrix-${cell.toLowerCase()}` : ''}>{cell}</span>
              ))}
            </div>
          ))}
        </div>

        <div className="proofNote">
          <span className="proofNoteIcon">!</span>
          <div>
            <strong>A skipped test is never a PASS.</strong>
            <p>Coverage, test identity and commit SHA belong in the report so the result can be reproduced and challenged.</p>
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="sectionHeading">
          <p className="eyebrow">Fix → re-test → release</p>
          <h2>Security work becomes a closed loop instead of a PDF someone forgets.</h2>
        </div>
        <div className="proofTimeline">
          {proofSteps.map(([number, title, body]) => (
            <article key={number} className="timelineStep">
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell differentiation">
        <div className="sectionHeading">
          <p className="eyebrow">Why this can compete globally</p>
          <h2>Do not fight GitHub and a dozen vibe-security scanners on generic SAST.</h2>
          <p>Use mature scanners where they are already strong; own the evidence workflow around Supabase authorization, regressions and verification.</p>
        </div>
        <div className="comparisonGrid">
          <article>
            <span className="comparisonTag mutedTag">Commodity</span>
            <h3>Generic vulnerability list</h3>
            <p>Secrets, dependencies and broad SAST are already crowded and increasingly built into developer platforms.</p>
          </article>
          <article className="comparisonFocus">
            <span className="comparisonTag">Wedge</span>
            <h3>Authorization proof</h3>
            <p>Prove tenant boundaries with identities, read/write operations, negative controls and explicit coverage.</p>
          </article>
          <article>
            <span className="comparisonTag">Retention</span>
            <h3>Regression guard</h3>
            <p>Run on every pull request, deploy and policy drift event so the product protects changes continuously.</p>
          </article>
        </div>
      </section>

      <section className="section shell pricing" id="pricing">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="eyebrow">Monetization logic</p>
            <h2>Free finds risk. Paid proves and keeps proving.</h2>
          </div>
          <p>Prices below remain validation hypotheses until real buyers confirm them; the product must earn payment through recurring evidence, private scope and verified remediation.</p>
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
            <p>Full scanner coverage, reviewed findings and a fix/re-test verification report before launch.</p>
            {checkoutUrl ? (
              <a className="primaryButton" href={checkoutUrl} rel="noreferrer">Buy launch audit</a>
            ) : (
              <span className="disabledButton" aria-disabled="true">Payment activation pending</span>
            )}
          </article>
          <article className="priceCard">
            <p className="priceLabel">Continuous Guard</p>
            <p className="price priceTbd">Private beta</p>
            <p>Private repositories, every pull request and deploy, policy drift, history and regression alerts.</p>
            <p className="smallMuted">Recurring price will be validated before launch.</p>
          </article>
        </div>
      </section>

      <footer className="footer shell">
        <p>RLSProof is a temporary working name. This product is a security-development aid, not a penetration test or compliance certification.</p>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </footer>
    </main>
  );
}
