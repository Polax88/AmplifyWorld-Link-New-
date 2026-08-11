import type { TemplateRegistry } from '../registry';
import { musicianStarterTemplate } from './musician-starter';
import { minimalLinksTemplate } from './minimal-links';
import { releaseDropTemplate } from './release-drop';
import { tourDatesTemplate } from './tour-dates';
import { merchDropTemplate } from './merch-drop';

/**
 * `musicianStarterTemplate` stays first and unlisted (`isPageTemplate:
 * false`) — it's the AI onboarding wizard's internal fallback seed, not one
 * of the 4 free-tier page templates. Those 4 (`isPageTemplate: true`) are
 * what `page.listAvailableTemplates` surfaces to artists.
 */
export const coreTemplateDefinitions = [
  musicianStarterTemplate,
  minimalLinksTemplate,
  releaseDropTemplate,
  tourDatesTemplate,
  merchDropTemplate,
];

/** Registers every built-in template. Call once at app bootstrap. */
export function registerCoreTemplates(registry: TemplateRegistry): void {
  for (const template of coreTemplateDefinitions) {
    registry.register(template);
  }
}

export * from './musician-starter';
export * from './minimal-links';
export * from './release-drop';
export * from './tour-dates';
export * from './merch-drop';
