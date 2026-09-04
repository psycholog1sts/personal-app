import Link from 'next/link';
import CoveragePanel from './components/CoveragePanel.js';
import EvidencePanel from './components/EvidencePanel.js';
import FaqSection from './components/FaqSection.js';
import FindingsExplorer from './components/FindingsExplorer.js';
import HeroCommandCenter from './components/HeroCommandCenter.js';
import InstallPanel from './components/InstallPanel.js';
import PricingSection from './components/PricingSection.js';
import ProofMatrix from './components/ProofMatrix.js';
import ScannerForm from './components/ScannerForm.js';
import SiteHeader from './components/SiteHeader.js';
import TrustMethodology from './components/TrustMethodology.js';
import WorkflowTimeline from './components/WorkflowTimeline.js';

export default function Home() {
  const checkoutUrl = process.env.AUDIT_CHECKOUT_URL ?? '';

  return (
    <main>
      <SiteHeader />
      <HeroCommandCenter />

      <section className="signalStrip" aria-label="Release proof triggers">
        <div className="shell signalGrid">
          <div><span>Pull request</span><strong>Pre-merge gate</strong></div>
          <div><span>Deploy</span><strong>Release evidence</strong></div>
          <div><span>Database</span><strong>Tenant isolation</strong></div>
          <div><span>Drift</span><strong>Regression visibility</strong></div>
        </div>
      </section>

      <ProofMatrix />
      <WorkflowTimeline />
      <FindingsExplorer />

      <section className="section shell proofBento" aria-label="Coverage and evidence examples">
        <CoveragePanel />
        <EvidencePanel />
      </section>

      <section className="section shell scannerSection" aria-labelledby="scan-title">
        <div className="sectionHeading splitHeading">
          <div><p className="eyebrow">Live acquisition surface</p><h2 id="scan-title">Check a public repo now. Treat the result as bounded.</h2></div>
          <p>The free browser scan is useful triage, not the full release gate. External engines and runtime authorization proof require the CI workflow.</p>
        </div>
        <ScannerForm checkoutUrl={checkoutUrl} />
      </section>

      <TrustMethodology />
      <InstallPanel />
      <PricingSection checkoutUrl={checkoutUrl} />
      <FaqSection />

      <footer className="footer shell">
        <div><strong>RLSProof</strong><span>Temporary working name · final brand and domain TBD.</span></div>
        <p>Security-development aid, not a security certification or compliance attestation.</p>
        <nav aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
      </footer>
    </main>
  );
}
