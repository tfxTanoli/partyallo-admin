import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PurchaseFormValues, PurchaseItem } from '@/types';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const purchaseSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(120, 'Name is too long'),
  qtyNeeded: z
    .number({ error: 'Enter a quantity' })
    .min(0.01, 'Must be more than zero')
    .max(100000, 'That seems too high'),
  unit: z.string().trim().min(1, 'Enter a unit, e.g. pcs'),
  category: z.string().trim().min(1, 'Enter a category'),
  supplier: z.string().trim().min(1, 'Enter a supplier'),
  requiredDate: z.string().optional(),
  notes: z.string().trim().max(500, 'Keep notes under 500 characters').optional(),
  purchased: z.boolean(),
});

const EMPTY: PurchaseFormValues = {
  name: '',
  qtyNeeded: 1,
  unit: 'pcs',
  category: '',
  supplier: '',
  requiredDate: '',
  notes: '',
  purchased: false,
};

export interface PurchaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PurchaseItem | null;
  onSubmit: (values: PurchaseFormValues) => Promise<unknown>;
  loading?: boolean;
  /** Existing values, offered as suggestions. Both fields stay free text. */
  categories: string[];
  suppliers: string[];
  units: string[];
}

export function PurchaseFormDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  loading = false,
  categories,
  suppliers,
  units,
}: PurchaseFormDialogProps) {
  const isEdit = Boolean(item);
  const listId = useId();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      item
        ? {
            name: item.name,
            qtyNeeded: item.qtyNeeded,
            unit: item.unit,
            category: item.category,
            supplier: item.supplier,
            requiredDate: item.requiredDate ?? '',
            notes: item.notes ?? '',
            purchased: item.purchased,
          }
        : { ...EMPTY, category: categories[0] ?? '', supplier: suppliers[0] ?? '' },
    );
  }, [open, item, categories, suppliers, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit item' : 'Add a purchase'}</DialogTitle>
          <DialogDescription>
            Shared live with the PartyAllo crew app's purchase registry.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-5 pb-6">
            <Field label="Item" required error={errors.name?.message}>
              <Input
                placeholder="CHANDLER vegetarian patty"
                invalid={Boolean(errors.name)}
                {...register('name')}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Quantity needed" required error={errors.qtyNeeded?.message}>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  invalid={Boolean(errors.qtyNeeded)}
                  {...register('qtyNeeded', { valueAsNumber: true })}
                />
              </Field>

              <Field label="Unit" required error={errors.unit?.message}>
                <Input
                  list={`${listId}-units`}
                  placeholder="pcs"
                  invalid={Boolean(errors.unit)}
                  {...register('unit')}
                />
              </Field>
              <datalist id={`${listId}-units`}>
                {units.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>

              <Field
                label="Category"
                required
                hint="Pick an existing one or type a new one."
                error={errors.category?.message}
              >
                <Input
                  list={`${listId}-categories`}
                  placeholder="Dry Goods"
                  invalid={Boolean(errors.category)}
                  {...register('category')}
                />
              </Field>
              <datalist id={`${listId}-categories`}>
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>

              <Field label="Supplier" required error={errors.supplier?.message}>
                <Input
                  list={`${listId}-suppliers`}
                  placeholder="Sheng Siong"
                  invalid={Boolean(errors.supplier)}
                  {...register('supplier')}
                />
              </Field>
              <datalist id={`${listId}-suppliers`}>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier} />
                ))}
              </datalist>
            </div>

            <Field
              label="Required by"
              hint="Optional. Outstanding items past this date are flagged as overdue."
              error={errors.requiredDate?.message}
            >
              <Input type="date" {...register('requiredDate')} />
            </Field>

            <Field label="Notes" error={errors.notes?.message}>
              <Textarea
                rows={2}
                placeholder="Brand, substitutions, where to collect…"
                invalid={Boolean(errors.notes)}
                {...register('notes')}
              />
            </Field>

            <Controller
              control={control}
              name="purchased"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="min-w-0">
                    <Label htmlFor={`${listId}-purchased`} className="cursor-pointer">
                      Already purchased
                    </Label>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Ticked items drop off the crew's outstanding list.
                    </p>
                  </div>
                  <Switch
                    id={`${listId}-purchased`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Save changes' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
