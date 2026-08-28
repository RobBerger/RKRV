# RV Park Tracker

A simple, shared CRM for tracking RV parks under evaluation for acquisition. Built for two
users (e.g. you and your spouse) who both see and edit the same records — there's no
multi-tenancy or per-user data isolation.

**Stack:** Next.js (App Router, TypeScript) · Supabase (Postgres + Auth) · Tailwind CSS · Vercel

## Features

- Email/password login via Supabase Auth. Everything behind login — no public access.
- Sortable, filterable parks table (filter by status/state, search name/city/owner).
- Park detail page with inline-editable fields and a per-park activity timeline.
- Mobile-friendly layout (card view on small screens, table on larger ones).
- CLI script to bulk-import parks from a CSV file.

## Project structure

```
src/
  app/
    login/            Login page
    parks/new/         Add-park form
    parks/[id]/         Park detail (inline edit + activity timeline)
    page.tsx            Main parks list
  components/           UI components
  lib/supabase/          Supabase client helpers (browser, server, middleware)
  types/database.ts      Hand-written types matching the DB schema
  proxy.ts               Auth-gating middleware (redirects to /login when signed out)
supabase/migrations/     SQL migration(s) — source of truth for the schema
scripts/import-csv.ts    CLI CSV importer
```

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run the contents of
   [`supabase/migrations/20260825000000_init.sql`](supabase/migrations/20260825000000_init.sql).
   (Or, if you use the Supabase CLI: `supabase link` then `supabase db push`.)
3. Under **Authentication → Providers**, make sure Email is enabled.
4. Under **Authentication → Users**, manually create the two accounts (yours and your
   wife's) with **Add user**. Since this app has no public sign-up page, accounts are
   created directly in the Supabase dashboard.
5. Under **Project Settings → API**, copy the **Project URL**, the **anon/public key**,
   and (for the CSV import script only) the **service_role key**.

## 2. Configure environment variables

Copy the example file and fill in the values from step 1:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # only needed for scripts/import-csv.ts
```

`.env.local` is gitignored and never committed.

## 3. Run locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.
Sign in with one of the accounts you created in Supabase.

## 4. Deploy to Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In Vercel, **Add New Project** and import the repo. Framework preset: Next.js (auto-detected).
3. Add the environment variables from `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) under **Project Settings → Environment Variables**.
   You don't need `SUPABASE_SERVICE_ROLE_KEY` on Vercel — that's only used by the local
   CSV import script.
4. Deploy. Every push to your main branch redeploys automatically.

In Supabase, under **Authentication → URL Configuration**, add your Vercel deployment
URL to the allowed redirect/site URLs list.

## CSV import script

`scripts/import-csv.ts` reads a `parks.csv` file and inserts rows into the `parks` table
using the service role key (which bypasses Row Level Security).

```bash
npm run import-csv -- path/to/parks.csv
```

If no path is given, it looks for `parks.csv` in the project root. Requires
`SUPABASE_SERVICE_ROLE_KEY` to be set in `.env.local`. The script prints a summary of
rows inserted/skipped and reports any row-level errors without aborting the whole import.

## Schema changes

The schema lives in [`supabase/migrations/`](supabase/migrations/). To change it, add a
new timestamped `.sql` file to that folder (don't edit old migrations) and run it against
your Supabase project via the SQL Editor or `supabase db push`.
