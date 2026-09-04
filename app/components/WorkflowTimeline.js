export default function WorkflowTimeline({ copy }) {
  return (
    <section className="section shell" id="workflow" aria-labelledby="workflow-title">
      <div className="sectionHeading splitHeading">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="workflow-title">{copy.title}</h2>
        </div>
        <p>{copy.body}</p>
      </div>

      <div className="workflowGrid">
        {copy.triggers.map((trigger, index) => (
          <article className="workflowCard" key={trigger.id}>
            <span className="workflowIndex">0{index + 1}</span>
            <h3>{trigger.title}</h3><p>{trigger.body}</p>
          </article>
        ))}
      </div>

      <div className="proofTimeline" aria-label={copy.timelineLabel}>
        {copy.steps.map((step, index) => (
          <div className="timelineNode" key={step.id}>
            <span className="timelineNumber">{step.id}</span>
            <strong>{step.title}</strong>
            {index < copy.steps.length - 1 ? <span className="timelineConnector" aria-hidden="true">→</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
