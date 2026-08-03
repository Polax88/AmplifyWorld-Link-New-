'use client';

import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { Card, IconButton, Badge } from '@amplifyworld/ui';
import { blockTypeIcon } from '../../../../components/blocks/blockTypeIcon';

export function SortableBlockCard({
  id,
  type,
  isEnabled,
  isEditing,
  onToggleEnabled,
  onToggleEdit,
  onDelete,
  children,
}: {
  id: string;
  type: string;
  isEnabled: boolean;
  isEditing: boolean;
  onToggleEnabled: () => void;
  onToggleEdit: () => void;
  onDelete: () => void;
  children?: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const Icon = blockTypeIcon[type];

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10 opacity-60' : undefined}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none text-white/30 transition-colors hover:text-white/60 active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-4" />
            </button>
            {Icon ? (
              <span className="flex size-8 items-center justify-center rounded-full bg-white/8 text-white/60">
                <Icon className="size-4" />
              </span>
            ) : null}
            <div>
              <p className="text-sm font-medium capitalize text-white">{type.replace('-', ' ')}</p>
              {!isEnabled ? (
                <Badge tone="neutral" className="mt-0.5">
                  Hidden
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton
              aria-label={isEnabled ? 'Hide block' : 'Show block'}
              size="sm"
              onClick={onToggleEnabled}
            >
              {isEnabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </IconButton>
            <IconButton aria-label="Edit block" size="sm" onClick={onToggleEdit}>
              <Pencil className="size-4" />
            </IconButton>
            <IconButton aria-label="Delete block" size="sm" variant="danger" onClick={onDelete}>
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        </div>

        {isEditing ? <div className="border-t border-white/10 pt-3">{children}</div> : null}
      </div>
    </Card>
  );
}
