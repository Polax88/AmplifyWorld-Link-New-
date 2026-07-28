import type { BlockRegistry } from '../registry';
import { linkBlock } from './link';
import { socialBlock } from './social';
import { embedBlock } from './embed';
import { gatedContentBlock } from './gated-content';

export const coreBlockDefinitions = [
  linkBlock,
  socialBlock,
  embedBlock,
  gatedContentBlock,
];

/** Registers every built-in block type. Call once at app bootstrap. */
export function registerCoreBlocks(registry: BlockRegistry): void {
  for (const definition of coreBlockDefinitions) {
    registry.register(definition);
  }
}

export * from './link';
export * from './social';
export * from './embed';
export * from './gated-content';
