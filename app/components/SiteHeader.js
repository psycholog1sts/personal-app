import Link from 'next/link';

function resolveHref(item, homeAnchors) {
  if (homeAnchors && item.href.startsWith('#')) return `/#${item.href.slice(1)}`;
  return item.href;
}

function NavigationItems({ copy, homeAnchors }) {
  return copy.items.map((item) => {
    const href = resolveHref(item, homeAnchors);
    return href.startsWith('/')
      ? <Link href={href} key={item.id}>{item.label}</Link>
      : <a href={href} key={item.id}>{item.label}</a>;
  });
}

export default function SiteHeader({ copy, homeAnchors = false }) {
  const ctaHref = homeAnchors ? '/#scan' : '#scan';

  return (
    <header className="siteHeaderWrap">
      <div className="siteHeader shell">
        <Link href="/" className="brand" aria-label={copy.homeLabel}>RLSProof</Link>

        <nav className="primaryNav" aria-label={copy.primaryLabel}>
          <NavigationItems copy={copy} homeAnchors={homeAnchors} />
        </nav>

        {homeAnchors
          ? <Link className="navCta" href={ctaHref}>{copy.cta}</Link>
          : <a className="navCta" href={ctaHref}>{copy.cta}</a>}

        <details className="mobileNav">
          <summary aria-label={copy.primaryLabel}>Menu</summary>
          <nav aria-label={`${copy.primaryLabel} mobile`}>
            <NavigationItems copy={copy} homeAnchors={homeAnchors} />
            {homeAnchors
              ? <Link className="mobileNavCta" href={ctaHref}>{copy.cta}</Link>
              : <a className="mobileNavCta" href={ctaHref}>{copy.cta}</a>}
          </nav>
        </details>
      </div>
    </header>
  );
}
