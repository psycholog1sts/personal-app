'use client';

import { useState } from 'react';

function severityLabel(value) {
  return typeof value === 'string' ? value.toUpperCase() : 'UNKNOWN';
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
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ repository }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? 'Scan failed.');
      setReport(payload);
    } catch (scanError) {
      setError(scanError?.message ?? 'Scan failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="scannerCard" id="scan" aria-label="Free repository scanner">
      <div className="scannerIntro">
        <span className="statusDot" aria-hidden="true" />
        <span>Free public-repo quick scan</span>
      </div>
      <form onSubmit={onSubmit}>
        <label htmlFor="repository">GitHub repository</label>
        <div className="inputRow">
          <input
            id="repository"
            name="repository"
            type="text"
            autoComplete="off"
            spellCheck="false"
            placeholder="https://github.com/owner/repo"
            value={repository}
            onChange={(event) => setRepository(event.target.value)}
            maxLength={200}
            required
          />
          <button className="primaryButton" type="submit" disabled={loading}>
            {loading ? 'Scanning…' : 'Scan free'}
          </button>
        </div>
        <p className="formNote">Public repositories only. Quick Scan is intentionally bounded and never claims full coverage.</p>
      </form>

      {error ? <p className="errorBox" role="alert">{error}</p> : null}

      {report ? (
        <div className="report" aria-live="polite">
          <div className="reportTop">
            <div>
              <p className="reportKicker">Readiness score</p>
              <p className="score">{report.readiness?.score ?? '—'}<span>/100</span></p>
            </div>
            <div className={`gate gate-${report.releaseGate ?? 'incomplete'}`}>
              {String(report.releaseGate ?? 'incomplete').toUpperCase()}
            </div>
          </div>

          <div className="coverageNote">
            <strong>Quick-scan coverage is partial.</strong>{' '}
            {report.coverage?.reason ?? 'Run a full audit before treating the repository as release-ready.'}
          </div>

          <div className="scanStats">
            <span>{report.scope?.filesScanned ?? 0} files scanned</span>
            <span>{Math.ceil((report.scope?.bytesScanned ?? 0) / 1024)} KB analyzed</span>
            <span>{report.findings?.length ?? 0} findings</span>
          </div>

          <div className="findings">
            {(report.findings ?? []).length === 0 ? (
              <article className="finding cleanFinding">
                <h3>No blocker found by the bounded checks</h3>
                <p>This is not a full security clearance. External engines and runtime authorization tests have not run.</p>
              </article>
            ) : (
              report.findings.map((finding) => (
                <article className="finding" key={finding.id}>
                  <div className="findingHeader">
                    <span className={`severity severity-${finding.severity}`}>{severityLabel(finding.severity)}</span>
                    <span className="findingPath">
                      {finding.path ?? 'repository'}{finding.line ? `:${finding.line}` : ''}
                    </span>
                  </div>
                  <h3>{finding.title}</h3>
                  <p className="evidence">{finding.evidence}</p>
                  <p><strong>Fix:</strong> {finding.remediation}</p>
                </article>
              ))
            )}
          </div>

          <div className="auditUpsell">
            <div>
              <p className="reportKicker">Need evidence before launch?</p>
              <h3>Full Launch Audit — $149</h3>
              <p>Gitleaks + OSV-Scanner + Opengrep, reviewed findings, and a verification report.</p>
            </div>
            {checkoutUrl ? (
              <a className="primaryButton" href={checkoutUrl} rel="noreferrer">Buy full audit</a>
            ) : (
              <span className="disabledButton" aria-disabled="true">Checkout being configured</span>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
