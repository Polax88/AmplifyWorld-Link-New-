import { randomUUID } from 'node:crypto';
import { prisma, type Prisma } from '@amplifyworld/database';
import {
  calculateMomentumScore,
  type ArtistPlatform,
  type DailyPageMetrics,
  type ExternalMomentumSignal,
  type StoredMomentumBreakdown,
} from '@amplifyworld/core';
import {
  ARTIST_NAMES,
  COUNTRIES,
  DEMO_SOCIAL_PLATFORMS,
  DEVICE_TYPES,
  FAN_FIRST_NAMES,
  FAN_LAST_NAMES,
  GENRES,
  SOURCE_WEIGHTS,
  pick,
  pickN,
  randInt,
  randomToken,
  slugify,
} from './fixtures';
import { buildFakeArtistSnapshot } from './fake-snapshot';

const HISTORY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const MARKET_CLOSES_IN_DAYS = [3, 21] as const;

/**
 * Builds one brand-new, fully-populated demo artist: a published page with
 * smart links, a simulated Viberate connection, 30 days of realistic AMI
 * history (computed with the real scoring engine, not hand-picked numbers),
 * a set of synthetic fans with interaction history, and one prediction
 * market on the artist's own page. Called once per demo sign-in (see
 * `start-demo-session.ts`) so every viewer gets their own pristine sandbox
 * — nothing here is shared/mutated across demo sessions.
 *
 * Artists don't earn $AMPS just for signing in or growing anymore — like
 * Fans, the only way they earn is by placing their own predictions and
 * winning (see `predictions.ts`'s `placePick`). Their starting balance is
 * awarded in `start-demo-session.ts` right before this runs, so there's
 * something to stake on the market this function creates below.
 */
export async function generateDemoArtist(userId: string): Promise<{ pageId: string; handle: string }> {
  const name = pick(ARTIST_NAMES);
  const genre = pick(GENRES);
  const country = pick(COUNTRIES);
  const handle = `${slugify(name)}-${randomToken(4)}`;
  const viberateArtistId = `demo-${randomToken(10)}`;

  const page = await prisma.page.create({
    data: {
      handle,
      title: name,
      bio: `${genre[0]?.toUpperCase()}${genre.slice(1)} artist building a direct connection with fans, one release at a time.`,
      status: 'PUBLISHED',
      ownerId: userId,
      genre,
      country,
      viberateArtistId,
      viberateConnectedAt: new Date(),
    },
  });

  await createSmartLinkBlocks(page.id, name);
  const finalScore = await generateAmiAndViberateHistory(page.id, name, genre, freshVisitorPool());
  await generateFans(page.id);
  await createOwnPredictionMarket(page.id, name, finalScore);

  return { pageId: page.id, handle };
}

/**
 * Every real artist gets a bettable market on their own page — otherwise a
 * Fan would have nothing tied to a real (non-fictional) artist to predict
 * on. Odds lean on the artist's own seeded AMI score (higher momentum →
 * better consensus odds of breaking out) rather than being pulled from
 * thin air.
 */
async function createOwnPredictionMarket(pageId: string, name: string, finalScore: number): Promise<void> {
  const odds = Math.min(0.75, Math.max(0.15, finalScore / 100 + rand(-0.1, 0.1)));
  await prisma.predictionMarket.create({
    data: {
      subjectType: 'ARTIST',
      pageId,
      question: `Will ${name} break into the Top 100 this month?`,
      odds,
      closesAt: new Date(Date.now() + randInt(...MARKET_CLOSES_IN_DAYS) * DAY_MS),
    },
  });
}

/**
 * Wipes and rebuilds just the synthetic history (AMI/Viberate trend, fans) —
 * used by the "Regenerate demo data" action so a demo that's sat around for
 * a while (or just needs a punchier trend for a walkthrough) can refresh in
 * place without losing the artist's page/blocks. Never touches real data:
 * only ever called on a page created by `generateDemoArtist` in the first
 * place, behind an ownership + `DEMO_MODE` check (see `page.ts`'s
 * `regenerateDemoData` procedure).
 */
export async function regenerateDemoData(pageId: string): Promise<void> {
  const page = await prisma.page.findUniqueOrThrow({ where: { id: pageId } });
  const genre = pick(GENRES);
  const viberateArtistId = page.viberateArtistId ?? `demo-${randomToken(10)}`;

  const staleFans = await prisma.fan.findMany({
    where: { subscriptions: { some: { pageId } } },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.pageMomentumScore.deleteMany({ where: { pageId } }),
    prisma.viberateSnapshot.deleteMany({ where: { pageId } }),
    prisma.analyticsEvent.deleteMany({ where: { pageId } }),
    prisma.fanSubscription.deleteMany({ where: { pageId } }),
    prisma.page.update({ where: { id: pageId }, data: { viberateArtistId, viberateConnectedAt: new Date() } }),
  ]);
  if (staleFans.length > 0) {
    await prisma.fan.deleteMany({ where: { id: { in: staleFans.map((fan) => fan.id) } } });
  }

  await generateAmiAndViberateHistory(pageId, page.title, genre, freshVisitorPool());
  await generateFans(pageId);
}

function freshVisitorPool(): string[] {
  return Array.from({ length: 40 }, () => randomToken(10));
}

async function createSmartLinkBlocks(pageId: string, name: string): Promise<void> {
  const slug = slugify(name);
  const blocks: Prisma.BlockCreateManyInput[] = [
    { pageId, type: 'link', position: 0, config: { label: 'Latest single — out now', url: 'https://example.com/latest' } },
    { pageId, type: 'link', position: 1, config: { label: 'Tour dates', url: 'https://example.com/tour' } },
    ...DEMO_SOCIAL_PLATFORMS.map((platform, index) => ({
      pageId,
      type: 'social',
      position: 2 + index,
      config: { platform, handle: slug, url: socialUrl(platform, slug) },
    })),
  ];

  await prisma.block.createMany({ data: blocks });
}

function socialUrl(platform: ArtistPlatform, handle: string): string {
  const domains: Partial<Record<ArtistPlatform, string>> = {
    spotify: 'https://open.spotify.com/artist',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com/@',
    youtube: 'https://youtube.com/@',
  };
  return `${domains[platform] ?? 'https://example.com'}/${handle}`;
}

/**
 * Generates 30 days of `PageMomentumScore`/`ViberateSnapshot` history by
 * running synthetic (but trending-upward) daily metrics through the real,
 * exported `calculateMomentumScore` — so the AMI panel's score, breakdown,
 * and trend line are authentic engine output, not faked directly. Also
 * seeds a bounded sample of raw `AnalyticsEvent` rows so the hub's
 * view/click summary (which reads raw events, not `PageMomentumScore`) has
 * a plausible, directionally-consistent number too.
 */
async function generateAmiAndViberateHistory(
  pageId: string,
  name: string,
  genre: string,
  visitorPool: string[],
): Promise<number> {
  const metricsHistory: DailyPageMetrics[] = [];
  const rankScoreHistory: number[] = [];
  const rawEvents: Prisma.AnalyticsEventCreateManyInput[] = [];
  const scoreRows: Prisma.PageMomentumScoreCreateManyInput[] = [];
  const snapshotRows: Prisma.ViberateSnapshotCreateManyInput[] = [];
  let previousScore = 0;
  const baseVisits = randInt(25, 45);
  const baseRank = randInt(55, 68);

  // Computed entirely in-memory (no DB round trips per day) — only the
  // resulting rows are persisted, via two `createMany` calls below, so a
  // demo sign-in stays fast regardless of how many days of history it seeds.
  for (let daysAgo = HISTORY_DAYS; daysAgo >= 1; daysAgo--) {
    const date = utcMidnight(daysAgo);
    const dateKey = date.toISOString().slice(0, 10);
    const progress = (HISTORY_DAYS - daysAgo) / HISTORY_DAYS;

    const visits = Math.round(baseVisits * (1 + progress * 2) * jitter());
    const uniqueVisitors = Math.round(visits * rand(0.7, 0.9));
    const returningVisitors = Math.round(uniqueVisitors * rand(0.1, 0.35));
    const clicks = Math.round(visits * rand(0.25, 0.55));
    const countries = pickN(COUNTRIES, randInt(2, 2 + Math.floor(progress * 6)));
    const sources = buildSources(visits);

    const current: DailyPageMetrics = { date: dateKey, visits, uniqueVisitors, returningVisitors, clicks, countries, sources };
    const rankScore = Math.min(98, Math.round(baseRank + progress * 24 + randInt(-3, 3)));
    const external: ExternalMomentumSignal = { current: rankScore, history: [...rankScoreHistory] };

    const result = calculateMomentumScore(current, metricsHistory, external);
    const scoreChange = result.score - previousScore;
    const breakdown: StoredMomentumBreakdown = { subScores: result.breakdown, metrics: current };

    scoreRows.push({
      pageId,
      date,
      score: result.score,
      scoreChange,
      breakdown: breakdown as unknown as Prisma.InputJsonValue,
    });
    snapshotRows.push({
      pageId,
      date,
      rankScore,
      profile: buildFakeArtistSnapshot(name, genre, rankScore, progress) as unknown as Prisma.InputJsonValue,
    });

    // A bounded sample (not one row per unit of `visits`/`clicks` above) —
    // enough for the aggregate view/click stat and public-page traffic to
    // look real without inserting thousands of rows for a single demo page.
    const sampleSize = Math.min(visits, 12);
    for (let i = 0; i < sampleSize; i++) {
      rawEvents.push(buildAnonymousEvent(pageId, date, visitorPool));
    }

    previousScore = result.score;
    metricsHistory.push(current);
    if (metricsHistory.length > HISTORY_DAYS) metricsHistory.shift();
    rankScoreHistory.push(rankScore);
    if (rankScoreHistory.length > HISTORY_DAYS) rankScoreHistory.shift();
  }

  await Promise.all([
    prisma.pageMomentumScore.createMany({ data: scoreRows }),
    prisma.viberateSnapshot.createMany({ data: snapshotRows }),
    prisma.analyticsEvent.createMany({ data: rawEvents }),
  ]);

  return previousScore;
}

function buildAnonymousEvent(pageId: string, date: Date, visitorPool: string[]): Prisma.AnalyticsEventCreateManyInput {
  const isClick = Math.random() < 0.35;
  return {
    pageId,
    type: isClick ? 'BLOCK_CLICK' : 'PAGE_VIEW',
    occurredAt: randomTimeWithinDay(date),
    country: pick(COUNTRIES),
    deviceType: pick(DEVICE_TYPES),
    source: weightedSource(),
    visitorId: pick(visitorPool),
  };
}

async function generateFans(pageId: string): Promise<number> {
  const fanCount = randInt(15, 40);
  // IDs are generated here (rather than left to Fan's `@default(cuid())`)
  // so all `fanCount` rows can go through a single `createMany` — many
  // concurrent individual `create()` calls is the same pattern that made
  // the AMI history generation slow (and, against a pooled/PgBouncer
  // connection like production's, can outright fail on prepared-statement
  // conflicts), which is why that was already batched the same way.
  const fans = Array.from({ length: fanCount }, () => {
    const first = pick(FAN_FIRST_NAMES);
    const last = pick(FAN_LAST_NAMES);
    return { id: randomUUID(), email: `${first.toLowerCase()}.${last.toLowerCase()}.${randomToken(6)}@example.com` };
  });
  await prisma.fan.createMany({ data: fans });

  const subscriptions: Prisma.FanSubscriptionCreateManyInput[] = [];
  const events: Prisma.AnalyticsEventCreateManyInput[] = [];

  for (const fan of fans) {
    const subscribedAt = randomTimeWithinDay(utcMidnight(randInt(1, HISTORY_DAYS)));
    subscriptions.push({ pageId, fanId: fan.id, subscribedAt });
    events.push({
      pageId,
      fanId: fan.id,
      type: 'FAN_SUBSCRIBED',
      occurredAt: subscribedAt,
      source: weightedSource(),
      deviceType: pick(DEVICE_TYPES),
      country: pick(COUNTRIES),
    });

    const interactionCount = randInt(1, 6);
    for (let i = 0; i < interactionCount; i++) {
      const daysAfterSubscribing = randInt(0, HISTORY_DAYS);
      const occurredAt = new Date(Math.min(subscribedAt.getTime() + daysAfterSubscribing * DAY_MS, Date.now()));
      events.push({
        pageId,
        fanId: fan.id,
        type: Math.random() < 0.4 ? 'BLOCK_CLICK' : 'PAGE_VIEW',
        occurredAt,
        source: weightedSource(),
        deviceType: pick(DEVICE_TYPES),
        country: pick(COUNTRIES),
      });
    }
  }

  await prisma.fanSubscription.createMany({ data: subscriptions });
  await prisma.analyticsEvent.createMany({ data: events });

  return fanCount;
}

function buildSources(visits: number): Record<string, number> {
  const sources: Record<string, number> = { direct: 0, social: 0, search: 0, referral: 0 };
  for (let i = 0; i < visits; i++) {
    const source = weightedSource();
    sources[source] = (sources[source] ?? 0) + 1;
  }
  return sources;
}

function weightedSource(): string {
  const roll = Math.random();
  let cumulative = 0;
  for (const [source, weight] of Object.entries(SOURCE_WEIGHTS)) {
    cumulative += weight;
    if (roll <= cumulative) return source;
  }
  return 'direct';
}

function utcMidnight(daysAgo: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo));
}

function randomTimeWithinDay(dayStart: Date): Date {
  return new Date(dayStart.getTime() + randInt(0, DAY_MS - 1));
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function jitter(): number {
  return rand(0.85, 1.15);
}
