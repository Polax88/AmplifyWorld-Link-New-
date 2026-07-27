/**
 * First-party anonymous visitor id, used only to distinguish unique vs.
 * returning visits to public artist pages for the momentum scoring engine.
 * Minted by middleware.ts, read back by the request-signals service.
 */
export const VISITOR_COOKIE = 'aw_visitor';
