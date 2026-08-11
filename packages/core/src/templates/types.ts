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
  /**
   * Whether this template is shown in the artist-facing page-template picker
   * (the 4 free-tier templates: Minimal Links, Release Drop, Tour Dates,
   * Merch Drop). False for internal-only seeds like the AI onboarding
   * wizard's no-network fallback (`musician-starter`), which exists purely
   * as a deterministic draft source, not a page layout an artist selects.
   * Defaults to false so a new template must opt in deliberately.
   */
  isPageTemplate?: boolean;
}

export function defineTemplate(template: PageTemplate): PageTemplate {
  return { ...template, isPageTemplate: template.isPageTemplate ?? false };
}
