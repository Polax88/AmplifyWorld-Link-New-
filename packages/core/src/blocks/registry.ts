import type { BlockDefinition } from './types';

/**
 * In-memory registry of block types. The web app and any future app
 * (mobile API, admin panel) import `registerCoreBlocks` once at startup,
 * then treat this registry as the single source of truth for "what block
 * types exist" and "how is their config validated".
 */
export class BlockRegistry {
  private readonly definitions = new Map<string, BlockDefinition<unknown>>();

  register(definition: BlockDefinition<unknown>): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Block type "${definition.type}" is already registered.`);
    }
    this.definitions.set(definition.type, definition);
  }

  get(type: string): BlockDefinition<unknown> | undefined {
    return this.definitions.get(type);
  }

  require(type: string): BlockDefinition<unknown> {
    const definition = this.get(type);
    if (!definition) {
      throw new Error(`Unknown block type "${type}". Is it registered?`);
    }
    return definition;
  }

  list(): BlockDefinition<unknown>[] {
    return Array.from(this.definitions.values());
  }

  /** Parses and validates a block's stored config against its schema. */
  parseConfig(type: string, config: unknown): unknown {
    return this.require(type).configSchema.parse(config);
  }
}

/** Shared singleton for the running process. Tests should construct their own `new BlockRegistry()`. */
export const blockRegistry = new BlockRegistry();
