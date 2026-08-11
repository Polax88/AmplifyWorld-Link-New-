/**
 * Free vs. Pro plan boundary. There's no separate subscription/billing
 * concept in this app — "Pro" is exactly the existing $AMPS mechanic:
 * spending AMPS to unlock a premium theme (see `amps.unlockTheme` in
 * apps/web) is what flips an artist from Free to Pro. Once Pro, they keep
 * every Pro perk (premium theme packs, deeper customization, Discover
 * boosts, and — the one enforced boundary below — publishing more than one
 * page) for as long as they hold at least one unlocked theme.
 */

/** Free plan: 1 published page. All 4 page templates, basic customization, full AMI + tracking are free regardless of plan. */
export const FREE_PLAN_PUBLISHED_PAGE_LIMIT = 1;

export function isProUser(unlockedThemes: string[]): boolean {
  return unlockedThemes.length > 0;
}
