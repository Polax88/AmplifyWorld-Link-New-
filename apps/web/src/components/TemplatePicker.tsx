'use client';

import { Check, LayoutTemplate } from 'lucide-react';
import { Card } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/**
 * The 4 free-tier page templates — Minimal Links, Release Drop, Tour Dates,
 * Merch Drop. Every template is available on every plan; picking one just
 * sets a sensible default block order/emphasis for that use case (see
 * `page.applyTemplate`). On a page that already has blocks, this only
 * reorders them — free-tier customization stops at reordering *existing*
 * blocks, so switching templates never creates or deletes anything.
 */
export function TemplatePicker({ pageId, currentTemplateKey }: { pageId: string; currentTemplateKey: string }) {
  const utils = trpc.useUtils();
  const templates = trpc.page.listAvailableTemplates.useQuery();
  const applyTemplate = trpc.page.applyTemplate.useMutation({
    onSuccess: () => utils.page.getById.invalidate({ id: pageId }),
  });

  return (
    <Card className="gap-3">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="size-4 text-ink-muted" />
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Page template</h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            Sets your smart links&apos; default order/emphasis for the use case — free on every plan.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {templates.data?.map((template) => {
          const active = template.key === currentTemplateKey;
          return (
            <button
              key={template.key}
              type="button"
              disabled={applyTemplate.isPending}
              onClick={() => applyTemplate.mutate({ pageId, templateKey: template.key })}
              className={
                active
                  ? 'flex flex-col gap-1 rounded-xl border border-brand-400/50 bg-brand-500/10 p-3 text-left transition-colors'
                  : 'flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-white/25 hover:bg-white/[0.05]'
              }
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{template.displayName}</span>
                {active ? <Check className="size-3.5 text-brand-400" /> : null}
              </span>
              <span className="text-xs text-ink-muted">{template.description}</span>
            </button>
          );
        })}
      </div>
      {applyTemplate.error ? <p className="text-xs text-red-400">{applyTemplate.error.message}</p> : null}
    </Card>
  );
}
