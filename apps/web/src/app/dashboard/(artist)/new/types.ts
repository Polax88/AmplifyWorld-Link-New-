/** What `GenerateStep` hands off to `ReadyStep` once the page has been created, drafted, and committed. */
export interface GeneratedPage {
  pageId: string;
  handle: string;
}

export const SOCIAL_PLATFORMS = [
  'instagram',
  'tiktok',
  'youtube',
  'x',
  'apple_music',
  'soundcloud',
  'deezer',
  'facebook',
] as const;
