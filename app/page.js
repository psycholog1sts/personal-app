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
import { getDictionary } from '../i18n/get-dictionary.js';

export default function Home() {
  const checkoutUrl = process.env.AUDIT_CHECKOUT_URL ?? '';
  const copy = getDictionary('en');

  return (
    <main>
      <SiteHeader copy={copy.nav} />
      <HeroCommandCenter copy={copy.hero} releaseConsoleCopy={copy.releaseConsole} />

      <section className="signalStrip" aria-label={copy.signals.ariaLabel}>
        <div className="shell signalGrid">
          {copy.signals.items.map((item) => <div key={item.id}><span>{item.label}</span><strong>{item.value}</strong></div>)}
        </div>
      </section>

      <ProofMatrix copy={copy.proof} />
      <WorkflowTimeline copy={copy.workflow} />
      <FindingsExplorer copy={copy.findings} />

      <section className="section shell proofBento" aria-label={copy.a11y.coverageEvidenceExamples}>
        <CoveragePanel copy={copy.coverage} />
        <EvidencePanel copy={copy.evidence} />
      </section>

      <section className="section shell scannerSection" aria-labelledby="scan-title">
        <div className="sectionHeading splitHeading">
          <div><p className="eyebrow">{copy.scannerSection.eyebrow}</p><h2 id="scan-title">{copy.scannerSection.title}</h2></div>
          <p>{copy.scannerSection.body}</p>
        </div>
        <ScannerForm checkoutUrl={checkoutUrl} copy={copy.scanner} />
      </section>

      <TrustMethodology copy={copy.methodology} />
      <InstallPanel copy={copy.install} />
      <PricingSection checkoutUrl={checkoutUrl} copy={copy.pricing} />
      <FaqSection copy={copy.faq} />

      <footer className="footer shell">
        <div><strong>RLSProof</strong><span>{copy.footer.tagline}</span></div>
        <p>{copy.footer.disclaimer}</p>
        <nav aria-label={copy.footer.legalLabel}><Link href="/privacy">{copy.footer.privacy}</Link><Link href="/terms">{copy.footer.terms}</Link></nav>
      </footer>
    </main>
  );
}
