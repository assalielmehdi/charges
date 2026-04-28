# Recurring Expense Templates Implementation Plan

## Goal

Add first-class management for monthly recurring expenses so the user no longer re-enters fixed expenses such as rent, savings transfers, and subscriptions every month.

Recurring expenses are modeled as templates that lazily generate real rows in the existing `expenses` table. Generated expenses participate in the existing ledger, totals, category filters, edit/delete flow, and future reporting exactly like manual or scanned expenses, with extra metadata that explains their origin and prevents duplicates.

## Resolved Product Requirements

### Core Model

- A recurring expense is a template.
- Templates generate real `expenses` rows.
- Generated rows use `source = 'recurring'`.
- `source` remains single-valued: `manual | scan | recurring`.
- If a generated row is edited directly, it remains `source = 'recurring'` and is marked as manually overridden.
- Generated rows keep their `recurring_template_id` link.
- Template edits affect only future or missing generated expenses. Existing generated expenses are historical facts and are not retroactively updated.
- Generated expenses are fully editable as normal expenses, except recurring metadata is protected.
- Generated recurring expense dates may be changed only within their own recurrence month.

### Template Fields

Each recurring template has:

- `name` required.
- `amount` fixed numeric amount.
- `day_of_month` integer from `1` to `31`.
- `category_id`.
- `merchant` optional.
- `notes` optional.
- `starts_on` required month-level date, stored normalized to first day of month.
- `ends_on` optional month-level date, stored normalized to first day of month.
- `is_active` for pause/resume state.
- archive metadata for final removal from normal management.

Generated expenses copy:

- `amount`.
- `category_id`.
- `merchant`, falling back to template `name` when merchant is blank.
- `notes`.
- generated `date`, based on `day_of_month` clamped to the last valid day of the month.

### Date and Eligibility Rules

- Recurrence is monthly only in v1.
- `starts_on` and `ends_on` are month-level fields.
- `starts_on = 2026-04-01` means April 2026 is eligible.
- `ends_on = 2026-06-01` means June 2026 is still eligible.
- Generated expense `date` is the clamped `day_of_month` within `recurrence_month`.
- If `day_of_month = 31` and the month has fewer days, use the month’s last day.
- Generate all eligible expenses for an opened month immediately, regardless of whether the day is later in the month.
- The generator supports any month, including future months, but v1 keeps the existing ledger UI rule that users cannot navigate past the current month unless that is intentionally changed later.

### Lazy Generation

- Expenses are generated automatically when a month is opened in the ledger.
- Generation runs before the ledger query so generated rows appear on the same page load.
- V1 only invokes generation from the home ledger route.
- Generation must be idempotent.
- Duplicate prevention is database-backed with unique `(recurring_template_id, recurrence_month)` for recurring rows.
- Generation must be all-or-none in a transaction.
- Implement generation as a Postgres RPC function, e.g. `ensure_recurring_expenses_for_month(target_month date)`.
- The RPC should use `on conflict do nothing` around the unique constraint so concurrent page loads cannot create duplicates.

### Create Current Month Behavior

- When creating a template, if the current month is eligible, show a checked-by-default checkbox: `Create for this month`.
- Do not auto-detect similar manual expenses.
- If `Create for this month` is unchecked, create a skip record for that template/current month so lazy generation does not add it later.
- If checked, generate the current month row immediately as part of the create flow, preferably by calling the same RPC after template creation.

### Skips

- Deleting a generated recurring expense creates a per-template/per-month skip record, then hard-deletes the expense row.
- Skip records prevent lazy generation from recreating the deleted/skipped month.
- Skip records are one-way in v1. There is no restore UI.
- If the user later needs the expense, they can create a normal manual expense.
- Skips include a reason using enum-ish checked text:
  - `deleted_generated_expense`
  - `unchecked_current_month`
  - `pause_effective_month`
  - `resume_unchecked_current_month`

### Pause and Resume

- Templates support reversible pause/resume through `is_active`.
- Pause/resume must have history, because months inside a paused period must not generate later.
- Add pause-period tracking rather than relying only on `is_active`.
- When pausing, the user chooses an effective month, defaulting to the current month.
- If a generated expense already exists for the effective current month, ask with a checked option to delete this month’s generated expense.
- Pausing does not auto-delete other historical rows.
- When resuming, the user chooses an effective month, defaulting to the current month.
- If resuming effective current month and no generated expense exists, show the same checked-by-default `Create for this month` option.
- If unchecked on resume, create a skip for that month.
- Months covered by a pause period never generate later, even after the template is resumed.

### Archive/Delete Template

- Template delete means archive/soft-delete, not physical deletion.
- Archived templates keep generated expenses linked.
- Archived templates are hidden by default with a `Show archived` toggle.
- Archived templates cannot be restored in v1.
- Once archived, a template never generates any new rows for any month, including historical missing months.
- Existing generated expenses remain visible in ledger/detail views.

### Category Rules

- Category deletion must be blocked if the category is referenced by any recurring template, active or archived.
- This extends the current “in-use categories cannot be deleted” rule.

### UI Requirements

- Add a dedicated Recurring screen.
- Add Recurring to main navigation:
  - desktop sidebar.
  - mobile bottom nav if there is room, otherwise mobile top/menu link.
- Primary action label: `New recurring expense`.
- Use dedicated routes/screens for recurring create/edit. Modal interception can come later.
- Reuse the visual structure and controls of the expense form where practical.
- Template `name` is separate from `merchant` and is editable.
- Recurring list item should show:
  - name.
  - amount.
  - category.
  - day of month.
  - active/paused state.
  - starts/ends summary.
  - current month status.
- Current month statuses:
  - `Generated`.
  - `Skipped`.
  - `Paused`.
  - `Missing`.
- Avoid `Not due yet` because all eligible rows generate immediately for the opened month.
- Recurring screen should show `Monthly recurring total`.
- For the total:
  - use the current-month generated expense amount when a generated row exists, including manual overrides.
  - otherwise use the template amount for eligible missing rows.
  - exclude skipped, paused, and archived templates.
- Ledger/detail views should visually distinguish recurring-generated rows with a subtle repeat icon/source label.
- Deleting a recurring-generated expense should show special confirmation copy: `Delete this month only?`
- Editing a recurring-generated expense should constrain the date picker to the recurrence month and also validate server-side.

## Proposed Database Migration

Create a new migration, likely `db/migrations/0004_recurring_expenses.sql`.

### Extend `expenses`

Add:

```sql
alter table expenses
  add column recurring_template_id uuid,
  add column recurrence_month date,
  add column recurring_overridden_at timestamptz;
```

Change source check to include `recurring`. Current source constraint was created inline, so inspect Supabase’s generated constraint name before writing final SQL. The migration should drop the existing check and add:

```sql
source in ('scan', 'manual', 'recurring')
```

Add the recurring integrity check:

```sql
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
```

Add date/month consistency for recurring rows:

```sql
source <> 'recurring'
or date >= recurrence_month
and date < recurrence_month + interval '1 month'
```

Add unique duplicate prevention:

```sql
create unique index expenses_recurring_template_month_key
  on expenses (recurring_template_id, recurrence_month)
  where recurring_template_id is not null;
```

Add indexes:

```sql
create index expenses_recurring_template_id_idx
  on expenses (recurring_template_id)
  where recurring_template_id is not null;

create index expenses_recurrence_month_idx
  on expenses (recurrence_month)
  where recurrence_month is not null;
```

### `recurring_expense_templates`

```sql
create table recurring_expense_templates (
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
```

Add indexes:

```sql
create index recurring_expense_templates_category_id_idx
  on recurring_expense_templates (category_id);

create index recurring_expense_templates_active_idx
  on recurring_expense_templates (is_active, archived_at, starts_on, ends_on);
```

Add updated-at trigger using existing `set_updated_at()`.

Add the FK from `expenses.recurring_template_id` after creating the table:

```sql
alter table expenses
  add constraint expenses_recurring_template_id_fkey
  foreign key (recurring_template_id)
  references recurring_expense_templates(id)
  on delete restrict;
```

### `recurring_expense_skips`

```sql
create table recurring_expense_skips (
  id uuid primary key default gen_random_uuid(),
  recurring_template_id uuid not null
    references recurring_expense_templates(id) on delete restrict,
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
  check (recurrence_month = date_trunc('month', recurrence_month)::date),
  unique (recurring_template_id, recurrence_month)
);
```

### `recurring_template_pauses`

Use month-level pause periods.

```sql
create table recurring_template_pauses (
  id uuid primary key default gen_random_uuid(),
  recurring_template_id uuid not null
    references recurring_expense_templates(id) on delete restrict,
  paused_from date not null,
  resumed_on date,
  created_at timestamptz not null default now(),
  check (paused_from = date_trunc('month', paused_from)::date),
  check (resumed_on is null or resumed_on = date_trunc('month', resumed_on)::date),
  check (resumed_on is null or resumed_on >= paused_from)
);
```

Generation treats a target month as paused if:

```sql
target_month >= paused_from
and (resumed_on is null or target_month < resumed_on)
```

Interpretation: `resumed_on` is the first active month after the pause.

### RLS

Follow existing single-user app pattern:

- no `user_id` on new tables.
- enable RLS.
- allow all authenticated users on the new recurring tables and RPC, consistent with `expenses` and `categories`.

Do not introduce mixed ownership only for recurring tables.

## RPC Design

Create:

```sql
ensure_recurring_expenses_for_month(target_month date)
```

Rules:

- Normalize `target_month` to first day of month inside the function.
- Reject null input.
- Insert generated `expenses` for eligible templates.
- Eligible means:
  - not archived.
  - active.
  - `starts_on <= month`.
  - `ends_on is null or ends_on >= month`.
  - no skip for `(template, month)`.
  - no pause period covering month.
- Insert fields:
  - `amount`.
  - `date = make_date(year, month, least(day_of_month, days_in_month))`.
  - `category_id`.
  - `merchant = nullif(template.merchant, '')`, falling back to `template.name`.
  - `notes`.
  - `source = 'recurring'`.
  - `recurring_template_id`.
  - `recurrence_month`.
- Use `on conflict on constraint/index equivalent do nothing`.
- Entire function runs transactionally as one statement/function call.

Use `security invoker` unless testing shows Supabase RLS prevents required inserts from the authenticated server call. If RLS blocks RPC execution, adjust policies rather than broadening privileges unnecessarily.

## Server/Application Changes

### Shared Types/Helpers

Add helpers for:

- month normalization to `YYYY-MM-01`.
- current month key.
- last day/clamped date if needed client-side for previews.
- recurrence month min/max date for edit validation.

Candidate location: `lib/format.ts` or new `lib/recurring.ts`.

### Ledger Loading

Update [app/page.tsx](/Users/assalielmehdi/workspace/projects/charges/app/page.tsx):

- Normalize selected `monthISO` to first-of-month date.
- Call RPC `ensure_recurring_expenses_for_month` before querying `expenses`.
- If RPC fails, show a clear load error and do not silently show an incomplete ledger.
- Query `expenses` with new fields needed by UI:
  - `recurring_template_id`
  - `recurrence_month`
  - `recurring_overridden_at`
  - maybe joined template name if needed for detail.

### Expense Actions

Update [app/expenses/actions.ts](/Users/assalielmehdi/workspace/projects/charges/app/expenses/actions.ts):

- `updateExpense`:
  - load existing expense before updating.
  - if `source = 'recurring'`, ensure submitted date is within `recurrence_month`.
  - set `recurring_overridden_at = now()` for recurring rows when edited.
  - never allow form data to change recurring metadata.
- `deleteExpense`:
  - load existing expense.
  - if recurring, insert skip with reason `deleted_generated_expense`, then delete expense.
  - because Supabase client calls are not transactional, prefer a small Postgres RPC for recurring delete, e.g. `delete_recurring_generated_expense(expense_id uuid)`, or implement delete inside a server-side DB function.
  - non-recurring delete remains the current hard delete.

### Category Actions

Update category deletion in [app/categories/actions.ts](/Users/assalielmehdi/workspace/projects/charges/app/categories/actions.ts):

- Count references from both `expenses` and `recurring_expense_templates`.
- Block deletion if either exists.
- Message should mention recurring templates when relevant.

### Recurring Routes

Add routes:

- `app/recurring/page.tsx`
- `app/recurring/new/page.tsx`
- `app/recurring/[id]/page.tsx`

Possible server actions:

- `createRecurringExpenseTemplate`
- `updateRecurringExpenseTemplate`
- `pauseRecurringExpenseTemplate`
- `resumeRecurringExpenseTemplate`
- `archiveRecurringExpenseTemplate`

Create a loader for categories and template status, similar to existing category/expense loaders.

### Navigation

Update:

- [components/shell/desktop-sidebar.tsx](/Users/assalielmehdi/workspace/projects/charges/components/shell/desktop-sidebar.tsx)
- [components/shell/mobile-bottom-bar.tsx](/Users/assalielmehdi/workspace/projects/charges/components/shell/mobile-bottom-bar.tsx)
- possibly [components/shell/mobile-top-bar.tsx](/Users/assalielmehdi/workspace/projects/charges/components/shell/mobile-top-bar.tsx) if mobile bottom bar is too crowded.

Use a repeat-style icon from `lucide-react`, such as `Repeat2`.

## UI Implementation Notes

### Recurring List Screen

Sections:

- Header: `Recurring`
- Summary:
  - monthly recurring total for current month.
  - count of active templates.
- Primary action: `New recurring expense`.
- Toggle: `Show archived`.
- List rows with:
  - template name.
  - category glyph/dot.
  - amount.
  - day label, e.g. `Day 1`, `Day 31 -> last day when needed` can stay implicit.
  - status pill: `Generated`, `Skipped`, `Paused`, `Missing`, `Archived`.
  - starts/ends summary.

Monthly total calculation:

- Prefer current-month generated recurring expense amount when present.
- Else use template amount for eligible, unpaused, unskipped active templates.
- Exclude archived, paused, skipped.

### New/Edit Template Screen

Fields:

- Name.
- Amount.
- Day of month.
- Category chips.
- Merchant optional.
- Notes optional.
- Starts month.
- Ends month optional.
- Active state only shown on edit, or controlled through pause/resume actions.
- Create/resume current-month checkbox when applicable.

Use month inputs in the UI (`YYYY-MM`) and convert to first-of-month dates on submit.

### Pause/Resume UI

Pause flow:

- Button: `Pause`.
- Ask for effective month, default current month.
- If an expense exists for that effective month and the month is current/effective visible context, show checked option: `Delete this month's generated expense`.
- Submit creates/updates a pause period and optionally deletes current generated row with skip.

Resume flow:

- Button: `Resume`.
- Ask for effective month, default current month.
- If current month is applicable and no generated row exists, show checked option: `Create for this month`.
- If unchecked, create skip reason `resume_unchecked_current_month`.

### Expense Detail/Edit UI

- Show recurring source label with repeat icon.
- Delete confirmation for recurring rows says `Delete this month only?`.
- Edit date input for recurring rows has min/max for recurrence month.
- Server validates date boundary.

## Testing Plan

### Database/RPC Tests

At minimum, manually verify in Supabase/local DB:

- RPC generates one row for an eligible active template.
- RPC is idempotent across repeated calls.
- Concurrent/double calls do not duplicate rows.
- `day_of_month = 31` clamps correctly for February and 30-day months.
- `starts_on` and `ends_on` are inclusive by month.
- skipped month does not generate.
- paused month does not generate.
- resumed month generates again.
- archived template never generates, including historical missing months.
- uniqueness prevents duplicate `(recurring_template_id, recurrence_month)`.
- check constraints reject half-recurring rows.
- recurring expense date outside recurrence month is rejected.

### App Tests / Manual QA

- Open ledger for current month with active templates: rows appear immediately.
- Monthly total includes generated rows.
- Generated recurring rows show repeat/source indicator.
- Edit generated row amount/notes/date within month: succeeds and marks overridden.
- Edit generated row date outside month: blocked in UI and rejected server-side.
- Delete generated recurring row: confirmation uses `Delete this month only?`, row is deleted, skip is created, reload does not recreate it.
- Create template with `Create for this month` checked: current row appears.
- Create template with checkbox unchecked: skip exists, reload does not create current row.
- Pause current month with delete checked: generated row removed and not recreated.
- Resume current month with create checked: generated row appears.
- Archive template: hidden by default, visible with `Show archived`, never generates again.
- Category deletion blocked when referenced by a recurring template.

## Suggested Implementation Order

1. Add DB migration for schema, constraints, RLS, RPC generation, and recurring delete helper RPC.
2. Update TypeScript expense types and `source` handling to include `recurring`.
3. Call generation RPC from the ledger before querying expenses.
4. Render recurring source indicator in ledger/detail.
5. Update expense edit/delete actions for recurring metadata, overrides, date constraints, and skips.
6. Add recurring list route with current-month status and monthly recurring total.
7. Add recurring create/edit routes and server actions.
8. Add pause/resume/archive actions and UI.
9. Update navigation.
10. Update category deletion blocking.
11. Run typecheck/lint and perform manual QA flows.

## Deferred From V1

- Fuzzy duplicate detection against existing manual expenses.
- Restore skipped generated expenses.
- Variable/estimated recurring amounts.
- Future-month navigation in the ledger UI.
- Restoring archived templates.
- Attaching receipts to existing recurring rows.
- Multi-user ownership with `user_id`; defer until all tables are migrated consistently.
