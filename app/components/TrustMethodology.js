export default function TrustMethodology({ copy }) {
  return (
    <section className="section trustSection" id="methodology" aria-labelledby="methodology-title">
      <div className="shell">
        <div className="sectionHeading splitHeading">
          <div><p className="eyebrow">{copy.eyebrow}</p><h2 id="methodology-title">{copy.title}</h2></div>
          <p>{copy.body}</p>
        </div>
        <div className="trustGrid">
          {copy.cards.map((card, index) => (
            <article key={card.id}><span>0{index + 1}</span><h3>{card.title}</h3><p>{card.body}</p></article>
          ))}
        </div>
      </div>
    </section>
  );
}
