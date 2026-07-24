/**
 * In-memory "demo mode" stand-in for the Prisma client.
 *
 * This project normally talks to a real Postgres database via Prisma, and its
 * production build runs `prisma migrate deploy` before `next build`. That step
 * fails when the live database's schema doesn't match the migration history
 * (Prisma P3005), which blocks deploys.
 *
 * To keep the app deployable and demoable without a live database, this module
 * implements just enough of the Prisma Client query API used across the app,
 * backed by plain in-memory arrays and seeded with realistic demo data. It is
 * intentionally NOT a full Prisma engine — it only supports the specific
 * query shapes this codebase issues.
 *
 * Data lives for the lifetime of the server process (per serverless instance),
 * so mutations feel real within a session but reset on cold starts. That's the
 * desired behaviour for a self-contained demo.
 */

type Row = Record<string, unknown>;

function cuid(prefix = 'c'): string {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function isPlainObject(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

const OPERATOR_KEYS = new Set(['has', 'in', 'equals', 'not', 'gt', 'gte', 'lt', 'lte', 'contains']);

function isOperatorObject(value: unknown): value is Row {
  return isPlainObject(value) && Object.keys(value).some((key) => OPERATOR_KEYS.has(key));
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return a === b;
}

/** Evaluates the subset of Prisma `where` filters this app relies on. */
function matches(row: Row, where: Row | undefined): boolean {
  if (!where) return true;
  for (const [key, condition] of Object.entries(where)) {
    const value = row[key];

    if (isOperatorObject(condition)) {
      if ('has' in condition) {
        if (!Array.isArray(value) || !value.includes(condition.has)) return false;
        continue;
      }
      if ('in' in condition) {
        const list = condition.in as unknown[];
        if (!Array.isArray(list) || !list.some((item) => valuesEqual(item, value))) return false;
        continue;
      }
      if ('equals' in condition) {
        if (!valuesEqual(value, condition.equals)) return false;
        continue;
      }
      if ('not' in condition) {
        if (valuesEqual(value, condition.not)) return false;
        continue;
      }
      // Unsupported operator — treat as non-matching rather than silently passing.
      return false;
    }

    // Composite unique key (e.g. `ownerId_provider: { ownerId, provider }`).
    if (!(key in row) && isPlainObject(condition)) {
      if (!matches(row, condition)) return false;
      continue;
    }

    if (!valuesEqual(value, condition)) return false;
  }
  return true;
}

function orderRows<T extends Row>(rows: T[], orderBy: Row | undefined): T[] {
  if (!orderBy) return rows;
  const [field, direction] = Object.entries(orderBy)[0] ?? [];
  if (!field) return rows;
  const dir = direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av instanceof Date && bv instanceof Date) return (av.getTime() - bv.getTime()) * dir;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * The single source of truth for the demo. Each property is a table of rows.
 */
const db = {
  users: [] as Row[],
  pages: [] as Row[],
  blocks: [] as Row[],
  featureFlags: [] as Row[],
  analyticsEvents: [] as Row[],
  integrationConnections: [] as Row[],
  webhookSubscriptions: [] as Row[],
};

function resolvePageIncludes(page: Row, include: Row | undefined): Row {
  const result = clone(page);
  if (!include) return result;

  if (include.blocks) {
    const blockInclude = isPlainObject(include.blocks) ? include.blocks : {};
    let blocks = db.blocks.filter((block) => block.pageId === page.id);
    blocks = blocks.filter((block) => matches(block, blockInclude.where as Row | undefined));
    blocks = orderRows(blocks, blockInclude.orderBy as Row | undefined);
    result.blocks = blocks.map((block) => clone(block));
  }

  const count = include._count;
  if (isPlainObject(count) && isPlainObject(count.select)) {
    const countResult: Row = {};
    if (count.select.analyticsEvents) {
      countResult.analyticsEvents = db.analyticsEvents.filter((event) => event.pageId === page.id).length;
    }
    result._count = countResult;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Model delegates — each mirrors the Prisma delegate methods the app calls.
// ---------------------------------------------------------------------------

const pageDelegate = {
  async findMany(args: { where?: Row; orderBy?: Row; include?: Row } = {}) {
    let rows = db.pages.filter((page) => matches(page, args.where));
    rows = orderRows(rows, args.orderBy);
    return rows.map((page) => resolvePageIncludes(page, args.include));
  },
  async findUnique(args: { where: Row; include?: Row }) {
    const page = db.pages.find((row) => matches(row, args.where));
    return page ? resolvePageIncludes(page, args.include) : null;
  },
  async create(args: { data: Row }) {
    const timestamp = new Date();
    const page: Row = {
      id: cuid('page_'),
      handle: '',
      title: '',
      bio: null,
      avatarUrl: null,
      theme: {},
      status: 'DRAFT',
      createdAt: timestamp,
      updatedAt: timestamp,
      ...args.data,
    };
    db.pages.push(page);
    return clone(page);
  },
  async update(args: { where: Row; data: Row }) {
    const page = db.pages.find((row) => matches(row, args.where));
    if (!page) throw new Error('Demo record not found: page');
    Object.assign(page, args.data, { updatedAt: new Date() });
    return clone(page);
  },
};

const blockDelegate = {
  async findFirst(args: { where?: Row; orderBy?: Row } = {}) {
    let rows = db.blocks.filter((block) => matches(block, args.where));
    rows = orderRows(rows, args.orderBy);
    return rows[0] ? clone(rows[0]) : null;
  },
  async findUnique(args: { where: Row }) {
    const block = db.blocks.find((row) => matches(row, args.where));
    return block ? clone(block) : null;
  },
  async create(args: { data: Row }) {
    const timestamp = new Date();
    const block: Row = {
      id: cuid('block_'),
      position: 0,
      isEnabled: true,
      config: {},
      createdAt: timestamp,
      updatedAt: timestamp,
      ...args.data,
    };
    db.blocks.push(block);
    return clone(block);
  },
  async update(args: { where: Row; data: Row }) {
    const block = db.blocks.find((row) => matches(row, args.where));
    if (!block) throw new Error('Demo record not found: block');
    Object.assign(block, args.data, { updatedAt: new Date() });
    return clone(block);
  },
  async delete(args: { where: Row }) {
    const index = db.blocks.findIndex((row) => matches(row, args.where));
    if (index === -1) throw new Error('Demo record not found: block');
    const [removed] = db.blocks.splice(index, 1);
    return clone(removed);
  },
};

const featureFlagDelegate = {
  async findMany(args: { where?: Row; orderBy?: Row } = {}) {
    let rows = db.featureFlags.filter((flag) => matches(flag, args.where));
    rows = orderRows(rows, args.orderBy);
    return rows.map((flag) => clone(flag));
  },
  async findUnique(args: { where: Row }) {
    const flag = db.featureFlags.find((row) => matches(row, args.where));
    return flag ? clone(flag) : null;
  },
  async upsert(args: { where: Row; create: Row; update: Row }) {
    const existing = db.featureFlags.find((row) => matches(row, args.where));
    const timestamp = new Date();
    if (existing) {
      Object.assign(existing, args.update, { updatedAt: timestamp });
      return clone(existing);
    }
    const flag: Row = {
      id: cuid('flag_'),
      description: null,
      isEnabled: false,
      rolloutPercentage: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...args.create,
    };
    db.featureFlags.push(flag);
    return clone(flag);
  },
};

const analyticsEventDelegate = {
  async create(args: { data: Row }) {
    const event: Row = {
      id: cuid('evt_'),
      blockId: null,
      fanId: null,
      metadata: {},
      occurredAt: new Date(),
      ...args.data,
    };
    db.analyticsEvents.push(event);
    return clone(event);
  },
  async groupBy(args: { by: string[]; where?: Row }) {
    const rows = db.analyticsEvents.filter((event) => matches(event, args.where));
    const groups = new Map<string, number>();
    for (const row of rows) {
      const key = String(row[args.by[0]]);
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    return [...groups.entries()].map(([type, count]) => ({ type, _count: { _all: count } }));
  },
};

const integrationConnectionDelegate = {
  async upsert(args: { where: Row; create: Row; update: Row }) {
    const existing = db.integrationConnections.find((row) => matches(row, args.where));
    const timestamp = new Date();
    if (existing) {
      Object.assign(existing, args.update, { updatedAt: timestamp });
      return clone(existing);
    }
    const connection: Row = {
      id: cuid('conn_'),
      externalId: null,
      config: {},
      status: 'PENDING',
      createdAt: timestamp,
      updatedAt: timestamp,
      ...args.create,
    };
    db.integrationConnections.push(connection);
    return clone(connection);
  },
};

const webhookSubscriptionDelegate = {
  async findMany(args: { where?: Row; orderBy?: Row } = {}) {
    let rows = db.webhookSubscriptions.filter((sub) => matches(sub, args.where));
    rows = orderRows(rows, args.orderBy);
    return rows.map((sub) => clone(sub));
  },
};

const userDelegate = {
  async findUnique(args: { where: Row }) {
    const user = db.users.find((row) => matches(row, args.where));
    return user ? clone(user) : null;
  },
  async create(args: { data: Row }) {
    const timestamp = new Date();
    const user: Row = {
      id: cuid('user_'),
      name: null,
      image: null,
      emailVerified: null,
      role: 'ARTIST',
      createdAt: timestamp,
      updatedAt: timestamp,
      ...args.data,
    };
    db.users.push(user);
    return clone(user);
  },
  async upsert(args: { where: Row; create: Row; update: Row }) {
    const existing = db.users.find((row) => matches(row, args.where));
    const timestamp = new Date();
    if (existing) {
      Object.assign(existing, args.update, { updatedAt: timestamp });
      return clone(existing);
    }
    return this.create({ data: { ...args.where, ...args.create } });
  },
};

// ---------------------------------------------------------------------------
// Seed data — a realistic, published demo artist page.
// ---------------------------------------------------------------------------

export const DEMO_USER_ID = 'demo-user';
export const DEMO_PAGE_ID = 'demo-page';

function seed(): void {
  const now = new Date();

  db.users.push({
    id: DEMO_USER_ID,
    email: 'demo@amplifyworld.ai',
    emailVerified: now,
    name: 'Nova Vale',
    image: null,
    role: 'ADMIN',
    createdAt: now,
    updatedAt: now,
  });

  db.pages.push({
    id: DEMO_PAGE_ID,
    handle: 'demo-artist',
    title: 'Nova Vale',
    bio: 'Independent electronic artist. New single "Afterglow" out now — links to everything below.',
    avatarUrl: null,
    theme: {},
    status: 'PUBLISHED',
    ownerId: DEMO_USER_ID,
    createdAt: now,
    updatedAt: now,
  });

  const blocks: Array<{ type: string; config: Row }> = [
    { type: 'link', config: { label: 'Stream "Afterglow"', url: 'https://open.spotify.com' } },
    { type: 'embed', config: { provider: 'spotify', embedUrl: 'https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl', title: 'Afterglow' } },
    { type: 'link', config: { label: 'Tour dates & tickets', url: 'https://example.com/tour' } },
    { type: 'link', config: { label: 'Merch store', url: 'https://example.com/merch' } },
    { type: 'social', config: { platform: 'instagram', handle: 'novavale', url: 'https://instagram.com/novavale' } },
    { type: 'social', config: { platform: 'tiktok', handle: 'novavale', url: 'https://tiktok.com/@novavale' } },
    { type: 'tip-jar', config: { label: 'Support the music', checkoutUrl: 'https://example.com/tip', suggestedAmounts: [5, 10, 25] } },
  ];

  blocks.forEach((block, position) => {
    db.blocks.push({
      id: `demo-block-${position}`,
      pageId: DEMO_PAGE_ID,
      type: block.type,
      position,
      isEnabled: true,
      config: block.config,
      createdAt: now,
      updatedAt: now,
    });
  });

  // A believable analytics history so the dashboard shows real numbers.
  const seedEvents = (type: string, count: number, blockId?: string) => {
    for (let i = 0; i < count; i++) {
      db.analyticsEvents.push({
        id: cuid('evt_'),
        type,
        pageId: DEMO_PAGE_ID,
        blockId: blockId ?? null,
        fanId: null,
        metadata: {},
        occurredAt: new Date(now.getTime() - i * 60_000),
      });
    }
  };
  seedEvents('PAGE_VIEW', 1284);
  seedEvents('BLOCK_CLICK', 213, 'demo-block-0');
  seedEvents('BLOCK_CLICK', 96, 'demo-block-2');

  db.featureFlags.push(
    {
      id: cuid('flag_'),
      key: 'gated-content-blocks',
      description: 'Enable the gated-content block type in the dashboard block picker.',
      isEnabled: true,
      rolloutPercentage: 100,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: cuid('flag_'),
      key: 'ai-onboarding-wizard',
      description: 'Route "New page" to the AI-assisted onboarding wizard instead of the blank-canvas modal.',
      isEnabled: true,
      rolloutPercentage: 100,
      createdAt: now,
      updatedAt: now,
    },
  );
}

seed();

/**
 * Object shaped like the parts of `PrismaClient` the app uses. Cast to
 * `PrismaClient` at the export site so every call site keeps its real,
 * type-safe Prisma signatures.
 */
export const demoPrisma = {
  user: userDelegate,
  page: pageDelegate,
  block: blockDelegate,
  featureFlag: featureFlagDelegate,
  analyticsEvent: analyticsEventDelegate,
  integrationConnection: integrationConnectionDelegate,
  webhookSubscription: webhookSubscriptionDelegate,
  async $transaction(operations: Array<Promise<unknown>>) {
    return Promise.all(operations);
  },
  async $connect() {
    /* no-op in demo mode */
  },
  async $disconnect() {
    /* no-op in demo mode */
  },
};
