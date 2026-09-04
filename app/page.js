import Link from 'next/link';
import ScannerForm from './components/ScannerForm.js';
import ProductConsole from './components/ProductConsole.js';
import CapabilityBento from './components/CapabilityBento.js';
import PricingSection from './components/PricingSection.js';
import FaqSection from './components/FaqSection.js';

const proofRows = [
  ['Anonymous', 'profiles', 'DENY', 'DENY', 'DENY', 'DENY'],
  ['Tenant A user', 'tenant_a rows', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW'],
  ['Tenant B user', 'tenant_a rows', 'DENY', 'DENY', 'DENY', 'DENY'],
  ['Support role', 'tenant_a rows', 'SCOPED', 'DENY', 'DENY', 'DENY'],
];

const workflow = [
  ['01', 'Connect', 'Add the release gate to CI and point DB proof at a disposable Supabase test environment when required.'],
  ['02', 'Prove', 'Run deterministic code checks plus identity-by-operation authorization tests with explicit coverage.'],
  ['03', 'Fix', 'Turn each blocking finding into a scoped remediation task with evidence and verification criteria.'],
  ['04', 'Re-test', 'Run the same proof again after the change so a patch is not mistaken for a verified fix.'],
  ['05', 'Gate', 'Ship only when the checks that were actually in scope produce an acceptable release signal.'],
];

export default function Home() {
  const checkoutUrl = process.env.AUDIT_CHECKOUT_URL ?? '';

  return (
    <main>
      <header className="siteHeader shell">
        <Link href="/" className="brand" aria-label="RLSProof staging home">
          <span className="brandMark" aria-hidden="true">R</span>
          <span>RLSProof</span>
        </Link>
        <nav className="desktopNav" aria-label="Primary navigation">
          <a href="#product">Product</a>
          <a href="#proof">Proof</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="headerActions">
          <a className="textLink" href="https://github.com/psycholog1sts/personal-app" target="_blank" rel="noreferrer">GitHub Action</a>
          <a className="headerCta" href="#scan">Run free scan</a>
        </div>
      </header>

      <section className="hero shell" id="product">
        <div className="heroCopy">
          <p className="eyebrow">Authorization evidence for AI-built Supabase apps</p>
          <h1>Ship Supabase changes with proof, not hope.</h1>
          <p className="heroText">
            Catch cross-tenant access mistakes before release. Run a deterministic gate on pull requests, add real Supabase DB proof when the scope requires it, and re-test fixes against the same evidence.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="#scan">Run free assessment</a>
            <a className="secondaryButton" href="#proof">Inspect sample proof</a>
          </div>
          <div className="heroTrust" aria-label="Product trust properties">
            <div><strong>Browser-first</strong><span>public quick scan</span></div>
            <div><strong>Commit-scoped</strong><span>release evidence</span></div>
            <div><strong>Explicit</strong><span>coverage, never implied</span></div>
          </div>
        </div>
        <div className="heroProduct">
          <div className="consoleHalo" aria-hidden="true" />
          <ProductConsole />
        </div>
      </section>

      <section className="proofStrip" aria-label="Current product capabilities">
        <div className="shell proofStripGrid">
          <div><span className="proofStripIcon" aria-hidden="true">◉</span><div><strong>Browser-only quick assessment</strong><span>No RLSProof source upload for the public scan.</span></div></div>
          <div><span className="proofStripIcon" aria-hidden="true">◇</span><div><strong>GitHub Action release gate</strong><span>Runs where pull requests and deploy decisions happen.</span></div></div>
          <div><span className="proofStripIcon" aria-hidden="true">▦</span><div><strong>Supabase DB proof</strong><span>Official CLI + pgTAP path when database proof is in scope.</span></div></div>
          <div><span className="proofStripIcon" aria-hidden="true">✓</span><div><strong>Skipped is not pass</strong><span>Incomplete coverage stays visible in the release signal.</span></div></div>
        </div>
      </section>

      <section className="section shell capabilitySection">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="eyebrow">Built for release decisions</p>
            <h2>Generic scanners find issues. Release proof answers whether this change should ship.</h2>
          </div>
          <p>Use commodity scanners where they are strong. Add the missing authorization layer around Supabase identities, operations, negative controls and verification.</p>
        </div>
        <CapabilityBento />
      </section>

      <section className="section shell scanSection" id="scan">
        <div className="scanSectionCopy">
          <p className="eyebrow">Try the acquisition layer</p>
          <h2>Start with a public repository. See the signal before you buy the proof.</h2>
          <p>The free assessment is intentionally bounded. It is useful for surfacing obvious blockers and demonstrating the evidence model—not for declaring an application secure.</p>
          <div className="scanAssurances">
            <span>Public GitHub repos only</span>
            <span>Runs in your browser</span>
            <span>Redacted findings</span>
          </div>
        </div>
        <ScannerForm checkoutUrl={checkoutUrl} />
      </section>

      <section className="section shell proofSection" id="proof">
        <div className="sectionHeading proofHeading">
          <div>
            <p className="eyebrow">Authorization proof</p>
            <h2>A green badge is weak evidence. An access matrix is inspectable evidence.</h2>
          </div>
          <p>Sample data below shows the model: identities are tested against resources and operations, including negative controls that should be denied.</p>
        </div>

        <div className="proofFrame">
          <div className="proofFrameTop">
            <div><span className="statusBeacon" aria-hidden="true" /><strong>Tenant isolation matrix</strong></div>
            <div className="proofContext"><span>sample</span><code>8f31c9a</code><span>12 checks</span></div>
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
          <div className="proofCallout">
            <span className="calloutIcon" aria-hidden="true">!</span>
            <div><strong>A skipped test is never a PASS.</strong><p>Coverage, identity, operation and commit context stay attached to the evidence so the result can be challenged and reproduced.</p></div>
          </div>
        </div>
      </section>

      <section className="section shell workflowSection" id="workflow">
        <div className="sectionHeading workflowHeading">
          <div>
            <p className="eyebrow">The retention loop</p>
            <h2>The product runs when the software changes—not when someone remembers to open a scanner.</h2>
          </div>
          <p>Embedding the gate into CI turns authorization regressions into visible engineering events and gives teams a repeatable path from finding to verified release.</p>
        </div>
        <ol className="workflowRail">
          {workflow.map(([number, title, body]) => (
            <li className="workflowStep" key={number}>
              <span className="workflowNumber">{number}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <PricingSection checkoutUrl={checkoutUrl} />
      <FaqSection />

      <section className="closingCta shell">
        <div>
          <p className="eyebrow">Before the next release</p>
          <h2>Find the authorization mistake while it is still a pull request.</h2>
        </div>
        <a className="primaryButton" href="#scan">Run free assessment</a>
      </section>

      <footer className="footer shell">
        <div>
          <Link href="/" className="footerBrand">RLSProof</Link>
          <p>Temporary staging codename. Security-development aid, not a penetration test or compliance certification.</p>
        </div>
        <div className="footerLinks">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="https://github.com/psycholog1sts/personal-app" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </main>
  );
}
