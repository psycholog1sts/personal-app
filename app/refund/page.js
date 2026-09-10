import Link from 'next/link';
import SiteFooter from '../components/SiteFooter.js';
import SiteHeader from '../components/SiteHeader.js';
import { getDictionary } from '../../i18n/get-dictionary.js';
import { buildPageMetadata } from '../../i18n/seo.js';

const dictionary = getDictionary('en');
export const metadata = buildPageMetadata({
  locale: 'en', pathname: '/refund', title: 'Refund Policy — RLSProof',
  description: 'Refund requests, payment availability, and purchase terms for RLSProof Launch Verification.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, ''),
});

export default function RefundPage() {
  return (
    <>
      <SiteHeader copy={dictionary.nav} homeAnchors />
      <main id="main-content" className="shell legal publicContentPage">
        <p className="eyebrow">RLSProof</p>
        <h1>Refund Policy</h1>
        <p>Last updated: September 10, 2026.</p>
        <section>
          <h2>Who operates RLSProof</h2>
          <p>RLSProof is an independent software product operated by an individual under the RLSProof brand. References to RLSProof, we, or us mean this individual operator.</p>
        </section>
        <section>
          <h2>Price and current payment availability</h2>
          <p>Launch Verification is offered at $149 USD as a one-time payment for reviewed findings, remediation guidance, and a fix → re-test evidence report. Payment activation is pending; purchases are not currently available.</p>
        </section>
        <section>
          <h2>Refund requests</h2>
          <p>If you have a purchase question or believe you were charged for RLSProof, email <a href="mailto:cmetehan161@gmail.com">cmetehan161@gmail.com</a> or use our <Link href="/contact">Contact page</Link>. Do not share payment details or receipts in public GitHub Issues.</p>
          <p>For a future purchase completed through Paddle, use the support or refund link in your transaction receipt or visit <a href="https://paddle.net">Paddle buyer support</a>. Refund eligibility and processing will follow the <a href="https://www.paddle.com/legal/refund-policy">Paddle Refund Policy</a> and applicable mandatory consumer rights. A refund request does not by itself guarantee approval.</p>
        </section>
        <section>
          <h2>Your rights</h2>
          <p>Nothing in this policy limits mandatory rights concerning withdrawal, non-delivery, or a product that is faulty or not as described. Any additional purchase terms must be disclosed before checkout becomes available.</p>
        </section>
        <p><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/contact">Contact</Link></p>
      </main>
      <SiteFooter copy={dictionary.footer} />
    </>
  );
}
