const ASSIGNMENT_SECRET = /\b([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD|PASSWD|PRIVATE_KEY|SERVICE_ROLE_KEY)[A-Z0-9_]*)\s*=\s*([^\s'\";]+)/gi;
const BEARER_TOKEN = /\b(Bearer)\s+[A-Za-z0-9._~+\/-]{12,}/gi;
const JWT_LIKE = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\b/g;
const COMMON_KEY_PREFIX = /\b(?:sk|rk|pk|ghp|github_pat|xox[baprs])-[-A-Za-z0-9_]{12,}\b/g;

export function redactEvidence(value) {
  if (value === null || value === undefined) return null;

  let text = String(value);
  text = text.replace(ASSIGNMENT_SECRET, (_, key) => `${key}=[REDACTED]`);
  text = text.replace(BEARER_TOKEN, '$1 [REDACTED]');
  text = text.replace(JWT_LIKE, '[REDACTED]');
  text = text.replace(COMMON_KEY_PREFIX, '[REDACTED]');
  return text;
}
