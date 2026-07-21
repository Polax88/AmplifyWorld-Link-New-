import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { BlockRegistry } from './registry';
import { defineBlock } from './types';
import { registerCoreBlocks } from './definitions';

describe('BlockRegistry', () => {
  it('registers and retrieves a block definition', () => {
    const registry = new BlockRegistry();
    const example = defineBlock({
      type: 'example',
      displayName: 'Example',
      description: 'test block',
      configSchema: z.object({ foo: z.string() }),
      defaultConfig: { foo: 'bar' },
    });

    registry.register(example);

    expect(registry.get('example')).toBe(example);
    expect(registry.list()).toHaveLength(1);
  });

  it('throws when registering a duplicate type', () => {
    const registry = new BlockRegistry();
    const example = defineBlock({
      type: 'example',
      displayName: 'Example',
      description: 'test block',
      configSchema: z.object({}),
      defaultConfig: {},
    });

    registry.register(example);
    expect(() => registry.register(example)).toThrow(/already registered/);
  });

  it('throws for an unknown type', () => {
    const registry = new BlockRegistry();
    expect(() => registry.require('nope')).toThrow(/Unknown block type/);
  });

  it('validates config against the registered schema', () => {
    const registry = new BlockRegistry();
    registerCoreBlocks(registry);

    expect(registry.parseConfig('link', { label: 'Listen', url: 'https://open.spotify.com' })).toEqual(
      { label: 'Listen', url: 'https://open.spotify.com' },
    );
    expect(() => registry.parseConfig('link', { label: '', url: 'not-a-url' })).toThrow();
  });

  it('registers all core block types without collisions', () => {
    const registry = new BlockRegistry();
    registerCoreBlocks(registry);
    expect(registry.list().map((d) => d.type).sort()).toEqual([
      'embed',
      'gated-content',
      'link',
      'social',
      'tip-jar',
    ]);
  });
});
