const actionSnippet = `name: Authorization release gate
on: [pull_request]

jobs:
  prove-boundaries:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<reviewed-commit-sha>
      - uses: psycholog1sts/personal-app@<reviewed-commit-sha>
        with:
          db-proof: required`;

const proofSnippet = `# Use a disposable/local/test Supabase stack.
supabase test db

# Required mode blocks when DB proof is missing.
db-proof: required`;

export default function InstallPanel() {
  return (
    <section className="section shell" id="install" aria-labelledby="install-title">
      <div className="sectionHeading splitHeading">
        <div><p className="eyebrow">Developer-native onboarding</p><h2 id="install-title">Install once. Gate the changes automatically.</h2></div>
        <p>Pin reviewed immutable action SHAs. Run database authorization proof only against disposable, local or dedicated test environments.</p>
      </div>
      <div className="installGrid">
        <article className="codePanel">
          <div className="codePanelHead"><span>GitHub Actions</span><span className="sampleBadge">Template</span></div>
          <pre><code>{actionSnippet}</code></pre>
        </article>
        <article className="codePanel">
          <div className="codePanelHead"><span>Supabase DB proof</span><span className="gatePill gateRequired">REQUIRED</span></div>
          <pre><code>{proofSnippet}</code></pre>
        </article>
      </div>
      <p className="installWarning"><strong>Safety boundary:</strong> never run destructive authorization fixtures against a production database. Use an isolated test stack and review generated tests before execution.</p>
    </section>
  );
}
