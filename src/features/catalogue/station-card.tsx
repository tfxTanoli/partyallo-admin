import { motion } from 'motion/react';
import { Copy, Layers, Package, Pencil, Trash2, Users, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDate, stringToHue } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { RowActions } from '@/components/common/row-actions';
import { fadeInUp } from '@/components/common/motion';
import type { StationCatalogue } from '@/types';

export interface StationCardProps {
  station: StationCatalogue;
  onEdit: (station: StationCatalogue) => void;
  onDuplicate: (station: StationCatalogue) => void;
  onDelete: (station: StationCatalogue) => void;
}

export function StationCard({ station, onEdit, onDuplicate, onDelete }: StationCardProps) {
  // Categories are free text in the PWA, so the tile colour is derived from the
  // name rather than looked up in a fixed palette.
  const hue = stringToHue(station.category || station.name);

  return (
    <motion.article
      variants={fadeInUp}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow duration-300 hover:border-primary/25 hover:shadow-lifted"
    >
      <div
        aria-hidden
        className="relative grid h-28 place-items-center overflow-hidden transition-transform duration-500 group-hover:scale-105"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${(hue + 35) % 360} 68% 44%))`,
        }}
      >
        <Package className="size-8 text-white/85" strokeWidth={1.5} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[0.9375rem] font-semibold text-foreground">
              {station.name}
            </h3>
            <Badge tone="neutral" size="sm" className="mt-1.5">
              {station.category}
            </Badge>
          </div>

          <RowActions label={`Actions for ${station.name}`}>
            <DropdownMenuItem onSelect={() => onEdit(station)}>
              <Pencil />
              Edit station
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(station)}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => onDelete(station)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </RowActions>
        </div>

        <p
          className={cn(
            'mt-3 line-clamp-2 flex-1 text-sm leading-relaxed',
            station.description ? 'text-muted-foreground' : 'text-muted-foreground/60 italic',
          )}
        >
          {station.description || 'No description'}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <Layers className="size-3.5 text-muted-foreground" />
            {station.defaultPackingList.length} items
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5" />
            {station.helperCount} helper{station.helperCount === 1 ? '' : 's'}
          </span>
          {station.powerRequired ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Zap className="size-3.5" />
              {station.powerRequired}
            </span>
          ) : null}
          <span className="ml-auto text-muted-foreground">{formatDate(station.createdAt)}</span>
        </div>
      </div>
    </motion.article>
  );
}

export function StationCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="skeleton-shimmer h-28 bg-muted" />
      <div className="space-y-3 p-5">
        <div className="skeleton-shimmer h-4 w-2/3 rounded-lg bg-muted" />
        <div className="skeleton-shimmer h-5 w-20 rounded-full bg-muted" />
        <div className="skeleton-shimmer h-3 w-full rounded-lg bg-muted" />
        <div className="skeleton-shimmer mt-5 h-3 w-1/2 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
