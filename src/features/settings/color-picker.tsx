import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { COLOR_PRESETS } from '@/constants/theme';
import { isValidHex } from '@/utils/color';
import { Input } from '@/components/ui/input';

export interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const normalized = (value ?? '').toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2.5">
        {COLOR_PRESETS.map((preset) => {
          const selected = preset.value.toLowerCase() === normalized;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              aria-label={preset.name}
              aria-pressed={selected}
              title={preset.name}
              className={cn(
                'grid size-9 place-items-center rounded-xl transition-all duration-200',
                'ring-offset-2 ring-offset-card hover:scale-110',
                selected ? 'ring-2 ring-foreground/70' : 'ring-1 ring-black/5',
              )}
              style={{ backgroundColor: preset.value }}
            >
              {selected ? <Check className="size-4 text-white" strokeWidth={3} /> : null}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border">
          <span className="sr-only">Pick a custom colour</span>
          <input
            type="color"
            value={isValidHex(value) ? value : '#2563eb'}
            onChange={(event) => onChange(event.target.value)}
            className="absolute -inset-2 size-[calc(100%+1rem)] cursor-pointer border-0 bg-transparent p-0"
          />
        </label>

        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#2563EB"
          aria-label="Primary colour hex value"
          invalid={!isValidHex(value)}
          className="max-w-40 font-mono uppercase"
        />

        <p className="text-xs text-muted-foreground">
          Applied live across buttons, links and highlights.
        </p>
      </div>
    </div>
  );
}
