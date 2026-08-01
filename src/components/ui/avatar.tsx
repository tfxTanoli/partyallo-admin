import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { getInitials, stringToHue } from '@/utils/format';

const avatarVariants = cva(
  'relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'size-6 text-[0.625rem]',
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-12 text-base',
        xl: 'size-16 text-xl',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface AvatarProps
  extends ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  name: string;
  src?: string;
  /** Renders a coloured presence dot in the bottom-right corner. */
  status?: 'online' | 'offline' | 'busy';
  ring?: boolean;
}

const statusColors: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-success',
  offline: 'bg-muted-foreground',
  busy: 'bg-warning',
};

export const Avatar = forwardRef<ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  function Avatar({ className, name, src, size, status, ring = false, ...props }, ref) {
    const hue = stringToHue(name);

    return (
      <span className="relative inline-flex shrink-0">
        <AvatarPrimitive.Root
          ref={ref}
          className={cn(
            avatarVariants({ size }),
            ring && 'ring-2 ring-card ring-offset-1 ring-offset-border',
            className,
          )}
          {...props}
        >
          <AvatarPrimitive.Image
            src={src}
            alt={name}
            className="size-full object-cover"
            loading="lazy"
          />
          <AvatarPrimitive.Fallback
            delayMs={src ? 300 : 0}
            className="flex size-full items-center justify-center font-semibold"
            style={{
              backgroundColor: `hsl(${hue} 72% 92%)`,
              color: `hsl(${hue} 65% 32%)`,
            }}
          >
            {getInitials(name)}
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
        {status ? (
          <span
            aria-label={status}
            className={cn(
              'absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card',
              statusColors[status],
            )}
          />
        ) : null}
      </span>
    );
  },
);

export interface AvatarGroupProps {
  people: { name: string; avatarUrl?: string }[];
  max?: number;
  size?: VariantProps<typeof avatarVariants>['size'];
  className?: string;
}

export function AvatarGroup({ people, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visible.map((person) => (
        <Avatar
          key={person.name}
          name={person.name}
          src={person.avatarUrl}
          size={size}
          className="ring-2 ring-card"
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            avatarVariants({ size }),
            'bg-muted font-semibold text-muted-foreground ring-2 ring-card',
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
