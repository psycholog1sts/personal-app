import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="siteHeaderWrap">
      <div className="siteHeader shell">
        <div className="brandWrap">
          <Link href="/" className="brand" aria-label="RLSProof home">RLSProof</Link>
          <span className="workingName">working name</span>
        </div>
        <nav className="primaryNav" aria-label="Primary navigation">
          <a href="#proof">Proof</a>
          <a href="#workflow">Workflow</a>
          <a href="#scan">Quick Scan</a>
          <a href="#install">Install</a>
          <a href="#pricing">Pricing</a>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <a className="navCta" href="#scan">Run free scan</a>
      </div>
    </header>
  );
}
