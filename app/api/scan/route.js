import { QuickScanError, quickScanGithubRepo } from '../../../src/remote/quick-scan.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_REQUEST_BYTES = 2048;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

const buckets = globalThis.__guardianRateBuckets ?? new Map();
globalThis.__guardianRateBuckets = buckets;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
    },
  });
}

function clientAddress(request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded && forwarded.length <= 80) return forwarded;
  const real = request.headers.get('x-real-ip')?.trim();
  if (real && real.length <= 80) return real;
  return 'unknown';
}

function allowRequest(key, now = Date.now()) {
  for (const [bucketKey, value] of buckets) {
    if (now - value.startedAt >= WINDOW_MS) buckets.delete(bucketKey);
  }

  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(key, { count: 1, startedAt: now });
    return true;
  }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

export async function POST(request) {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return json({ error: 'Request is too large.' }, 413);
  }

  const key = clientAddress(request);
  if (!allowRequest(key)) {
    return json({ error: 'Too many scans from this address. Try again later.' }, 429);
  }

  let body;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_REQUEST_BYTES) {
      return json({ error: 'Request is too large.' }, 413);
    }
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  if (typeof body?.repository !== 'string' || body.repository.trim().length === 0 || body.repository.length > 200) {
    return json({ error: 'Enter a valid public GitHub repository.' }, 400);
  }

  try {
    const report = await quickScanGithubRepo(body.repository, {
      token: process.env.GITHUB_TOKEN ?? '',
    });
    return json(report);
  } catch (error) {
    if (error instanceof QuickScanError) {
      return json({ error: error.message, code: error.code }, error.statusCode);
    }
    console.error('Guardian quick scan failed', error instanceof Error ? error.name : 'unknown_error');
    return json({ error: 'The scan could not be completed.' }, 500);
  }
}
