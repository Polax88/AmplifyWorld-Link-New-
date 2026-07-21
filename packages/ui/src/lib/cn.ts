/** Tiny classnames joiner so we don't need a dependency for this alone. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
