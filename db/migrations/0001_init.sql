-- Charges initial schema.
-- Run once in Supabase SQL Editor against the project database.

create extension if not exists "pgcrypto";

create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table expenses (
  id              uuid primary key default gen_random_uuid(),
  amount          numeric(12, 2) not null check (amount >= 0),
  date            date not null default current_date,
  category_id     uuid not null references categories(id) on delete restrict,
  merchant        text,
  notes           text,
  photo_path      text,
  source          text not null check (source in ('scan', 'manual')),
  extraction_raw  jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index expenses_date_idx        on expenses (date desc);
create index expenses_category_id_idx on expenses (category_id);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_set_updated_at
  before update on expenses
  for each row execute function set_updated_at();

insert into categories (name, sort_order) values
  ('Food',          10),
  ('Groceries',     20),
  ('Transport',     30),
  ('Rent',          40),
  ('Utilities',     50),
  ('Subscriptions', 60),
  ('Health',        70),
  ('Shopping',      80),
  ('Entertainment', 90),
  ('Travel',       100),
  ('Other',        110);
