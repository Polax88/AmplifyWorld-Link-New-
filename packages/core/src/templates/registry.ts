import type { PageTemplate } from './types';

/**
 * In-memory registry of starter templates, mirroring `BlockRegistry` exactly.
 * Code-defined for now (no admin UI to manage templates yet) — add a new
 * template by registering one more `PageTemplate`, no schema change needed
 * since templates only ever seed `Block` rows through the normal block APIs.
 */
export class TemplateRegistry {
  private readonly templates = new Map<string, PageTemplate>();

  register(template: PageTemplate): void {
    if (this.templates.has(template.key)) {
      throw new Error(`Template "${template.key}" is already registered.`);
    }
    this.templates.set(template.key, template);
  }

  get(key: string): PageTemplate | undefined {
    return this.templates.get(key);
  }

  require(key: string): PageTemplate {
    const template = this.get(key);
    if (!template) {
      throw new Error(`Unknown template "${key}". Is it registered?`);
    }
    return template;
  }

  list(): PageTemplate[] {
    return Array.from(this.templates.values());
  }
}

/** Shared singleton for the running process. Tests should construct their own `new TemplateRegistry()`. */
export const templateRegistry = new TemplateRegistry();
