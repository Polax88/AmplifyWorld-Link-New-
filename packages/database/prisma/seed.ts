import { prisma } from '../src/index';

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: 'demo@amplifyworld.ai' },
    create: { email: 'demo@amplifyworld.ai', name: 'Demo Artist', role: 'ARTIST' },
    update: {},
  });

  const page = await prisma.page.upsert({
    where: { handle: 'demo-artist' },
    create: {
      handle: 'demo-artist',
      title: 'Demo Artist',
      bio: 'Sample AmplifyWorld Link page seeded for local development.',
      status: 'PUBLISHED',
      ownerId: owner.id,
    },
    update: {},
  });

  await prisma.block.createMany({
    data: [
      {
        pageId: page.id,
        type: 'link',
        position: 0,
        config: { label: 'Listen on Spotify', url: 'https://open.spotify.com' },
      },
      {
        pageId: page.id,
        type: 'social',
        position: 1,
        config: { platform: 'instagram', handle: 'demoartist', url: 'https://instagram.com/demoartist' },
      },
    ],
    skipDuplicates: true,
  });

  await prisma.featureFlag.upsert({
    where: { key: 'gated-content-blocks' },
    create: {
      key: 'gated-content-blocks',
      description: 'Enable the gated-content block type in the dashboard block picker.',
      isEnabled: true,
      rolloutPercentage: 100,
    },
    update: {},
  });

  await prisma.featureFlag.upsert({
    where: { key: 'ai-onboarding-wizard' },
    create: {
      key: 'ai-onboarding-wizard',
      description: 'Route "New page" to the AI-assisted onboarding wizard instead of the blank-canvas modal.',
      isEnabled: true,
      rolloutPercentage: 100,
    },
    update: {},
  });

  await prisma.featureFlag.upsert({
    where: { key: 'viberate-integration' },
    create: {
      key: 'viberate-integration',
      description:
        'Show Viberate-connected UI (onboarding match card, "Connect Viberate" editor action). Disabled by ' +
        'default — stays dark until there is a real Viberate Music Data API subscription, independent of ' +
        'whether VIBERATE_API_KEY is set.',
      isEnabled: false,
      rolloutPercentage: 0,
    },
    update: {},
  });

  console.log(`Seeded demo page: /${page.handle}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
