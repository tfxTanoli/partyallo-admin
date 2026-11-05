import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
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

const baseEventSchema = z.object({
  eventName: z.string().trim().min(2, 'Enter at least 2 characters').max(90, 'Name is too long'),
  clientName: z.string().trim().min(1, 'Enter the client name'),
  venue: z.string().trim().min(3, 'Enter the venue address'),
  date: z.string().min(1, 'Pick an event date'),
  // Required: it is what orders the crew app's packing lists, earliest first.
  startTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, 'Pick a start time'),
  eventDuration: z.string().trim().min(1, 'Enter a duration, e.g. 2h 0m'),
  status: z.enum(EVENT_STATUSES),
  servings: z
    .number({ error: 'Enter the number of servings' })
    .int('Whole numbers only')
    .min(1, 'At least 1 serving')
    .max(100000, 'That seems too high'),
  notes: z.string().trim().max(1000, 'Keep notes under 1000 characters').optional(),
});

/**
 * A start time is required on every new booking, so the crew app's running order
 * is complete. Events created before the field existed stay editable without
 * having to invent one — but once a time is set it cannot be cleared.
 */
function buildEventSchema(timeRequired: boolean) {
  return timeRequired
    ? baseEventSchema
    : baseEventSchema.extend({
        startTime: z
          .string()
          .trim()
          .regex(/^(\d{2}:\d{2})?$/, 'Pick a start time'),
      });
}

const EMPTY: EventFormValues = {
  eventName: '',
  clientName: '',
  venue: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '',
  eventDuration: '2h 0m',
  status: 'Packing',
  servings: 100,
  notes: '',
};

export interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this event. */
  event?: PartyEvent | null;
  /** Create a new event pre-filled from this one (its stations are copied on save). */
  duplicateFrom?: PartyEvent | null;
  onSubmit: (values: EventFormValues) => Promise<unknown>;
  loading?: boolean;
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  duplicateFrom,
  onSubmit,
  loading = false,
}: EventFormDialogProps) {
  const isEdit = Boolean(event);
  const isDuplicate = !isEdit && Boolean(duplicateFrom);
  // A duplicate is a new booking, so it needs a start time like any other.
  const timeRequired = !isEdit || Boolean(event?.startTime);

  // Guards against a double-click submitting twice before `loading` re-renders.
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const busy = loading || submitting;

  const duplicateSummary = useMemo(() => {
    if (!duplicateFrom) return null;
    const stations = new Set(
      duplicateFrom.packingList
        .filter((item) => item.stationName)
        .map((item) => item.stationInstanceId ?? item.stationName),
    ).size;
    return { stations, items: duplicateFrom.packingList.length };
  }, [duplicateFrom]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(buildEventSchema(timeRequired)),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    const source = event ?? duplicateFrom;
    reset(
      source
        ? {
            eventName: event ? source.eventName : `${source.eventName} (Copy)`,
            clientName: source.clientName,
            venue: source.venue,
            date: source.date,
            startTime: source.startTime ?? '',
            eventDuration: source.eventDuration,
            // A copy starts its own packing run.
            status: event ? source.status : 'Packing',
            servings: source.servings,
            notes: source.notes ?? '',
          }
        : EMPTY,
    );
  }, [open, event, duplicateFrom, reset]);

  const submit = handleSubmit(async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch {
      // The mutation hook has already shown an error toast; keep the form open
      // with the user's input so they can retry.
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  });

  const handleOpenChange = (next: boolean) => {
    // Closing mid-save would hide the result of a write that is still running.
    if (!next && busy) return;
    onOpenChange(next);
  };

  const title = isEdit ? 'Edit event' : isDuplicate ? 'Duplicate event' : 'Create an event';
  const description = isEdit
    ? 'These details are shared live with the PartyAllo crew app.'
    : isDuplicate
      ? `A new event based on ${duplicateFrom?.eventName}. Adjust the details, then save — the original is not changed.`
      : 'Step 1 of 2 — save the booking details. You will add its live stations next.';
  const submitLabel = isEdit ? 'Save changes' : isDuplicate ? 'Create duplicate' : 'Create & add stations';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-5 pb-6">
            {duplicateSummary ? (
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
                <Copy className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  Copies{' '}
                  <strong className="text-foreground">
                    {duplicateSummary.stations} {duplicateSummary.stations === 1 ? 'station' : 'stations'}
                  </strong>{' '}
                  and{' '}
                  <strong className="text-foreground">
                    {duplicateSummary.items} packing {duplicateSummary.items === 1 ? 'item' : 'items'}
                  </strong>
                  , with per-station pax. Packed/loaded ticks, station statuses and the activity log
                  start fresh.
                </p>
              </div>
            ) : null}

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
                label="Start time"
                required={timeRequired}
                hint="Orders the crew app's packing lists — earliest event first."
                error={errors.startTime?.message}
              >
                <Input type="time" invalid={Boolean(errors.startTime)} {...register('startTime')} />
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
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
