import { Link2, AtSign, PlayCircle, Lock, type LucideIcon } from 'lucide-react';

/** Dashboard-only presentation metadata, keyed by block type. Purely cosmetic. */
export const blockTypeIcon: Record<string, LucideIcon> = {
  link: Link2,
  social: AtSign,
  embed: PlayCircle,
  'gated-content': Lock,
};
