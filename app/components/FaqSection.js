export default function FaqSection({ copy }) {
  return (
    <section className="section shell faqSection" id="faq" aria-labelledby="faq-title">
      <div className="sectionHeading"><p className="eyebrow">{copy.eyebrow}</p><h2 id="faq-title">{copy.title}</h2></div>
      <div className="faqList">
        {copy.items.map((item) => <details key={item.id}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}
      </div>
    </section>
  );
}
