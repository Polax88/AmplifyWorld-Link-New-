import { describe, expect, it } from 'vitest';
import { TemplateRegistry } from './registry';
import { defineTemplate } from './types';
import { registerCoreTemplates } from './definitions';

describe('TemplateRegistry', () => {
  it('registers and retrieves a template', () => {
    const registry = new TemplateRegistry();
    const example = defineTemplate({
      key: 'example',
      displayName: 'Example',
      description: 'test template',
      blocks: [{ type: 'link', config: { label: 'Listen', url: 'https://example.com' } }],
    });

    registry.register(example);

    expect(registry.get('example')).toBe(example);
    expect(registry.list()).toHaveLength(1);
  });

  it('throws when registering a duplicate key', () => {
    const registry = new TemplateRegistry();
    const example = defineTemplate({
      key: 'example',
      displayName: 'Example',
      description: 'test template',
      blocks: [],
    });

    registry.register(example);
    expect(() => registry.register(example)).toThrow(/already registered/);
  });

  it('throws for an unknown key', () => {
    const registry = new TemplateRegistry();
    expect(() => registry.require('nope')).toThrow(/Unknown template/);
  });

  it('registers the musician-starter template with a tip-jar block by default', () => {
    const registry = new TemplateRegistry();
    registerCoreTemplates(registry);

    const template = registry.require('musician-starter');
    expect(template.blocks.map((b) => b.type)).toContain('tip-jar');
  });
});
