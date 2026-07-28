/**
 * Mocked "Write with AI" bio generator for the page settings editor.
 * Deterministic, no network/LLM call — same "canned, stateless" spirit as
 * `templateOnlyAiAssistant` (see ai-assistant.ts), just always used rather
 * than only as a fallback. Returns a fresh set of 3 suggestions each call so
 * repeated clicks feel like new drafts.
 */

type BioStyle = (stageName: string) => string;

const STYLES: BioStyle[] = [
  (name) => `${name} — new music, first to the people who show up early.`,
  (name) => `${name}. Making the songs that get stuck in your head for the right reasons.`,
  (name) => `Direct from ${name}: no filters, no gatekeepers, just the music.`,
  (name) => `${name} is building something — come along for the ride.`,
  (name) => `Independent. Unbothered. ${name}.`,
  (name) => `${name} makes music for the 2am drives and the 2pm daydreams.`,
  (name) => `Every release from ${name} starts here, first.`,
  (name) => `${name} — an artist, not a brand. Music, tour dates, and the truth in between.`,
];

/** Returns 3 distinct randomized bio suggestions for the given stage name. */
export function generateBioSuggestions({ stageName }: { stageName: string }): string[] {
  const shuffled = [...STYLES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((style) => style(stageName));
}
