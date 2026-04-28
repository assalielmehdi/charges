-- Private bucket for receipt photos. Single-user app: any authenticated session
-- is by definition the owner (signups locked, allowlist enforced in /login),
-- so we don't bother with per-row owner checks on storage.objects.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "authenticated_select_receipts"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts');

create policy "authenticated_insert_receipts"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

create policy "authenticated_delete_receipts"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts');
