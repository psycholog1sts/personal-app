import Link from 'next/link';
import { getDictionary } from '../../i18n/get-dictionary.js';

export const metadata = { title: 'Terms — RLSProof' };

export default function TermsPage() {
  const copy = getDictionary('en').legal.terms;

  return (
    <main className="shell legal">
      <p className="eyebrow">{copy.brand}</p>
      <h1>{copy.title}</h1>
      <p>{copy.updated}</p>
      {copy.sections.map((section) => (
        <section key={section.id}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <p><Link href="/">{copy.returnHome}</Link></p>
    </main>
  );
}
