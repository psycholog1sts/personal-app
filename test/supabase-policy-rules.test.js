import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';

import { runNativeScan } from '../src/native/scan.js';

async function scanSql(sql) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'rlsproof-sql-'));
  try {
    await writeFile(path.join(root, 'schema.sql'), sql, 'utf8');
    return await runNativeScan(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function rules(findings) {
  return new Set(findings.map((finding) => finding.rule));
}

test('flags deprecated auth.role() inside RLS policy', async () => {
  const findings = await scanSql(`
    create table public.todos (id bigint, user_id uuid);
    alter table public.todos enable row level security;
    create policy "legacy role check" on public.todos
      for select using (auth.role() = 'authenticated');
  `);

  assert.equal(rules(findings).has('supabase-policy-deprecated-auth-role'), true);
});

test('flags authorization based on user-editable JWT metadata', async () => {
  const findings = await scanSql(`
    create table public.documents (id bigint, owner_id uuid);
    alter table public.documents enable row level security;
    create policy "metadata authorization" on public.documents
      for select to authenticated
      using ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true');
  `);

  assert.equal(rules(findings).has('supabase-policy-user-metadata-authorization'), true);
});

test('flags SECURITY DEFINER functions created in exposed public schema', async () => {
  const findings = await scanSql(`
    create or replace function public.is_admin()
    returns boolean
    language sql
    security definer
    set search_path = ''
    as $$ select true $$;
  `);

  assert.equal(rules(findings).has('supabase-public-security-definer'), true);
});

test('flags public views that do not opt into security_invoker', async () => {
  const findings = await scanSql(`
    create table public.todos (id bigint, user_id uuid);
    alter table public.todos enable row level security;
    create view public.todo_view as select * from public.todos;
  `);

  assert.equal(rules(findings).has('supabase-public-view-without-security-invoker'), true);
});

test('does not flag hardened equivalents', async () => {
  const findings = await scanSql(`
    create table public.todos (id bigint, user_id uuid);
    alter table public.todos enable row level security;
    create policy "owner read" on public.todos
      for select to authenticated
      using ((select auth.uid()) = user_id);

    create schema if not exists private;
    create or replace function private.is_admin()
    returns boolean
    language sql
    security definer
    set search_path = ''
    as $$ select true $$;

    create view public.todo_view
      with (security_invoker = true)
      as select * from public.todos;
  `);

  const found = rules(findings);
  assert.equal(found.has('supabase-policy-deprecated-auth-role'), false);
  assert.equal(found.has('supabase-policy-user-metadata-authorization'), false);
  assert.equal(found.has('supabase-public-security-definer'), false);
  assert.equal(found.has('supabase-public-view-without-security-invoker'), false);
});
