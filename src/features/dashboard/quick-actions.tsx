import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarPlus, PackagePlus, ShieldCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { fadeInUp } from '@/components/common/motion';
import { ROUTES } from '@/routes/paths';

interface QuickAction {
  label: string;
  description: string;
  icon: LucideIcon;
  className: string;
  onClick?: () => void;
  to?: string;
}

export interface QuickActionsProps {
  onCreateEvent: () => void;
  onCreateStation: () => void;
}

export function QuickActions({ onCreateEvent, onCreateStation }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      label: 'Create event',
      description: 'Book a new date',
      icon: CalendarPlus,
      className: 'bg-primary-soft text-primary',
      onClick: onCreateEvent,
    },
    {
      label: 'Create station',
      description: 'New packing template',
      icon: PackagePlus,
      className: 'bg-secondary-soft text-secondary',
      onClick: onCreateStation,
    },
    {
      label: 'Manage access',
      description: 'Promote a colleague to admin',
      icon: ShieldCheck,
      className: 'bg-warning-soft text-warning',
      to: ROUTES.users,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;

        const body = (
          <>
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105',
                action.className,
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {action.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {action.description}
              </span>
            </span>
          </>
        );

        const className =
          'group flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-colors hover:border-primary/30 hover:shadow-card';

        return (
          <motion.div
            key={action.label}
            variants={fadeInUp}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
          >
            {action.to ? (
              <Link to={action.to} className={className}>
                {body}
              </Link>
            ) : (
              <button type="button" onClick={action.onClick} className={cn(className, 'w-full')}>
                {body}
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
