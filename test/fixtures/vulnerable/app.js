// Intentionally vulnerable test fixture. Values are fake.
const SUPABASE_SERVICE_ROLE_KEY = 'FAKE_SERVICE_ROLE_VALUE_SHOULD_NEVER_LEAK';

export function executeUserExpression(userInput) {
  return eval(userInput);
}

export { SUPABASE_SERVICE_ROLE_KEY };
