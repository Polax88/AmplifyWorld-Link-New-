export interface ProfileHint {
  name?: string;
  imageUrl?: string;
  genres?: string[];
  externalUrl?: string;
}

export interface DraftPageCopyInput {
  stageName: string;
  genre?: string;
  profile?: ProfileHint; // populated from a ProfileImportSource, if the artist provided one
  socialHandles?: Array<{ platform: string; handle: string }>;
}

export interface DraftedBlock {
  type: string;
  /** Validated against the block registry's configSchema by the caller, not here. */
  config: unknown;
}

export interface DraftPageCopyResult {
  bio: string;
  suggestedBlocks: DraftedBlock[];
}

/**
 * Contract for AI-assisted content generation. Prompt construction and the
 * actual model call live in the implementation (apps/web) — this interface
 * only describes the request/response shape, keeping this package
 * framework- and provider-agnostic. Swapping models (or providers) means
 * writing a new implementation of this interface; call sites don't change.
 */
export interface AiAssistant {
  draftPageCopy(input: DraftPageCopyInput): Promise<DraftPageCopyResult>;
}
