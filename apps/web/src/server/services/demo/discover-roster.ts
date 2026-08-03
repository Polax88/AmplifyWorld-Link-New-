import { prisma, type Prisma } from '@amplifyworld/database';
import { calculateMomentumScore, type DailyPageMetrics } from '@amplifyworld/core';
import { COUNTRIES, GENRES, ROSTER_NAME_PREFIXES, ROSTER_NAME_SUFFIXES, pick, pickN, randInt, randomToken, slugify } from './fixtures';

const ROSTER_SIZE = 60;
const ROSTER_HISTORY_DAYS = 5;
/** Exported so `discover.ts` can filter this synthetic owner out of the Link-exclusive leaderboard. */
export const ROSTER_OWNER_EMAIL = 'discover-roster@amplifyworld.ai';
const PREDICTION_MARKET_COUNT = 18;
const PREDICTOR_COUNT = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Lazily, idempotently seeds Discover's fictional artist roster the first
 * time anyone views the tab — a single shared synthetic owner (never logs
 * in) whose pages exist purely to give the Top-100 leaderboard and genre x
 * geography trends real spread to browse. Cheap no-op on every call after
 * the first (a `count` against an indexed `ownerId`).
 *
 * Deliberately lighter than a real demo artist's history
 * (`generate-demo-artist.ts`): only `PageMomentumScore` rows over a short
 * window, no bulk `AnalyticsEvent`/`ViberateSnapshot` inserts — roster pages
 * only need to *rank*, not simulate full traffic.
 */
export async function ensureDiscoverRosterSeeded(): Promise<void> {
  const owner = await prisma.user.upsert({
    where: { email: ROSTER_OWNER_EMAIL },
    create: { email: ROSTER_OWNER_EMAIL, name: 'Discover Roster', role: 'ARTIST' },
    update: {},
  });

  const existingCount = await prisma.page.count({ where: { ownerId: owner.id } });
  if (existingCount < ROSTER_SIZE) {
    const created: Array<{ pageId: string; score: number }> = [];
    for (let i = existingCount; i < ROSTER_SIZE; i++) {
      const name = `${pick(ROSTER_NAME_PREFIXES)} ${pick(ROSTER_NAME_SUFFIXES)}`;
      const genre = pick(GENRES);
      const country = pick(COUNTRIES);
      const handle = `${slugify(name)}-${randomToken(5)}`;

      const page = await prisma.page.create({
        data: {
          handle,
          title: name,
          bio: `${genre[0]?.toUpperCase()}${genre.slice(1)} artist.`,
          status: 'PUBLISHED',
          ownerId: owner.id,
          genre,
          country,
        },
      });

      const score = await generateLightMomentumHistory(page.id);
      created.push({ pageId: page.id, score });
    }

    await seedArtistMarkets(created);
  }

  // A separate, independent idempotency check from the page-topping-up
  // above — this exact split is what lets genre/country markets get
  // backfilled onto a deployment that already had its roster (and the
  // original artist-only markets) fully seeded before these two subject
  // types existed, without ever re-seeding or duplicating the artist ones.
  await ensureGenreAndCountryMarketsSeeded();
}

async function generateLightMomentumHistory(pageId: string): Promise<number> {
  const metricsHistory: DailyPageMetrics[] = [];
  const scoreRows: Prisma.PageMomentumScoreCreateManyInput[] = [];
  let previousScore = 0;
  const baseVisits = randInt(15, 60);

  for (let daysAgo = ROSTER_HISTORY_DAYS; daysAgo >= 1; daysAgo--) {
    const date = utcMidnight(daysAgo);
    const progress = (ROSTER_HISTORY_DAYS - daysAgo) / ROSTER_HISTORY_DAYS;
    const visits = Math.round(baseVisits * (1 + progress * rand(0.5, 2.5)) * jitter());
    const uniqueVisitors = Math.round(visits * rand(0.7, 0.9));
    const returningVisitors = Math.round(uniqueVisitors * rand(0.1, 0.35));
    const clicks = Math.round(visits * rand(0.25, 0.55));
    const countries = pickN(COUNTRIES, randInt(1, 4));
    const sources = {
      direct: Math.round(visits * 0.35),
      social: Math.round(visits * 0.4),
      search: Math.round(visits * 0.15),
      referral: Math.round(visits * 0.1),
    };
    const current: DailyPageMetrics = {
      date: date.toISOString().slice(0, 10),
      visits,
      uniqueVisitors,
      returningVisitors,
      clicks,
      countries,
      sources,
    };

    const result = calculateMomentumScore(current, metricsHistory);
    const scoreChange = result.score - previousScore;

    scoreRows.push({
      pageId,
      date,
      score: result.score,
      scoreChange,
      breakdown: { subScores: result.breakdown, metrics: current } as unknown as Prisma.InputJsonValue,
    });

    previousScore = result.score;
    metricsHistory.push(current);
  }

  await prisma.pageMomentumScore.createMany({ data: scoreRows });
  return previousScore;
}

/** Picks a handful of mid-range "up-and-coming" roster pages and gives each an open ARTIST-subject PredictionMarket. */
async function seedArtistMarkets(pages: Array<{ pageId: string; score: number }>): Promise<void> {
  if (pages.length === 0) return;
  const candidates = pages.filter((p) => p.score >= 35 && p.score <= 80);
  const chosen = pickN(candidates.length > 0 ? candidates : pages, Math.min(PREDICTION_MARKET_COUNT, pages.length));

  const markets = await Promise.all(
    chosen.map((candidate) =>
      prisma.predictionMarket.create({
        data: {
          subjectType: 'ARTIST',
          pageId: candidate.pageId,
          question: 'Will this artist break into the Top 100 this month?',
          odds: rand(0.15, 0.65),
          closesAt: new Date(Date.now() + randInt(3, 21) * DAY_MS),
        },
      }),
    ),
  );

  await seedPredictorPicks(markets);
}

/**
 * One GENRE market per genre and one COUNTRY market per country — kept
 * behind its own idempotency check (rather than folded into the page/
 * artist-market seeding above) so it can backfill onto a deployment where
 * the roster and artist markets were already fully seeded before these two
 * subject types existed, without re-seeding or duplicating anything.
 */
async function ensureGenreAndCountryMarketsSeeded(): Promise<void> {
  const existing = await prisma.predictionMarket.count({ where: { subjectType: { in: ['GENRE', 'COUNTRY'] } } });
  if (existing > 0) return;

  const genreMarkets = await Promise.all(
    GENRES.map((genre) =>
      prisma.predictionMarket.create({
        data: {
          subjectType: 'GENRE',
          genre,
          question: `Will ${genre} be the top-trending genre this week?`,
          odds: rand(0.1, 0.45),
          closesAt: new Date(Date.now() + randInt(3, 21) * DAY_MS),
        },
      }),
    ),
  );

  const countryMarkets = await Promise.all(
    COUNTRIES.map((country) =>
      prisma.predictionMarket.create({
        data: {
          subjectType: 'COUNTRY',
          country,
          question: `Will ${country} produce the most breakout artists this month?`,
          odds: rand(0.08, 0.4),
          closesAt: new Date(Date.now() + randInt(3, 21) * DAY_MS),
        },
      }),
    ),
  );

  await seedPredictorPicks([...genreMarkets, ...countryMarkets]);
}

/** Seeds ~30 synthetic non-logging-in "predictor" users with historical picks against the given markets, so the Predictions leaderboard has real spread from the start. */
async function seedPredictorPicks(markets: Array<{ id: string; odds: number }>): Promise<void> {
  if (markets.length === 0) return;

  const predictors = await Promise.all(
    Array.from({ length: PREDICTOR_COUNT }, (_, i) =>
      prisma.user.upsert({
        where: { email: `predictor-${i}@amplifyworld.ai` },
        create: { email: `predictor-${i}@amplifyworld.ai`, name: `Predictor ${i + 1}`, role: 'ARTIST' },
        update: {},
      }),
    ),
  );

  const picks: Prisma.PredictionPickCreateManyInput[] = [];
  for (const predictor of predictors) {
    const pickCount = randInt(1, 4);
    for (let i = 0; i < pickCount; i++) {
      const market = pick(markets);
      const stakeAmount = randInt(20, 200);
      const hit = Math.random() < market.odds;
      const payout = hit ? Math.round(stakeAmount / market.odds) : 0;
      picks.push({
        marketId: market.id,
        userId: predictor.id,
        stakeAmount,
        hit,
        payout,
        createdAt: new Date(Date.now() - randInt(1, 20) * DAY_MS),
      });
    }
  }

  await prisma.predictionPick.createMany({ data: picks });
}

function utcMidnight(daysAgo: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo));
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function jitter(): number {
  return rand(0.85, 1.15);
}
