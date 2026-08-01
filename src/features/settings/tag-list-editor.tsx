import { useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface TagListEditorProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyLabel: string;
  ariaLabel: string;
}

/** Add/remove editor for the PWA's free-text category and supplier lists. */
export function TagListEditor({
  value,
  onChange,
  placeholder,
  emptyLabel,
  ariaLabel,
}: TagListEditorProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const next = draft.trim();
    if (!next) return;
    // Case-insensitive de-dupe; the PWA treats these as display labels.
    if (value.some((entry) => entry.toLowerCase() === next.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, next]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    // Enter must add a tag, not submit the surrounding settings form.
    event.preventDefault();
    add();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Add ${ariaLabel}`}
          disabled={draft.trim().length === 0}
          onClick={add}
        >
          <Plus />
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {value.map((entry) => (
            <li key={entry}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted py-1 pl-3 pr-1.5 text-xs font-medium text-foreground">
                {entry}
                <button
                  type="button"
                  aria-label={`Remove ${entry}`}
                  onClick={() => onChange(value.filter((item) => item !== entry))}
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <X className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
