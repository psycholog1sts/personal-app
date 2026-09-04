function lineRank(finding) {
  return Number.isInteger(finding?.line) && finding.line > 0 ? finding.line : Number.MAX_SAFE_INTEGER;
}

function byLocationThenId(left, right) {
  const lineDifference = lineRank(left) - lineRank(right);
  if (lineDifference) return lineDifference;
  return String(left?.id ?? '').localeCompare(String(right?.id ?? ''));
}

function bucket(findings, keyFor, matched) {
  const buckets = new Map();
  for (const finding of findings) {
    if (matched.has(finding)) continue;
    const key = keyFor(finding);
    if (!key) continue;
    const values = buckets.get(key) ?? [];
    values.push(finding);
    buckets.set(key, values);
  }
  for (const values of buckets.values()) values.sort(byLocationThenId);
  return buckets;
}

function pairBuckets(previousFindings, currentFindings, keyFor, matchedPrevious, matchedCurrent, pairs) {
  const previousBuckets = bucket(previousFindings, keyFor, matchedPrevious);
  const currentBuckets = bucket(currentFindings, keyFor, matchedCurrent);

  for (const [key, currentBucket] of currentBuckets) {
    const previousBucket = previousBuckets.get(key) ?? [];
    const pairCount = Math.min(previousBucket.length, currentBucket.length);
    for (let index = 0; index < pairCount; index += 1) {
      const previous = previousBucket[index];
      const current = currentBucket[index];
      matchedPrevious.add(previous);
      matchedCurrent.add(current);
      pairs.set(current, previous);
    }
  }
}

export function matchFindingSets(previousFindings, currentFindings) {
  if (!Array.isArray(previousFindings) || !Array.isArray(currentFindings)) {
    throw new TypeError('finding matcher requires previous and current finding arrays');
  }

  const matchedPrevious = new Set();
  const matchedCurrent = new Set();
  const pairs = new Map();

  // Exact IDs are matched first to preserve compatibility with reports created
  // before stable fingerprints existed.
  pairBuckets(
    previousFindings,
    currentFindings,
    (finding) => typeof finding?.id === 'string' && finding.id ? `id:${finding.id}` : null,
    matchedPrevious,
    matchedCurrent,
    pairs,
  );

  // Remaining findings can follow a stable fingerprint across line movement.
  // Bucket pairing is count-aware, so one accepted occurrence cannot hide an
  // additional occurrence with the same fingerprint.
  pairBuckets(
    previousFindings,
    currentFindings,
    (finding) => typeof finding?.fingerprint === 'string' && finding.fingerprint ? `fp:${finding.fingerprint}` : null,
    matchedPrevious,
    matchedCurrent,
    pairs,
  );

  return {
    pairs,
    unmatchedPrevious: previousFindings.filter((finding) => !matchedPrevious.has(finding)),
    unmatchedCurrent: currentFindings.filter((finding) => !matchedCurrent.has(finding)),
  };
}
