import { PartyPopper } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface BrandMarkProps {
  logoUrl?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'size-8 rounded-lg [&_svg]:size-4',
  md: 'size-9 rounded-xl [&_svg]:size-4.5',
  lg: 'size-12 rounded-2xl [&_svg]:size-6',
} as const;

/** Company logo when one is configured, otherwise the gradient monogram tile. */
export function BrandMark({ logoUrl, name = 'PartyAllo', size = 'md', className }: BrandMarkProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={cn('shrink-0 object-cover shadow-soft', sizeMap[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center bg-gradient-to-br from-primary to-secondary text-white shadow-soft',
        sizeMap[size],
        className,
      )}
    >
      <PartyPopper strokeWidth={2.2} />
    </span>
  );
}
