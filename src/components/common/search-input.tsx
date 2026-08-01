import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/input';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Renders the ⌘K / Ctrl K affordance on the right. */
  showShortcut?: boolean;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  showShortcut = false,
  autoFocus = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Input
      ref={inputRef}
      type="search"
      role="searchbox"
      value={value}
      autoFocus={autoFocus}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="[&::-webkit-search-cancel-button]:hidden"
      containerClassName={cn(className)}
      leftIcon={<Search />}
      rightSlot={
        value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : showShortcut ? (
          <kbd className="pointer-events-none hidden select-none rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-[0.6875rem] font-medium text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        ) : null
      }
    />
  );
}
