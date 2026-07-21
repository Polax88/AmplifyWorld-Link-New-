import type { z } from 'zod';

/**
 * Contract every "block" (a unit of content on an artist's link page) must
 * satisfy. New block kinds are added by calling `defineBlock` and passing
 * the result to `blockRegistry.register` — no changes to the database, the
 * page renderer, or the dashboard are required.
 */
export interface BlockDefinition<TConfig = unknown> {
  /** Stable, unique identifier stored on `Block.type`. Never rename in place. */
  type: string;
  displayName: string;
  description: string;
  /** Validates and parses `Block.config` (stored as Json) — accepts unknown input, produces TConfig. */
  configSchema: z.ZodType<TConfig, z.ZodTypeDef, unknown>;
  defaultConfig: TConfig;
}

export function defineBlock<TConfig>(
  definition: BlockDefinition<TConfig>,
): BlockDefinition<TConfig> {
  return definition;
}
