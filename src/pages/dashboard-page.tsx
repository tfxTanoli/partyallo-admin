import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Boxes,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { StatCard, StatCardSkeleton } from '@/components/common/stat-card';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { EventStatusBadge, UserRoleBadge } from '@/components/common/status-badge';
import { staggerContainer } from '@/components/common/motion';
import { ChartSkeleton, EventsByMonthChart, UsersGrowthChart } from '@/components/charts';
import { ActivityFeed, ActivityFeedSkeleton } from '@/features/dashboard/activity-feed';
import { QuickActions } from '@/features/dashboard/quick-actions';
import {
  useDashboardOverview,
  useRecentEvents,
  useRecentUsers,
} from '@/features/dashboard/hooks/use-dashboard';
import { useCreateEvent } from '@/features/events/hooks/use-events';
import { useAllCatalogues, useCreateCatalogue } from '@/features/catalogue/hooks/use-catalogues';
import { EventFormDialog } from '@/features/events/event-form-dialog';
import { CatalogueFormDialog } from '@/features/catalogue/catalogue-form-dialog';
import { computePackingProgress } from '@/features/events/packing';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useAuth } from '@/providers/auth-provider';
import { formatDate, formatNumber, formatRelative } from '@/utils/format';
import { formatClockTime } from '@/utils/schedule';
import { ROUTES, eventDetailsPath, type EventDetailsLocationState } from '@/routes/paths';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const overview = useDashboardOverview();
  const recentEvents = useRecentEvents(5);
  const recentUsers = useRecentUsers(5);
  const { data: allStations } = useAllCatalogues();

  const eventDialog = useDisclosure();
  const stationDialog = useDisclosure();

  const createEvent = useCreateEvent();
  const createStation = useCreateCatalogue();

  const stats = overview.data?.stats;
  const categories = [...new Set((allStations ?? []).map((station) => station.category))].sort();

  return (
    <div className="space-y-7">
      <PageHeader
        title={`${greeting()}, ${profile?.name.split(' ')[0] ?? 'there'}`}
        description="Live data from the PartyAllo workspace — shared with the crew app."
        actions={
          <Button variant="outline" asChild rightIcon={<ArrowRight />}>
            <Link to={ROUTES.events}>View all events</Link>
          </Button>
        }
      />

      {overview.isError ? (
        <ErrorState onRetry={() => void overview.refetch()} />
      ) : (
        <>
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            aria-label="Key metrics"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
          >
            {overview.isPending || !stats ? (
              Array.from({ length: 5 }, (_, index) => <StatCardSkeleton key={index} />)
            ) : (
              <>
                <StatCard label="Total users" metric={stats.totalUsers} icon={Users} tone="primary" />
                <StatCard
                  label="Total events"
                  metric={stats.totalEvents}
                  icon={CalendarDays}
                  tone="secondary"
                />
                <StatCard
                  label="Upcoming events"
                  metric={stats.upcomingEvents}
                  icon={CalendarClock}
                  tone="warning"
                  staticLabel="dated today or later, not complete"
                />
                <StatCard
                  label="Completed events"
                  metric={stats.completedEvents}
                  icon={CalendarCheck2}
                  tone="success"
                  staticLabel={`of ${stats.totalEvents.value} total`}
                />
                <StatCard
                  label="Stations"
                  metric={stats.totalStations}
                  icon={Boxes}
                  tone="info"
                />
              </>
            )}
          </motion.section>

          {overview.data && overview.data.outstandingPurchases > 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                to={ROUTES.purchases}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/25 bg-warning-soft px-5 py-4 transition-colors hover:border-warning/40 hover:brightness-[0.99]"
              >
                <ShoppingCart className="size-4 shrink-0 text-warning" />
                <p className="flex-1 text-sm text-foreground">
                  <strong className="font-semibold">
                    {overview.data.outstandingPurchases} item
                    {overview.data.outstandingPurchases === 1 ? '' : 's'}
                  </strong>{' '}
                  still outstanding in the purchase registry.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                  Manage purchases
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </motion.div>
          ) : null}

          <motion.section variants={staggerContainer} initial="hidden" animate="visible">
            <h2 className="sr-only">Quick actions</h2>
            <QuickActions
              onCreateEvent={eventDialog.open}
              onCreateStation={stationDialog.open}
            />
          </motion.section>

          <motion.section
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid items-start gap-6 xl:grid-cols-5"
          >
            <SectionCard
              title="Events by month"
              description="Bookings across the trailing 12 months, split by completion."
              className="xl:col-span-3"
            >
              {overview.isPending || !overview.data ? (
                <ChartSkeleton />
              ) : (
                <EventsByMonthChart data={overview.data.eventsByMonth} />
              )}
            </SectionCard>

            <SectionCard
              title="Users growth"
              description="Cumulative accounts. Hover for monthly sign-ups."
              className="xl:col-span-2"
            >
              {overview.isPending || !overview.data ? (
                <ChartSkeleton />
              ) : (
                <UsersGrowthChart data={overview.data.usersGrowth} />
              )}
            </SectionCard>
          </motion.section>

          <motion.section
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid items-start gap-6 xl:grid-cols-5"
          >
            <SectionCard
              title="Recent events"
              description="The bookings that changed most recently."
              className="xl:col-span-3"
              action={
                <Button variant="ghost" size="sm" asChild rightIcon={<ArrowRight />}>
                  <Link to={ROUTES.events}>All events</Link>
                </Button>
              }
            >
              {recentEvents.isPending ? (
                <ul className="space-y-3">
                  {Array.from({ length: 5 }, (_, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </li>
                  ))}
                </ul>
              ) : (recentEvents.data?.length ?? 0) === 0 ? (
                <EmptyState
                  size="sm"
                  icon={CalendarDays}
                  title="No events yet"
                  description="Create a booking to see it appear here."
                />
              ) : (
                <ul className="space-y-1">
                  {recentEvents.data?.map((event) => {
                    const progress = computePackingProgress(event);
                    return (
                      <li key={event.id}>
                        <Link
                          to={eventDetailsPath(event.id)}
                          className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent/60"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {event.eventName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {event.clientName || 'No client'} ·{' '}
                              {event.date ? formatDate(event.date) : 'No date'}
                              {formatClockTime(event.startTime)
                                ? `, ${formatClockTime(event.startTime)}`
                                : ''}{' '}
                              · {formatNumber(event.servings)} pax
                            </span>
                          </span>

                          {progress.itemsTotal > 0 ? (
                            <span className="hidden w-24 items-center gap-2 sm:flex">
                              <Progress
                                value={progress.percentPacked}
                                size="sm"
                                label={`${event.eventName} packing progress`}
                                indicatorClassName={
                                  progress.percentPacked >= 100 ? 'bg-success' : 'bg-primary'
                                }
                              />
                              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {progress.percentPacked}%
                              </span>
                            </span>
                          ) : null}

                          <EventStatusBadge status={event.status} className="shrink-0" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Recent packing activity"
              description="Live from the crew app."
              className="xl:col-span-2"
            >
              {overview.isPending || !overview.data ? (
                <ActivityFeedSkeleton />
              ) : (
                <ActivityFeed activities={overview.data.activities.slice(0, 6)} />
              )}
            </SectionCard>

            <SectionCard
              title="Newest accounts"
              description="Everyone who has signed up for PartyAllo."
              className="xl:col-span-5"
              action={
                <Button variant="ghost" size="sm" asChild rightIcon={<ArrowRight />}>
                  <Link to={ROUTES.users}>All users</Link>
                </Button>
              }
            >
              {recentUsers.isPending ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-xl border border-border p-3.5"
                    >
                      <Skeleton className="size-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (recentUsers.data?.length ?? 0) === 0 ? (
                <EmptyState
                  size="sm"
                  icon={Users}
                  title="No accounts yet"
                  description="Accounts appear once someone signs up in the crew app."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {recentUsers.data?.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/25 p-3.5 transition-colors hover:border-primary/25 hover:bg-muted/45"
                    >
                      <Avatar name={user.displayName} src={user.photoUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Joined {formatRelative(user.createdAt)}
                        </p>
                        <UserRoleBadge role={user.role} className="mt-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.section>
        </>
      )}

      <EventFormDialog
        open={eventDialog.isOpen}
        onOpenChange={eventDialog.setOpen}
        loading={createEvent.isPending}
        onSubmit={async (values) => {
          const created = await createEvent.mutateAsync(values);
          // Step 2: the details page opens the station picker for the new event.
          navigate(eventDetailsPath(created.id), {
            state: { addStations: true } satisfies EventDetailsLocationState,
          });
        }}
      />

      <CatalogueFormDialog
        open={stationDialog.isOpen}
        onOpenChange={stationDialog.setOpen}
        loading={createStation.isPending}
        categories={categories}
        onSubmit={(values) => createStation.mutateAsync(values)}
      />
    </div>
  );
}
