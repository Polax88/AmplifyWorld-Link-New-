# AmplifyWorld Link

A page for every way a fan can support an artist — links, socials, media embeds,
tip jars, and gated content — built to grow with new features without
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
