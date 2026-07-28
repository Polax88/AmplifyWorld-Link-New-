# AmplifyWorld Link

A page for every way a fan can support an artist — links, socials, media embeds,
and gated content — built to grow with new features without
rewrites. See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the extensibility
model works and how to add to it.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo (`apps/*`, `packages/*`)
- **Web app:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **API:** tRPC (end-to-end typed, no codegen)
- **Database:** PostgreSQL + Prisma
- **Auth:** Auth.js (NextAuth v5), pluggable providers
- **Testing:** Vitest (unit) + Playwright (e2e)
- **CI:** GitHub Actions (lint, typecheck, test, build, e2e)

## Getting started

Requires Node 20.9+ and pnpm 10+.

```bash
cp .env.example .env        # fill in real secrets
docker compose up -d        # starts local Postgres on :5432
pnpm install
pnpm db:generate
pnpm --filter @amplifyworld/database exec prisma migrate dev --name init
pnpm --filter @amplifyworld/database seed   # optional demo data
pnpm dev                    # http://localhost:3000
```

## Common commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build all apps/packages (Turborepo-cached) |
| `pnpm lint` / `pnpm typecheck` | Static checks across the whole repo |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | Playwright smoke tests against a built app |
| `pnpm db:studio` | Prisma Studio GUI for the local database |

## Deploying to Vercel

The repo is set up for zero-config Vercel deployment of a pnpm/Turborepo
monorepo. One-time project setup:

1. **Import the repo** in Vercel and set **Root Directory** to `apps/web`
   (Project Settings → General). Vercel still installs from the monorepo
   root automatically once it detects `pnpm-workspace.yaml`.
2. **Database** — from the Vercel dashboard, Storage tab → create a Postgres
   database (Neon-backed). This gives you a pooled and an unpooled/direct
   connection string. In Project Settings → Environment Variables, set:
   - `DATABASE_URL` → the **pooled** connection string
   - `DIRECT_URL` → the **unpooled/direct** connection string
   (Exact names Vercel auto-injects vary by product version — copy the
   pooled one into `DATABASE_URL` and the direct one into `DIRECT_URL`, or
   just reference the existing vars.)
3. **Other env vars** (Production + Preview): `NEXTAUTH_SECRET`
   (`openssl rand -base64 32`), `INTEGRATION_WEBHOOK_SECRET`
   (`openssl rand -hex 32`), `NEXT_PUBLIC_APP_URL` (your production domain).
   `NEXTAUTH_URL` can stay unset — `trustHost: true` in `auth.ts` makes
   Auth.js infer it per-deployment, including preview URLs.
4. **Build command** — already configured via `apps/web/vercel.json`, which
   runs `prisma migrate deploy` before `next build` on every deployment, so
   schema changes ship automatically. No dashboard override needed.
5. `packages/database`'s `prisma generate` runs automatically after install
   via the root `postinstall` script — nothing else to configure there.

After the first successful deploy, optionally run
`pnpm --filter @amplifyworld/database seed` against the production
`DATABASE_URL` (from your machine or a one-off Vercel CLI run) to create a
demo page.

## Repository layout

```
apps/
  web/                Next.js app — public pages, artist dashboard, API routes
packages/
  core/               Domain logic: block registry, feature flags, event bus
  database/           Prisma schema + generated client
  ui/                 Shared React components
  config/             Shared ESLint/TypeScript config
```

## Relationship to the wider AmplifyWorld ecosystem

This app deliberately does **not** import `fanwallet`, `hedera-api`, or `stake`
directly. It integrates with them at arm's length via:

- **Outbound:** `WebhookSubscription` rows + the domain event bus — see
  `apps/web/src/server/services/webhook-dispatcher.ts`.
- **Inbound:** `POST /api/webhooks/[provider]`, which flips an
  `IntegrationConnection` to `ACTIVE` and emits `integration.connected`.

This keeps the four services independently deployable and testable, and
keeps token-economics / eligibility logic for `$AMPS` out of this codebase —
that belongs to, and should be reviewed by, the team(s) that own it.
