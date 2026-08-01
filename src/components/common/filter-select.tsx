import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SelectOption } from '@/types';

export interface FilterSelectProps<TValue extends string> {
  value: TValue;
  onChange: (value: TValue) => void;
  options: SelectOption<TValue>[];
  placeholder?: string;
  icon?: LucideIcon;
  className?: string;
  ariaLabel: string;
}

export function FilterSelect<TValue extends string>({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  className,
  ariaLabel,
}: FilterSelectProps<TValue>) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as TValue)}>
      <SelectTrigger className={cn('h-10 w-full sm:w-[10.5rem]', className)} aria-label={ariaLabel}>
        <span className="flex min-w-0 items-center gap-2 truncate">
          {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
