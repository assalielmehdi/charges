# Charges — MVP Plan

A personal expense-tracking PWA for better monthly salary spend management. Solo tool, not a SaaS.

## Problem

Tracking monthly purchases is currently ad-hoc. Need a single place to log:
- Fixed monthly expenses (rent, internet, subscriptions: Netflix, YouTube, ChatGPT, …).
- Ad-hoc and unexpected purchases (food variation, home DIY, …).

…and quickly consult what was spent.

## MVP scope

In:
1. Login page (Supabase Auth, magic link to a single allowlisted email) + middleware that gates every route.
2. Manual entry of an expense.
3. Scan/upload an invoice — Claude vision extracts fields, user reviews before save.
4. Tag a purchase with a single category (seeded list, user-extensible).
5. Flat chronological history with filters by category and date range.
6. Edit/delete an expense (destructive, no audit log).
7. Categories management page (add/rename/delete).
8. Deployed to Vercel with monthly Anthropic spend cap.

Explicitly out (v2 candidates):
- Recurring/subscription templates and auto-spawning.
- Monthly summaries, charts, category breakdowns.
- Budgets and alerts.
- Multi-currency.
- Offline support / sync queue.
- Push notifications.
- CSV/JSON export.
- Multi-user.
- Audit log of edits.

## Locked design decisions

| Area | Decision |
|---|---|
| Form factor | Web + PWA (camera access, install-to-homescreen). |
| Audience | Single user. Supabase Auth (magic link to email), single allowlisted email enforced server-side. `middleware.ts` redirects unauthenticated requests to `/login`. |
| Scanning | Claude vision LLM. Language-agnostic prompt (Arabic / French / English). Always review-before-save. |
| Currency | MAD only. Single `amount` column. |
| Recurring expenses | Manual entry like any other expense (no templates in MVP). |
| Categories | Seeded list, user-extensible. **Single** category per expense. |
| Category seed | Food, Groceries, Transport, Rent, Utilities, Subscriptions, Health, Shopping, Entertainment, Travel, Other. |
| History view | Flat chronological list with category + date-range filters. No summaries/charts. |
| Edits | Editable & deletable, destructive. |
| Photo retention | Keep forever in private Supabase Storage bucket. |
| Offline | Online-only for MVP. |
| Tests | None for MVP. Solo personal app, user is QA. |

## Expense schema

| Field | Required | Notes |
|---|---|---|
| `amount` (MAD, decimal) | yes | The whole point. |
| `date` | yes | Defaults to today; editable. |
| `category` | yes | From seeded list; defaults to last-used or `Other`. |
| `merchant` (text) | no | Extracted by LLM; user can blank it on manual entry. |
| `notes` (text) | no | Free-form. |
| `photo` (Storage ref) | no | Only for scanned ones. |
| `source` enum | auto | `scan` \| `manual`. |
| `extraction_raw` jsonb | auto | LLM raw response, lets you re-process later. |
| `created_at` / `updated_at` | auto | Standard. |

Plus a `categories(id, name, icon?, color?)` table seeded on first run.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui.
- **PWA:** `next-pwa` plugin (or manual service worker) — manifest + offline shell only, no offline data sync.
- **DB:** Supabase Postgres. SQL migration files committed in repo (no ORM — overkill for two tables).
- **Storage:** Supabase Storage, private `receipts/` bucket.
- **LLM:** Anthropic SDK. `claude-opus-4-7` for vision (or `claude-haiku-4-5-20251001` if cost matters — Haiku is sufficient for receipt parsing).
- **Hosting:** Vercel (Hobby tier).
- **Auth:** Supabase Auth via `@supabase/ssr` (magic link / email OTP). Allowlist of one email is enforced in the `/login` server action (compare against `APP_AUTHORIZED_EMAIL`) and in the Supabase dashboard (signups disabled, single user invited). `middleware.ts` refreshes the Supabase session cookie on every request and redirects unauthenticated traffic to `/login`. RLS is enabled on all tables and policies allow the `authenticated` role only.

## Safety rails

- **Anthropic API key spend cap.** Hard monthly cap (e.g. $10) configured in the Anthropic console — protects against bugs (infinite loops) and any auth bypass.
- **Review-before-save on scans.** Vision models occasionally hallucinate totals on faded thermal receipts; one human glance per scan is cheap insurance.
- **Private Supabase bucket + cookie-gated API routes.** Receipts often show card last-4 / addresses; never expose the bucket publicly.

## Build order (milestones)

1. ~~**Skeleton.** `git init`, Next.js + Tailwind + shadcn scaffold, Supabase project, deploy a "hello world" to Vercel. Confirms the pipe works end-to-end.~~ ✅ Local scaffold done (Next.js 14 App Router + TS, Tailwind v4, shadcn `Button` rendering at `/`). Remaining external steps for the user: create Supabase project, push repo to GitHub, deploy on Vercel.
2. ~~**Auth + schema.** Postgres schema (`expenses`, `categories`), seed categories, RLS enabled, `/login` magic-link page (Supabase Auth via `@supabase/ssr`), `/auth/callback` route, `middleware.ts` refreshes session and gates every route, single-email allowlist enforced server-side.~~ ✅ Migrations applied (`0001_init.sql`, `0002_auth_rls.sql`), Supabase Auth configured (signups disabled, single user invited, Site URL + wildcard redirects), env vars set in `.env.local` and Vercel. End-to-end magic-link login verified locally.
3. ~~**Manual entry + list.** Add-expense form (amount required, date defaults today, category chips). Flat chronological list. *App is already useful here — start logging real expenses.*~~ ✅ Home (`/`) shows chronological list of expenses with category chip + MAD-formatted amount; `/expenses/new` has the add form (amount, date defaults today, category chips defaulting to last-used or `Other`, optional merchant/notes). `createExpense` server action inserts with `source='manual'` and revalidates `/`.
4. ~~**Edit/delete + filters.** Tap a row to edit/delete; filter list by category and date range.~~ ✅ Rows on `/` link to `/expenses/[id]` (full edit form + destructive Delete button). Filter bar on `/` (category chips + from/to date inputs) drives URL search params; date range defaults to current month. Form fields extracted to a shared `ExpenseFormFields` client component reused by create + edit. Total + entry count shown above the list.
5. ~~**Categories management.** Settings page to add/rename/delete categories.~~ ✅ `/categories` page lists categories with inline rename + destructive delete; "New category" form prepends to the list. Delete-in-use is blocked by the FK and surfaces a "N expenses use this — reassign first" message (no merge flow). New categories get `sort_order = max + 10` so they append at the bottom. Linked from a "Manage categories →" link inside the home filter dialog.
6. **Scan flow.** `/api/scan` route → upload to Supabase Storage → Claude vision call (multi-lingual prompt) → review-before-save form pre-filled with extracted fields → save. Built last because it's the riskiest piece (prompt iteration, edge cases) and the manual-entry path is a working fallback throughout.
7. **Polish + dogfood.** Use the app daily for a week. Fix what hurts. Then declare done.

Principles baked into the order:
- **Manual entry before scanning.** App must be usable with zero LLM calls.
- **Deploy from milestone 1, not milestone 7.** Vercel preview URLs let you test the actual mobile experience as you build.

## Risks & open flags

- **Scan-review form is more UX work than it sounds** — date picker, category chip selector, currency-formatted amount input, photo preview, all on mobile. Budget extra time for milestone 6.
- **Vercel URLs are scanned by bots within hours of deploy.** The Supabase Auth + email-allowlist gate is non-optional from milestone 1 onward — never deploy a route that calls Anthropic without confirming `supabase.auth.getUser()` returns a real, allowlisted user.
- **Prompt iteration is the moat.** Spend time on the vision prompt: explicit JSON schema, currency = MAD assumption, languages = AR/FR/EN, instruct it to return `null` for fields it can't read confidently rather than guessing.
