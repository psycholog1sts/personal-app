#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ] || [ -z "${1:-}" ]; then
  echo "Usage: $0 <install-directory>" >&2
  exit 64
fi

os="$(uname -s)"
arch="$(uname -m)"
if [ "$os" != "Linux" ] || { [ "$arch" != "x86_64" ] && [ "$arch" != "amd64" ]; }; then
  echo "RLSProof external scanners: unsupported runner ${os}/${arch}; verified full mode currently supports Linux x86_64 only." >&2
  exit 65
fi

bin="$1"
mkdir -p "$bin"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

curl --fail --location --silent --show-error --retry 3 \
  -o "$tmp/gitleaks.tar.gz" \
  https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz
echo "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb  $tmp/gitleaks.tar.gz" | sha256sum --check --strict
tar -xzf "$tmp/gitleaks.tar.gz" -C "$tmp" gitleaks
install -m 0755 "$tmp/gitleaks" "$bin/gitleaks"

curl --fail --location --silent --show-error --retry 3 \
  -o "$tmp/osv-scanner" \
  https://github.com/google/osv-scanner/releases/download/v2.5.1/osv-scanner_linux_amd64
echo "f9f25499a2c8cc367b3af45df2ea7eeca7fbccceab9c35079968f4b3652194be  $tmp/osv-scanner" | sha256sum --check --strict
install -m 0755 "$tmp/osv-scanner" "$bin/osv-scanner"

curl --fail --location --silent --show-error --retry 3 \
  -o "$tmp/opengrep" \
  https://github.com/opengrep/opengrep/releases/download/v1.29.0/opengrep_manylinux_x86
echo "3365ef49d04893e01338d85d9bbd49b2bd5261ad4c9c0df0a6a0f8d44232ae13  $tmp/opengrep" | sha256sum --check --strict
install -m 0755 "$tmp/opengrep" "$bin/opengrep"

"$bin/gitleaks" version
"$bin/osv-scanner" --version
"$bin/opengrep" --version
