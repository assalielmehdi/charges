-- Enable Row Level Security and grant the `authenticated` role full access.
-- Single-user app: signup is locked down in the Supabase dashboard and the
-- /login server action enforces a one-email allowlist, so any authenticated
-- session is by definition the owner.

alter table categories enable row level security;
alter table expenses   enable row level security;

create policy "authenticated_all_categories"
  on categories for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_expenses"
  on expenses for all
  to authenticated
  using (true)
  with check (true);
