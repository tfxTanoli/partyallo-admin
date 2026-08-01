import { useCallback, useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/common/brand-mark';

/**
 * Firestore documents are capped at 1 MB, and the PWA stores `logoUri` inline as
 * a data URL rather than in Storage — so the file must stay comfortably small.
 */
const MAX_BYTES = 256 * 1024;

export interface LogoUploaderProps {
  value: string;
  onChange: (dataUrl: string) => void;
  companyName: string;
}

export function LogoUploader({ value, onChange, companyName }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Unsupported file', { description: 'Choose a PNG, JPG or SVG image.' });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error('File too large', {
          description: 'Keep the logo under 256 KB — it is stored inline in Firestore.',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => onChange(String(reader.result));
      reader.onerror = () =>
        toast.error('Could not read that file', { description: 'Please try a different image.' });
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <BrandMark logoUrl={value} name={companyName} size="lg" />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
        className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary-soft' : 'border-border bg-muted/30'
        }`}
      >
        <ImagePlus className="size-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Drag a PNG, JPG or SVG here — up to 256&nbsp;KB.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Upload />}
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 />}
              className="text-danger hover:bg-danger-soft hover:text-danger"
              onClick={() => onChange('')}
            >
              Remove
            </Button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="sr-only"
          aria-label="Upload company logo"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
