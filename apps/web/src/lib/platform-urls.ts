/**
 * Canonical profile URL per DSP/social platform, given a handle. Pure and
 * dependency-free (safe to import from server services and client
 * components alike) — shared by the AI wizard's auto-drafted blocks
 * (`server/services/ai-assistant.ts`) and the demo "Connect your platforms"
 * flow (`components/ConnectPlatformsCard.tsx`).
 */
const otherTemplate = (handle: string) => `https://${handle}`;

export const PLATFORM_URL_TEMPLATES: Record<string, (handle: string) => string> = {
  instagram: (handle) => `https://instagram.com/${handle}`,
  tiktok: (handle) => `https://tiktok.com/@${handle}`,
  youtube: (handle) => `https://youtube.com/@${handle}`,
  spotify: (handle) => `https://open.spotify.com/artist/${handle}`,
  apple_music: (handle) => `https://music.apple.com/artist/${handle}`,
  soundcloud: (handle) => `https://soundcloud.com/${handle}`,
  deezer: (handle) => `https://deezer.com/artist/${handle}`,
  facebook: (handle) => `https://facebook.com/${handle}`,
  x: (handle) => `https://x.com/${handle}`,
  discord: (handle) => `https://discord.gg/${handle}`,
  other: otherTemplate,
};

export function platformUrl(platform: string, handle: string): string {
  return (PLATFORM_URL_TEMPLATES[platform] ?? otherTemplate)(handle);
}
