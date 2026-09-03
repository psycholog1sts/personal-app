create table public.notes (
  id bigint generated always as identity primary key,
  user_id uuid,
  body text
);
