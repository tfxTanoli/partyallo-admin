import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CatalogueFormValues, StationCatalogue } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const catalogueSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(70, 'Name is too long'),
  category: z.string().trim().min(1, 'Choose or enter a category'),
  description: z.string().trim().max(280, 'Keep the description under 280 characters').optional(),
  powerRequired: z.string().trim().max(40, 'Too long').optional(),
  helperCount: z
    .number({ error: 'Enter a helper count' })
    .int('Whole numbers only')
    .min(0, 'Cannot be negative')
    .max(50, 'That seems too high'),
});

const EMPTY: CatalogueFormValues = {
  name: '',
  category: '',
  description: '',
  powerRequired: '',
  helperCount: 1,
};

export interface CatalogueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station?: StationCatalogue | null;
  onSubmit: (values: CatalogueFormValues) => Promise<unknown>;
  loading?: boolean;
  /** Categories already in use, offered as suggestions. Free text is still allowed. */
  categories: string[];
}

export function CatalogueFormDialog({
  open,
  onOpenChange,
  station,
  onSubmit,
  loading = false,
  categories,
}: CatalogueFormDialogProps) {
  const isEdit = Boolean(station);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CatalogueFormValues>({
    resolver: zodResolver(catalogueSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      station
        ? {
            name: station.name,
            category: station.category,
            description: station.description ?? '',
            powerRequired: station.powerRequired ?? '',
            helperCount: station.helperCount,
          }
        : { ...EMPTY, category: categories[0] ?? '' },
    );
  }, [open, station, categories, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit station' : 'Create a station'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'These details are shared live with the PartyAllo crew app.'
              : 'Creates the station. Its default packing list is built in the crew app.'}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-5 pb-6">
            <Field label="Station name" required error={errors.name?.message}>
              <Input
                placeholder="Candy Floss"
                invalid={Boolean(errors.name)}
                {...register('name')}
              />
            </Field>

            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Field
                  label="Category"
                  required
                  hint="Shared with the crew app's category list."
                  error={errors.category?.message}
                >
                  {categories.length > 0 ? (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Desserts Live Station"
                      invalid={Boolean(errors.category)}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                </Field>
              )}
            />

            <Field label="Description" error={errors.description?.message}>
              <Textarea
                rows={3}
                placeholder="What this station covers and roughly what it serves…"
                invalid={Boolean(errors.description)}
                {...register('description')}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Helpers required"
                required
                hint="Crew needed to run this station."
                error={errors.helperCount?.message}
              >
                <Input
                  type="number"
                  min={0}
                  invalid={Boolean(errors.helperCount)}
                  {...register('helperCount', { valueAsNumber: true })}
                />
              </Field>

              <Field
                label="Power required"
                hint="Free text, e.g. “1” or “2 × 13A”."
                error={errors.powerRequired?.message}
              >
                <Input placeholder="1" {...register('powerRequired')} />
              </Field>
            </div>

            {!isEdit ? (
              <p className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
                The station is created with an empty packing list. Add its default items in the
                PartyAllo crew app, where quantities can be tied to servings.
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Save changes' : 'Create station'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
