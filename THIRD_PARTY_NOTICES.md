# Third-Party Notices

RLSProof's verified full-scan integration downloads and invokes the following independent security tools in CI and in opt-in GitHub Action `scan-mode: full`. Their binaries are not vendored into this repository.

| Component | Pinned verified version | License | Purpose |
| --- | --- | --- | --- |
| Gitleaks (`gitleaks/gitleaks`) | 8.30.1 | MIT | Secret scanning |
| OSV-Scanner (`google/osv-scanner`) | 2.5.1 | Apache-2.0 | Known dependency vulnerability scanning |
| Opengrep (`opengrep/opengrep`) | 1.29.0 | LGPL-2.1 | Static analysis using local rules |

The repository-owned installer downloads exact Linux x64 release assets for these versions and verifies committed SHA-256 digests before execution. Each project retains its own copyright, warranty terms, and license obligations; consult the corresponding upstream tagged release and license file before redistributing its binary.

RLSProof does not automatically install or redistribute optional interoperability tools such as `rlsautotest`; references to such tools in documentation are integration guidance only.

RLSProof's own npm package is private and marked `UNLICENSED`. This notices file does not grant a license to RLSProof source code and does not change the licenses of the third-party projects listed above.
