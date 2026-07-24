import type { TemplateRegistry } from '../registry';
import { musicianStarterTemplate } from './musician-starter';

export const coreTemplateDefinitions = [musicianStarterTemplate];

/** Registers every built-in template. Call once at app bootstrap. */
export function registerCoreTemplates(registry: TemplateRegistry): void {
  for (const template of coreTemplateDefinitions) {
    registry.register(template);
  }
}

export * from './musician-starter';
