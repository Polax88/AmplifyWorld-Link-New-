/**
 * What a smart link (a `link` or `social` block) is meant to accomplish for
 * the artist — the classification the AMI engine's Conversion pillar counts
 * against (see `momentum/score.ts`) and the dashboard's tracking-hygiene
 * indicator checks for. `generic` is the "not yet classified" catch-all: a
 * click tagged `generic` counts as traffic but not as a conversion.
 */
export const CONVERSION_EVENT_TYPES = ['stream', 'pre_save', 'ticket', 'merch', 'follow', 'generic'] as const;

export type ConversionEventType = (typeof CONVERSION_EVENT_TYPES)[number];

export const CONVERSION_EVENT_LABELS: Record<ConversionEventType, string> = {
  stream: 'Stream',
  pre_save: 'Pre-save',
  ticket: 'Ticket',
  merch: 'Merch',
  follow: 'Follow',
  generic: 'Generic / other',
};

/**
 * Whether a stored `AnalyticsEvent.metadata` blob represents a real
 * conversion click rather than plain traffic — `generic`-tagged clicks and
 * anything untagged (pre-dating this classification) don't count. Pure and
 * defensive: metadata is a freeform Json column, so this never assumes a
 * particular shape.
 */
export function isConversionMetadata(metadata: unknown): boolean {
  if (typeof metadata !== 'object' || metadata === null) return false;
  const conversionType = (metadata as Record<string, unknown>).conversionType;
  return (
    typeof conversionType === 'string' &&
    conversionType !== 'generic' &&
    (CONVERSION_EVENT_TYPES as readonly string[]).includes(conversionType)
  );
}
