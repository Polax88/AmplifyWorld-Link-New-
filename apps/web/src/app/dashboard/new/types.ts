export interface DraftBlock {
  /** Client-only id — these blocks aren't persisted until commit. */
  tempId: string;
  type: string;
  config: unknown;
  keep: boolean;
}

export interface ViberateMatch {
  externalId: string;
  name: string;
  imageUrl?: string;
}

export interface WizardState {
  pageId: string;
  handle: string;
  stageName: string;
  genre: string;
  spotifyArtistId: string | null;
  spotifyArtistName: string | null;
  socialHandles: Array<{ platform: string; handle: string }>;
  bio: string;
  avatarUrl: string | null;
  blocks: DraftBlock[];
  /** Auto-found by the server during `draft` — null if no confident match exists. */
  viberateMatch: ViberateMatch | null;
  /** The artist's keep/skip decision on `viberateMatch` — defaults to keep when a match exists. */
  viberateConnect: boolean;
}

export const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'x'] as const;
