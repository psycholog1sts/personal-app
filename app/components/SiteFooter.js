import Link from 'next/link';

export default function SiteFooter({ copy }) {
  return (
    <footer className="footer shell">
      <div className="footerBrand">
        <strong>RLSProof</strong>
        <span>{copy.tagline}</span>
      </div>
      <p>{copy.disclaimer}</p>
      <nav aria-label={copy.legalLabel}>
        <Link href="/about">{copy.about}</Link>
        <Link href="/contact">{copy.contact}</Link>
        <Link href="/security">{copy.security}</Link>
        <Link href="/privacy">{copy.privacy}</Link>
        <Link href="/terms">{copy.terms}</Link>
        <a href="https://github.com/psycholog1sts/personal-app" rel="noreferrer">{copy.repository}</a>
      </nav>
    </footer>
  );
}
