import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { EVENT_STATUSES, type EventFormValues, type PartyEvent } from '@/types';
import { EVENT_DURATIONS } from '@/constants/app';
import { EVENT_STATUS_META } from '@/constants/status';
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

const eventSchema = z.object({
  eventName: z.string().trim().min(2, 'Enter at least 2 characters').max(90, 'Name is too long'),
  clientName: z.string().trim().min(1, 'Enter the client name'),
  venue: z.string().trim().min(3, 'Enter the venue address'),
  date: z.string().min(1, 'Pick an event date'),
  eventDuration: z.string().trim().min(1, 'Enter a duration, e.g. 2h 0m'),
  status: z.enum(EVENT_STATUSES),
  servings: z
    .number({ error: 'Enter the number of servings' })
    .int('Whole numbers only')
    .min(1, 'At least 1 serving')
    .max(100000, 'That seems too high'),
  notes: z.string().trim().max(1000, 'Keep notes under 1000 characters').optional(),
});

const EMPTY: EventFormValues = {
  eventName: '',
  clientName: '',
  venue: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  eventDuration: '2h 0m',
  status: 'Packing',
  servings: 100,
  notes: '',
};

export interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: PartyEvent | null;
  onSubmit: (values: EventFormValues) => Promise<unknown>;
  loading?: boolean;
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  onSubmit,
  loading = false,
}: EventFormDialogProps) {
  const isEdit = Boolean(event);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      event
        ? {
            eventName: event.eventName,
            clientName: event.clientName,
            venue: event.venue,
            date: event.date,
            eventDuration: event.eventDuration,
            status: event.status,
            servings: event.servings,
            notes: event.notes ?? '',
          }
        : EMPTY,
    );
  }, [open, event, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit event' : 'Create an event'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'These details are shared live with the PartyAllo crew app.'
              : 'Creates the booking. Stations and packing lists are assigned in the crew app.'}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-5 pb-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Event name" required error={errors.eventName?.message}>
                <Input
                  placeholder="Kristal"
                  invalid={Boolean(errors.eventName)}
                  {...register('eventName')}
                />
              </Field>

              <Field label="Client" required error={errors.clientName?.message}>
                <Input
                  placeholder="Client name or reference"
                  invalid={Boolean(errors.clientName)}
                  {...register('clientName')}
                />
              </Field>
            </div>

            <Field label="Venue" required error={errors.venue?.message}>
              <Input
                placeholder="28 Hoy Fatt Road #01-30, Singapore 151028"
                invalid={Boolean(errors.venue)}
                {...register('venue')}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Event date" required error={errors.date?.message}>
                <Input type="date" invalid={Boolean(errors.date)} {...register('date')} />
              </Field>

              <Field
                label="Duration"
                required
                hint={`e.g. ${EVENT_DURATIONS[2]}`}
                error={errors.eventDuration?.message}
              >
                <Input
                  list="event-duration-options"
                  placeholder="2h 0m"
                  invalid={Boolean(errors.eventDuration)}
                  {...register('eventDuration')}
                />
              </Field>
              <datalist id="event-duration-options">
                {EVENT_DURATIONS.map((duration) => (
                  <option key={duration} value={duration} />
                ))}
              </datalist>

              <Field
                label="Servings (pax)"
                required
                hint="Drives the quantities on every station's packing list."
                error={errors.servings?.message}
              >
                <Input
                  type="number"
                  min={1}
                  invalid={Boolean(errors.servings)}
                  {...register('servings', { valueAsNumber: true })}
                />
              </Field>

              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Field label="Packing status" required error={errors.status?.message}>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {EVENT_STATUS_META[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>

            <Field
              label="Notes"
              hint="Access restrictions, curfews, parking — anything the crew must know."
              error={errors.notes?.message}
            >
              <Textarea
                rows={3}
                placeholder="Loading bay closes at 01:30…"
                invalid={Boolean(errors.notes)}
                {...register('notes')}
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Save changes' : 'Create event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
