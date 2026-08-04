import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CalendarDays,
  CalendarX,
  Clock,
  MapPin,
  Pencil,
  StickyNote,
  Trash2,
  Truck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress, RadialProgress } from '@/components/ui/progress';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EventStatusBadge } from '@/components/common/status-badge';
import { fadeInUp, staggerContainer } from '@/components/common/motion';
import { EventTimeline } from '@/features/events/event-timeline';
import { EventStations } from '@/features/events/event-stations';
import { EventPackingList } from '@/features/events/event-packing-list';
import { EventFormDialog } from '@/features/events/event-form-dialog';
import { computePackingProgress, summariseStations } from '@/features/events/packing';
import { useDeleteEvent, useEvent, useUpdateEvent } from '@/features/events/hooks/use-events';
import { useDisclosure } from '@/hooks/use-disclosure';
import { formatDate, formatNumber, isUpcoming } from '@/utils/format';
import { formatClockTime, formatEventTimeRange } from '@/utils/schedule';
import { ROUTES } from '@/routes/paths';

function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-9 w-80" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <SkeletonText lines={6} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: event, isPending, isError } = useEvent(eventId);
  const editDialog = useDisclosure();
  const deleteDialog = useDisclosure();

  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const confirmDelete = useCallback(async () => {
    if (!eventId) return;
    await deleteEvent.mutateAsync(eventId);
    deleteDialog.close();
    navigate(ROUTES.events, { replace: true });
  }, [deleteDialog, deleteEvent, eventId, navigate]);

  if (isPending) return <DetailsSkeleton />;

  if (isError || !event) {
    return (
      <EmptyState
        icon={CalendarX}
        title="Event not found"
        description="This booking may have been deleted, or the link is out of date."
        action={
          <Button leftIcon={<ArrowLeft />} onClick={() => navigate(ROUTES.events)}>
            Back to events
          </Button>
        }
      />
    );
  }

  const progress = computePackingProgress(event);
  const stations = summariseStations(event);

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.eventName}
        description={event.venue || 'No venue recorded'}
        breadcrumbs={[{ label: 'Events', to: ROUTES.events }, { label: event.eventName }]}
        meta={
          <>
            <EventStatusBadge status={event.status} />
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {event.date ? formatDate(event.date) : 'No date'}
              {event.date ? (isUpcoming(event.date) ? ' · upcoming' : ' · past') : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-3.5" />
              {formatEventTimeRange(event) || event.eventDuration || '—'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-3.5" />
              {formatNumber(event.servings)} pax
              {event.paxMode === 'auto' ? ' (auto)' : ''}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="outline" leftIcon={<ArrowLeft />} onClick={() => navigate(ROUTES.events)}>
              Back
            </Button>
            <Button leftIcon={<Pencil />} onClick={editDialog.open}>
              Edit event
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete event"
              className="text-danger hover:bg-danger-soft hover:text-danger"
              onClick={deleteDialog.open}
            >
              <Trash2 />
            </Button>
          </>
        }
      />

      {/* Two independent columns so a tall card never stretches its neighbour. */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid items-start gap-6 lg:grid-cols-3"
      >
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Packing progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-8 sm:flex-row">
                <RadialProgress
                  value={progress.percentPacked}
                  size={148}
                  strokeWidth={12}
                  indicatorClassName={
                    progress.percentPacked >= 100 ? 'stroke-success' : 'stroke-primary'
                  }
                >
                  <span className="text-3xl font-semibold tabular-nums text-foreground">
                    {progress.percentPacked}%
                  </span>
                  <span className="text-xs text-muted-foreground">packed</span>
                </RadialProgress>

                <div className="grid flex-1 grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-muted/35 p-4">
                    <p className="text-xl font-semibold tabular-nums text-foreground">
                      {formatNumber(progress.itemsPacked)} / {formatNumber(progress.itemsTotal)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Items packed</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/35 p-4">
                    <p className="text-xl font-semibold tabular-nums text-foreground">
                      {progress.stationsComplete}/{progress.stationsTotal}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Stations complete</p>
                  </div>
                  <div className="col-span-2 rounded-xl border border-border bg-muted/35 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Truck className="size-3.5" />
                        Loaded onto vehicles
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {progress.percentLoaded}%
                      </p>
                    </div>
                    <Progress
                      value={progress.percentLoaded}
                      size="sm"
                      className="mt-2.5"
                      label="Loading progress"
                      indicatorClassName="bg-secondary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Packing list</CardTitle>
              </CardHeader>
              <CardContent>
                <EventPackingList items={event.packingList} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Packing activity</CardTitle>
              </CardHeader>
              <CardContent>
                <EventTimeline logs={event.logs} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="mt-0.5 font-medium text-foreground">{event.clientName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="mt-0.5 flex items-start gap-2 font-medium text-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span className="break-words">{event.venue || '—'}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-border bg-muted/35 p-3.5">
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {formatNumber(event.servings)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Servings</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/35 p-3.5">
                    <p className="text-lg font-semibold text-foreground">
                      {formatClockTime(event.startTime) || '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Starts{event.eventDuration ? ` · ${event.eventDuration}` : ''}
                    </p>
                  </div>
                </div>
                <p className="pt-1 text-xs text-muted-foreground">
                  Created {formatDate(event.createdAt)} · updated {formatDate(event.updatedAt)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Stations ({stations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <EventStations stations={stations} />
              </CardContent>
            </Card>
          </motion.div>

          {event.notes ? (
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote className="size-4 text-muted-foreground" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {event.notes}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </div>
      </motion.div>

      <EventFormDialog
        open={editDialog.isOpen}
        onOpenChange={editDialog.setOpen}
        event={event}
        loading={updateEvent.isPending}
        onSubmit={(values) => updateEvent.mutateAsync({ id: event.id, values })}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete this event?"
        description={
          <>
            <strong className="text-foreground">{event.eventName}</strong> and its packing progress
            will be permanently removed — including from the crew app. This cannot be undone.
          </>
        }
        confirmLabel="Delete event"
        loading={deleteEvent.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
