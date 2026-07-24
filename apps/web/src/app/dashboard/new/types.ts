export interface DraftBlock {
  /** Client-only id — these blocks aren't persisted until commit. */
  tempId: string;
  type: string;
  config: unknown;
  keep: boolean;
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
}

export const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'x'] as const;
