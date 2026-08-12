# Winter Arc

A cell of 4 to 5 people. One winter. Numbered goals, hit or missed,
visible to everyone, every day.

React + Vite + TypeScript + Tailwind, shared data via Supabase.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

## Backend (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the contents of [`supabase/schema.sql`](supabase/schema.sql)
   to create the `groups` table and enable realtime. The script is
   idempotent — safe to re-run after a schema update (e.g. when the
   `founder_id` column was added).
3. In **Project Settings > API**, grab the project **URL** and the
   **anon public** key — these are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Deployment (GitHub Pages)

The [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) workflow
builds and publishes to GitHub Pages automatically on every push to `main`.

One-time setup in the GitHub repo settings:

1. **Settings > Pages** → Source = **GitHub Actions**.
2. **Settings > Secrets and variables > Actions** → add two secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Push to `main` (or re-run the workflow manually) — the site is then
   served at `https://<owner>.github.io/winterarc/`.
