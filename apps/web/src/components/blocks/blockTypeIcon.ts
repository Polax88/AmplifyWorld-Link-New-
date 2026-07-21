import { Link2, AtSign, PlayCircle, Heart, Lock, type LucideIcon } from 'lucide-react';

/** Dashboard-only presentation metadata, keyed by block type. Purely cosmetic. */
export const blockTypeIcon: Record<string, LucideIcon> = {
  link: Link2,
  social: AtSign,
  embed: PlayCircle,
  'tip-jar': Heart,
  'gated-content': Lock,
};
