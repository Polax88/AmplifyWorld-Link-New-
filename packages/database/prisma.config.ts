import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// `prisma.config.ts` opts out of Prisma's legacy automatic .env loading, so
// we load it explicitly — from the repo root, since that's where `.env`
// lives regardless of which package's directory a Prisma command runs from.
loadEnv({ path: path.join(__dirname, '../../.env') });

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
