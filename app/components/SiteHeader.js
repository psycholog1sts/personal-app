import Link from 'next/link';

function NavigationItems({ copy }) {
  return copy.items.map((item) => item.href.startsWith('/')
    ? <Link href={item.href} key={item.id}>{item.label}</Link>
    : <a href={item.href} key={item.id}>{item.label}</a>);
}

export default function SiteHeader({ copy }) {
  return (
    <header className="siteHeaderWrap">
      <div className="siteHeader shell">
        <Link href="/" className="brand" aria-label={copy.homeLabel}>RLSProof</Link>

        <nav className="primaryNav" aria-label={copy.primaryLabel}>
          <NavigationItems copy={copy} />
        </nav>

        <a className="navCta" href="#scan">{copy.cta}</a>

        <details className="mobileNav">
          <summary aria-label={copy.primaryLabel}>Menu</summary>
          <nav aria-label={`${copy.primaryLabel} mobile`}>
            <NavigationItems copy={copy} />
            <a className="mobileNavCta" href="#scan">{copy.cta}</a>
          </nav>
        </details>
      </div>
    </header>
  );
}
