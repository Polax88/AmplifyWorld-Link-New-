# Architecture

This document explains the extensibility decisions in this codebase — the
"why", for whoever adds the next feature.

## Guiding principle

Adding a feature should mean **adding files**, not editing a growing pile of
`if/else` or `switch` statements scattered across the app. Every extension
point below follows the same shape: a typed interface in `@amplifyworld/core`,
one or more implementations, and a registration step called once at startup.

## Monorepo layout

```
apps/web        Next.js app: rendering, routing, API, auth
packages/core   Framework-agnostic domain logic — no Next.js/Prisma imports
packages/database  Prisma schema + generated client, imported by apps/web
packages/ui     Shared React components
packages/config Shared tsconfig/eslint presets
```

`packages/core` has no dependency on Next.js or Prisma. That's intentional:
if AmplifyWorld ever needs a second surface (a mobile API, a background
worker, an admin CLI), it can depend on `@amplifyworld/core` without dragging
in a web framework. Turborepo + pnpm workspaces make adding that new `apps/*`
target a one-directory change, not a repo restructure.

## Extension point 1: Block types

A "block" is one row of content on an artist's page (a link, a social icon,
an embed, ...). Blocks are **polymorphic in the database** — `Block.type` is
a string and `Block.config` is JSON — so new block kinds never require a
migration.

To add a block type:

1. Create `packages/core/src/blocks/definitions/<name>.ts`:
   ```ts
   export const myBlock = defineBlock({
     type: 'my-block',
     displayName: 'My Block',
     description: '...',
     configSchema: z.object({ /* ... */ }),
     defaultConfig: { /* ... */ },
   });
   ```
2. Export it from `definitions/index.ts` and add it to `coreBlockDefinitions`.
3. Add `apps/web/src/components/blocks/MyBlockView.tsx` and one case in
   `BlockRenderer.tsx`.

Nothing else changes: the dashboard's "add block" picker
(`block.listAvailableTypes`), config validation (`blockRegistry.parseConfig`),
and persistence are all generic over `type`.

## Extension point 2: Feature flags

`FeatureFlag` rows support a boolean gate plus a 0-100 rollout percentage,
evaluated deterministically per-subject (a user or page id) in
`FeatureFlagService`. This lets a feature ship dark, get dialed in gradually,
and get killed instantly without a redeploy. Use it for anything risky enough
to want a kill switch — new block types, pricing changes, dashboard redesigns.

## Extension point 3: Domain events + webhooks

`packages/core/src/events` defines a small typed pub/sub bus
(`DomainEventMap`). App code publishes events (`page.published`,
`block.clicked`, ...) without knowing who's listening. Two listeners exist
today:

- Analytics (writes to `AnalyticsEvent`)
- The webhook dispatcher (`apps/web/src/server/services/webhook-dispatcher.ts`),
  which fans a published event out to every matching, active
  `WebhookSubscription`, HMAC-signed.

Adding a new reaction to an existing event (e.g. "send a welcome email on
`fan.subscribed`") means adding a new `domainEvents.on(...)` call — the
publishing code doesn't change. Adding a brand new event means adding one
line to `DomainEventMap` and publishing it where it happens.

## Extension point 4: External integrations

`fanwallet`, `hedera-api`, and `stake` are separate services/repos on
purpose. This app talks to them only through:

- `IntegrationConnection` (stores connection state + provider-owned config
  as JSON — this app doesn't interpret it beyond a status enum)
- Inbound webhooks at `POST /api/webhooks/[provider]`
- Outbound webhooks via `WebhookSubscription`

This keeps token-economics and eligibility logic for `$AMPS` entirely out of
this codebase and owned by the team(s) responsible for it — this app only
needs to know "is this connection ACTIVE", never "how does staking work".

## Extension point 5: The API layer

tRPC routers live in `apps/web/src/server/trpc/routers/`, one file per
domain, mounted in `_app.ts`. Adding an endpoint means adding a procedure to
the relevant router (or a new router file); the client
(`apps/web/src/lib/trpc/client.ts`) picks up full type safety automatically —
no schema generation step, no OpenAPI file to keep in sync.

Auth levels are middleware, composed once in `trpc.ts`:
`publicProcedure` → `protectedProcedure` (signed in) → `adminProcedure`
(signed in + `ADMIN` role). Add a new role check the same way if a
`MANAGER`-only endpoint is ever needed.

## Things deliberately deferred (not built, but designed for)

- **Multi-tenant theming**: `Page.theme` is already a free-form JSON column;
  a theme editor UI can be layered on without a schema change.
- **i18n**: no copy is hardcoded into shared components in a way that
  would block adding `next-intl` later; strings live in leaf components.
- **A second app** (admin panel, mobile BFF): the workspace structure
  already supports `apps/admin` etc. reusing `packages/core` and
  `packages/database` as-is.
- **Real-time updates** (e.g. live view counts): the domain event bus is the
  natural place to add a WebSocket/SSE broadcaster as an additional listener.

## What this app intentionally does not do

- No `$AMPS` token economics, pricing, or eligibility logic — see
  "Extension point 4".
- No legal/compliance decisions are encoded here (e.g. what content requires
  KYC/age-gating) — those are product/legal decisions to layer on top of the
  generic `gated-content` block, not assumptions baked into it.
