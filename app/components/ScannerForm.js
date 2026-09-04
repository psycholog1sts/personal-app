'use client';

import { useState } from 'react';
import { browserQuickScanGithubRepo } from '../../src/remote/browser-quick-scan.js';

function severityLabel(value) {
  return typeof value === 'string' ? value.toUpperCase() : 'UNKNOWN';
}

function gateLabel(value) {
  return String(value ?? 'incomplete').toUpperCase();
}

export default function ScannerForm({ checkoutUrl }) {
  const [repository, setRepository] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const payload = await browserQuickScanGithubRepo(repository.trim());
      setReport(payload);
    } catch (scanError) {
      setError(scanError?.message ?? 'Scan failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="scannerCard" aria-label="Quick assessment">
      <div className="scannerHeader">
        <div>
          <p className="panelLabel">Quick assessment</p>
          <h3>Check a public GitHub repository</h3>
        </div>
        <span className="browserBadge"><span aria-hidden="true">●</span> browser-side</span>
      </div>

      <form className="scannerForm" onSubmit={onSubmit}>
        <label htmlFor="repository">Repository URL</label>
        <div className="inputRow">
          <input
            id="repository"
            name="repository"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck="false"
            placeholder="https://github.com/owner/repo"
            value={repository}
            onChange={(event) => setRepository(event.target.value)}
            maxLength={200}
            required
          />
          <button className="primaryButton" type="submit" disabled={loading}>
            {loading ? 'Analyzing…' : 'Run assessment'}
          </button>
        </div>
        <div className="scannerFormMeta">
          <span>Public repositories only</span>
          <span>Bounded file set</span>
          <span>No full-coverage claim</span>
        </div>
      </form>

      {loading ? (
        <div className="scanProgress" role="status" aria-live="polite">
          <span className="scanPulse" aria-hidden="true" />
          <div><strong>Building a bounded signal…</strong><span>Fetching eligible public files and running deterministic checks in this browser.</span></div>
        </div>
      ) : null}

      {error ? <p className="errorBox" role="alert">{error}</p> : null}

      {report ? (
        <div className="report" aria-live="polite">
          <div className="resultSummaryGrid">
            <article className="resultCard riskCard">
              <div className="resultCardHeader"><span>Risk posture</span><span className={`gate gate-${report.releaseGate ?? 'incomplete'}`}>{gateLabel(report.releaseGate)}</span></div>
              <div className="scoreRow"><strong>{report.readiness?.score ?? '—'}</strong><span>/100</span></div>
              <p>Readiness score reflects only the findings produced by checks that actually ran.</p>
            </article>

            <article className="resultCard coverageCard">
              <div className="resultCardHeader"><span>Coverage</span><span className="coverageState">partial</span></div>
              <div className="coverageMetrics">
                <div><strong>{report.scope?.filesScanned ?? 0}</strong><span>files</span></div>
                <div><strong>{Math.ceil((report.scope?.bytesScanned ?? 0) / 1024)}</strong><span>KB</span></div>
                <div><strong>{report.findings?.length ?? 0}</strong><span>findings</span></div>
              </div>
              <p>{report.coverage?.reason ?? 'External engines and runtime authorization tests have not run in the quick assessment.'}</p>
            </article>
          </div>

          <section className="findingsSection" aria-labelledby="findings-title">
            <div className="findingsHeading">
              <div><p className="panelLabel">Findings</p><h3 id="findings-title">Evidence surfaced by the bounded checks</h3></div>
              <span>{report.findings?.length ?? 0} total</span>
            </div>

            <div className="findings">
              {(report.findings ?? []).length === 0 ? (
                <article className="finding cleanFinding">
                  <div className="cleanIcon" aria-hidden="true">✓</div>
                  <div>
                    <h3>No blocker found by the bounded checks</h3>
                    <p>This is not a full security clearance. External engines and runtime authorization tests have not run.</p>
                  </div>
                </article>
              ) : (
                report.findings.map((finding) => (
                  <article className="finding" key={finding.id}>
                    <div className="findingHeader">
                      <span className={`severity severity-${finding.severity}`}>{severityLabel(finding.severity)}</span>
                      <span className="findingPath">{finding.path ?? 'repository'}{finding.line ? `:${finding.line}` : ''}</span>
                    </div>
                    <h3>{finding.title}</h3>
                    <p className="evidence">{finding.evidence}</p>
                    <div className="findingFix"><span>Recommended fix</span><p>{finding.remediation}</p></div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="nextAction" aria-label="Next action">
            <div>
              <p className="panelLabel">Next action</p>
              <h3>Turn the signal into release evidence.</h3>
              <p>Launch Proof adds full external scanner coverage, human review, scoped DB proof where testable, and one verification pass.</p>
            </div>
            {checkoutUrl ? (
              <a className="primaryButton" href={checkoutUrl} rel="noreferrer">Request Launch Proof — $499</a>
            ) : (
              <span className="disabledButton" aria-disabled="true">Payment activation pending</span>
            )}
          </section>
        </div>
      ) : (
        <div className="scannerEmptyState">
          <span className="emptyGlyph" aria-hidden="true">⌁</span>
          <div><strong>Risk, coverage and findings appear here.</strong><span>No account or paid API is required for the public quick assessment.</span></div>
        </div>
      )}
    </section>
  );
}
