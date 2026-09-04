'use client';

import { useState } from 'react';
import { browserQuickScanGithubRepo } from '../../src/remote/browser-quick-scan.js';

function severityLabel(value) {
  return typeof value === 'string' ? value.toUpperCase() : 'UNKNOWN';
}

export default function ScannerForm({ checkoutUrl, copy }) {
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
      setError(scanError?.message ?? copy.fallbackError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="scannerCard" id="scan" aria-label={copy.ariaLabel}>
      <div className="scannerIntro">
        <span className="statusDot" aria-hidden="true" />
        <span>{copy.intro}</span>
      </div>
      <form onSubmit={onSubmit}>
        <label htmlFor="repository">{copy.repositoryLabel}</label>
        <div className="inputRow">
          <input
            id="repository"
            name="repository"
            type="text"
            autoComplete="off"
            spellCheck="false"
            placeholder={copy.placeholder}
            value={repository}
            onChange={(event) => setRepository(event.target.value)}
            maxLength={200}
            required
          />
          <button className="primaryButton" type="submit" disabled={loading}>
            {loading ? copy.scanning : copy.submit}
          </button>
        </div>
        <p className="formNote">{copy.note}</p>
      </form>

      {error ? <p className="errorBox" role="alert">{error}</p> : null}

      {report ? (
        <div className="report" aria-live="polite">
          <div className="reportTop">
            <div>
              <p className="reportKicker">{copy.readinessScore}</p>
              <p className="score">{report.readiness?.score ?? '—'}<span>/100</span></p>
            </div>
            <div className={`gate gate-${report.releaseGate ?? 'incomplete'}`}>
              {String(report.releaseGate ?? 'incomplete').toUpperCase()}
            </div>
          </div>

          <div className="coverageNote">
            <strong>{copy.partialTitle}</strong>{' '}
            {report.coverage?.reason ?? copy.partialFallback}
          </div>

          <div className="scanStats">
            <span>{report.scope?.filesScanned ?? 0} {copy.filesScanned}</span>
            <span>{Math.ceil((report.scope?.bytesScanned ?? 0) / 1024)} {copy.kbAnalyzed}</span>
            <span>{report.findings?.length ?? 0} {copy.findingsLabel}</span>
          </div>

          <div className="findings">
            {(report.findings ?? []).length === 0 ? (
              <article className="finding cleanFinding">
                <h3>{copy.noBlockerTitle}</h3>
                <p>{copy.noBlockerBody}</p>
              </article>
            ) : (
              report.findings.map((finding) => (
                <article className="finding" key={finding.id}>
                  <div className="findingHeader">
                    <span className={`severity severity-${finding.severity}`}>{severityLabel(finding.severity)}</span>
                    <span className="findingPath">
                      {finding.path ?? copy.repositoryFallback}{finding.line ? `:${finding.line}` : ''}
                    </span>
                  </div>
                  <h3>{finding.title}</h3>
                  <p className="evidence">{finding.evidence}</p>
                  <p><strong>{copy.fixLabel}</strong> {finding.remediation}</p>
                </article>
              ))
            )}
          </div>

          <div className="auditUpsell">
            <div>
              <p className="reportKicker">{copy.upsellKicker}</p>
              <h3>{copy.upsellTitle}</h3>
              <p>{copy.upsellBody}</p>
            </div>
            {checkoutUrl ? (
              <a className="primaryButton" href={checkoutUrl} rel="noreferrer">{copy.buyAudit}</a>
            ) : (
              <span className="disabledButton" aria-disabled="true">{copy.checkoutPending}</span>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
