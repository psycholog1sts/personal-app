import Link from 'next/link';

export default function SiteHeader({ copy }) {
  return (
    <header className="siteHeaderWrap">
      <div className="siteHeader shell">
        <div className="brandWrap">
          <Link href="/" className="brand" aria-label={copy.homeLabel}>RLSProof</Link>
          <span className="workingName">{copy.workingName}</span>
        </div>
        <nav className="primaryNav" aria-label={copy.primaryLabel}>
          {copy.items.map((item) => item.href.startsWith('/')
            ? <Link href={item.href} key={item.id}>{item.label}</Link>
            : <a href={item.href} key={item.id}>{item.label}</a>)}
        </nav>
        <a className="navCta" href="#scan">{copy.cta}</a>
      </div>
    </header>
  );
}
