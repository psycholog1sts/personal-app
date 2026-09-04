const triggers = [
  ['Every pull request', 'Review code and SQL changes before merge.'],
  ['Every deploy', 'Re-run the same release proof on the shipping commit.'],
  ['Policy drift', 'Surface database posture changes that escaped the migration trail.'],
];

const steps = [
  ['01', 'PR opened'],
  ['02', 'Static checks'],
  ['03', 'RLS proof'],
  ['04', 'Fix'],
  ['05', 'Re-test'],
  ['06', 'Release gate'],
];

export default function WorkflowTimeline() {
  return (
    <section className="section shell" id="workflow" aria-labelledby="workflow-title">
      <div className="sectionHeading splitHeading">
        <div>
          <p className="eyebrow">Continuous by default</p>
          <h2 id="workflow-title">Security runs when the application changes.</h2>
        </div>
        <p>The website is the control surface. Retention comes from a gate already attached to the engineering lifecycle.</p>
      </div>

      <div className="workflowGrid">
        {triggers.map(([title, body], index) => (
          <article className="workflowCard" key={title}>
            <span className="workflowIndex">0{index + 1}</span>
            <h3>{title}</h3><p>{body}</p>
          </article>
        ))}
      </div>

      <div className="proofTimeline" aria-label="Release proof workflow">
        {steps.map(([number, title], index) => (
          <div className="timelineNode" key={number}>
            <span className="timelineNumber">{number}</span>
            <strong>{title}</strong>
            {index < steps.length - 1 ? <span className="timelineConnector" aria-hidden="true">→</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
