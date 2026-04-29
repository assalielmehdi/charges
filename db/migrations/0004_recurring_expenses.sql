-- Monthly recurring expense templates and lazy generation.

alter table expenses
  add column if not exists recurring_template_id uuid,
  add column if not exists recurrence_month date,
  add column if not exists recurring_overridden_at timestamptz;

do $$
declare
  constraint_name text;
begin
  select c.conname into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'expenses'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%source%'
    and pg_get_constraintdef(c.oid) like '%manual%'
    and pg_get_constraintdef(c.oid) like '%scan%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table expenses drop constraint %I', constraint_name);
  end if;
end $$;

alter table expenses
  add constraint expenses_source_check
  check (source in ('scan', 'manual', 'recurring'));

alter table expenses
  add constraint expenses_recurring_metadata_check
  check (
    (
      source = 'recurring'
      and recurring_template_id is not null
      and recurrence_month is not null
    )
    or
    (
      source <> 'recurring'
      and recurring_template_id is null
      and recurrence_month is null
      and recurring_overridden_at is null
    )
  );

alter table expenses
  add constraint expenses_recurring_date_month_check
  check (
    source <> 'recurring'
    or (
      date >= recurrence_month
      and date < (recurrence_month + interval '1 month')
    )
  );

create table if not exists recurring_expense_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  day_of_month int not null check (day_of_month between 1 and 31),
  category_id uuid not null references categories(id) on delete restrict,
  merchant text,
  notes text,
  starts_on date not null,
  ends_on date,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_on = date_trunc('month', starts_on)::date),
  check (ends_on is null or ends_on = date_trunc('month', ends_on)::date),
  check (ends_on is null or ends_on >= starts_on)
);

alter table expenses
  add constraint expenses_recurring_template_id_fkey
  foreign key (recurring_template_id)
  references recurring_expense_templates(id)
  on delete restrict;

create table if not exists recurring_expense_skips (
  id uuid primary key default gen_random_uuid(),
  recurring_template_id uuid not null references recurring_expense_templates(id) on delete restrict,
  recurrence_month date not null,
  reason text not null check (
    reason in (
      'deleted_generated_expense',
      'unchecked_current_month',
      'pause_effective_month',
      'resume_unchecked_current_month'
    )
  ),
  created_at timestamptz not null default now(),
  unique (recurring_template_id, recurrence_month),
  check (recurrence_month = date_trunc('month', recurrence_month)::date)
);

create table if not exists recurring_expense_pause_periods (
  id uuid primary key default gen_random_uuid(),
  recurring_template_id uuid not null references recurring_expense_templates(id) on delete restrict,
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  check (starts_on = date_trunc('month', starts_on)::date),
  check (ends_on is null or ends_on = date_trunc('month', ends_on)::date),
  check (ends_on is null or ends_on >= starts_on)
);

create unique index if not exists expenses_recurring_template_month_key
  on expenses (recurring_template_id, recurrence_month)
  where recurring_template_id is not null;

create index if not exists expenses_recurring_template_id_idx
  on expenses (recurring_template_id)
  where recurring_template_id is not null;

create index if not exists expenses_recurrence_month_idx
  on expenses (recurrence_month)
  where recurrence_month is not null;

create index if not exists recurring_expense_templates_category_id_idx
  on recurring_expense_templates (category_id);

create index if not exists recurring_expense_templates_active_idx
  on recurring_expense_templates (starts_on, ends_on, is_active)
  where archived_at is null;

create index if not exists recurring_expense_skips_template_month_idx
  on recurring_expense_skips (recurring_template_id, recurrence_month);

create index if not exists recurring_expense_pause_periods_template_idx
  on recurring_expense_pause_periods (recurring_template_id, starts_on, ends_on);

drop trigger if exists recurring_expense_templates_set_updated_at on recurring_expense_templates;
create trigger recurring_expense_templates_set_updated_at
  before update on recurring_expense_templates
  for each row execute function set_updated_at();

create or replace function ensure_recurring_expenses_for_month(target_month date)
returns void language plpgsql as $$
declare
  normalized_month date := date_trunc('month', target_month)::date;
begin
  insert into expenses (
    amount,
    date,
    category_id,
    merchant,
    notes,
    source,
    recurring_template_id,
    recurrence_month
  )
  select
    t.amount,
    make_date(
      extract(year from normalized_month)::int,
      extract(month from normalized_month)::int,
      least(
        t.day_of_month,
        extract(day from (normalized_month + interval '1 month - 1 day'))::int
      )
    ),
    t.category_id,
    coalesce(nullif(t.merchant, ''), t.name),
    t.notes,
    'recurring',
    t.id,
    normalized_month
  from recurring_expense_templates t
  where t.archived_at is null
    and t.is_active = true
    and t.starts_on <= normalized_month
    and (t.ends_on is null or t.ends_on >= normalized_month)
    and not exists (
      select 1
      from recurring_expense_skips s
      where s.recurring_template_id = t.id
        and s.recurrence_month = normalized_month
    )
    and not exists (
      select 1
      from recurring_expense_pause_periods p
      where p.recurring_template_id = t.id
        and p.starts_on <= normalized_month
        and (p.ends_on is null or p.ends_on >= normalized_month)
    )
  on conflict (recurring_template_id, recurrence_month)
    where recurring_template_id is not null
  do nothing;
end;
$$;

alter table recurring_expense_templates enable row level security;
alter table recurring_expense_skips enable row level security;
alter table recurring_expense_pause_periods enable row level security;

create policy "authenticated_all_recurring_expense_templates"
  on recurring_expense_templates for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_recurring_expense_skips"
  on recurring_expense_skips for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_recurring_expense_pause_periods"
  on recurring_expense_pause_periods for all
  to authenticated
  using (true)
  with check (true);

grant execute on function ensure_recurring_expenses_for_month(date) to authenticated;
