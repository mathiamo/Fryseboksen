# Fryseboksen

Static React + Vite frontend for GitHub Pages, with persistent data, passwordless authentication, and private image storage in Supabase.

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/202608140001_freezer_items.sql` in its SQL editor.
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
4. Run `npm install` and `npm run dev`.

The migration enables Row Level Security so users can access only their own records and image folder. Never put a secret/service-role key in this frontend.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` deploys after pushes to `main`. Before the first deployment:

- Choose **GitHub Actions** under **Settings → Pages**.
- Add repository variable `VITE_SUPABASE_URL`.
- Add repository secret `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Add `https://mathiamo.github.io/Fryseboksen/` to Supabase Auth redirect URLs.

The Vite base path is `/Fryseboksen/`; update it if the repository is renamed or uses a custom domain.

## Commands

- `npm run dev` — local server
- `npm run build` — type-check and production build
- `npm run lint` — lint source
