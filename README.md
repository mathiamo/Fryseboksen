# Fryseboksen

Fryseboksen is a static React and Vite application hosted on GitHub Pages. It
uses Supabase for passwordless authentication, persistent freezer items, and
private image storage.

## Requirements

- Node.js 22
- pnpm 11
- A Supabase project

The expected tool versions are recorded in `.nvmrc` and `package.json`.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase project URL and publishable key.
3. Install dependencies with `pnpm install --frozen-lockfile`.
4. Start the app with `pnpm dev`.

Never put a Supabase secret key or service-role key in a `VITE_*` variable.
Vite embeds those variables in the browser bundle.

## IntelliJ IDEA setup

1. Open the repository folder containing `package.json`.
2. Select Node.js 22 under **Settings → Languages & Frameworks → Node.js**.
3. Select pnpm as the package manager.
4. Run `pnpm install --frozen-lockfile` in IntelliJ's terminal.
5. Ensure the TypeScript service uses the project's
   `node_modules/typescript` package.

The project includes `.editorconfig`, explicit Vite browser types, and plain
CSS without nesting so IntelliJ can inspect the source without additional CSS
plugins.

If imports remain red after installing dependencies, restart the TypeScript
service or use **File → Invalidate Caches**.

## Database migrations

Migration files live in `supabase/migrations` and run in timestamp order.
Apply pending migrations with the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

Row Level Security ensures authenticated users can only read and change their
own freezer items and images.

## GitHub Pages

`.github/workflows/deploy-pages.yml` builds and deploys pushes to `main`.
Configure these repository values:

- Variable: `VITE_SUPABASE_URL`
- Secret: `VITE_SUPABASE_PUBLISHABLE_KEY`

Also add the deployed Pages URL to the allowed redirect URLs in Supabase Auth.
The Vite base path is `/Fryseboksen/`; update it if the repository is renamed
or moved to a custom domain.

## Commands

- `pnpm dev` — start the local development server
- `pnpm typecheck` — run the TypeScript compiler
- `pnpm lint` — run ESLint
- `pnpm build` — type-check and create the production bundle
- `pnpm preview` — preview the production bundle locally
