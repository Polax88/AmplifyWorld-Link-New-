/** A block seed within a template — validated against the block registry's configSchema at use time, not here. */
export interface PageTemplateBlockSeed {
  type: string;
  config: unknown;
}

export interface PageTemplate {
  key: string;
  displayName: string;
  description: string;
  blocks: PageTemplateBlockSeed[];
}

export function defineTemplate(template: PageTemplate): PageTemplate {
  return template;
}
