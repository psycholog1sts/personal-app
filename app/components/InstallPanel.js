const actionSnippet = `name: Authorization release gate
on: [pull_request]

jobs:
  prove-boundaries:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<reviewed-commit-sha>
      - uses: psycholog1sts/personal-app@<reviewed-commit-sha>
        with:
          scan-mode: full
          db-proof: required
          # Optional mature-repo ratchet; commit and review this report first.
          # baseline-report: .rlsproof/baseline.json`;

const proofSnippet = `# Use a disposable/local/test Supabase stack.
supabase test db

# Required mode blocks when DB proof is missing.
db-proof: required`;

export default function InstallPanel({ copy }) {
  return (
    <section className="section shell" id="install" aria-labelledby="install-title">
      <div className="sectionHeading splitHeading">
        <div><p className="eyebrow">{copy.eyebrow}</p><h2 id="install-title">{copy.title}</h2></div>
        <p>{copy.body}</p>
      </div>
      <div className="installGrid">
        <article className="codePanel">
          <div className="codePanelHead"><span>{copy.actionTitle}</span><span className="sampleBadge">{copy.templateBadge}</span></div>
          <pre><code>{actionSnippet}</code></pre>
        </article>
        <article className="codePanel">
          <div className="codePanelHead"><span>{copy.dbTitle}</span><span className="gatePill gateRequired">REQUIRED</span></div>
          <pre><code>{proofSnippet}</code></pre>
        </article>
      </div>
      <p className="formNote">{copy.fullModeBody}</p>
      <p className="installWarning"><strong>{copy.safetyTitle}</strong> {copy.safetyBody}</p>
    </section>
  );
}
