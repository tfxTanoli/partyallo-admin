import { collection, getDocs } from 'firebase/firestore';
import { format, subMonths } from 'date-fns';
import type { DashboardService } from '../contracts';
import { COLLECTIONS, getDb } from './config';
import { mapEvent, mapPurchase, mapUser } from './mappers';
import { todayKey } from '@/utils/format';
import type {
  ActivityEntry,
  DeltaMetric,
  MonthlyEventPoint,
  UserGrowthPoint,
} from '@/types';

const MONTH_WINDOW = 12;

const DAY_MS = 24 * 60 * 60 * 1000;

function createdBetween<T extends { createdAt: string }>(rows: T[], from: number, to: number) {
  return rows.filter((row) => {
    const at = Date.parse(row.createdAt);
    return Number.isFinite(at) && at >= from && at < to;
  }).length;
}

/**
 * A genuine period-over-period comparison: how many records were created in the
 * last 30 days versus the 30 days before that.
 *
 * Comparing a running total against "total minus recent" instead produces
 * absurdities (34 events, 33 of them recent, reads as "+3300%"), so when there
 * is no prior-period baseline this returns `changePercent: null` and lets the
 * card show the absolute count.
 */
function toDelta<T extends { createdAt: string }>(value: number, rows: T[]): DeltaMetric {
  const now = Date.now();
  const current = createdBetween(rows, now - 30 * DAY_MS, now);
  const previous = createdBetween(rows, now - 60 * DAY_MS, now - 30 * DAY_MS);

  if (previous === 0) {
    return {
      value,
      absoluteChange: current,
      changePercent: null,
      trend: current > 0 ? 'up' : 'flat',
    };
  }

  const changePercent = ((current - previous) / previous) * 100;
  return {
    value,
    absoluteChange: current,
    changePercent: Number(changePercent.toFixed(1)),
    trend: changePercent > 0.5 ? 'up' : changePercent < -0.5 ? 'down' : 'flat',
  };
}

/** For metrics where "created recently" is not the interesting dimension. */
function toStatic(value: number): DeltaMetric {
  return { value, absoluteChange: 0, changePercent: null, trend: 'flat' };
}

/** `[{ key: '2026-03', label: 'Mar' }, …]` for the trailing 12 months. */
function monthBuckets(): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: MONTH_WINDOW }, (_, index) => {
    const date = subMonths(now, MONTH_WINDOW - 1 - index);
    return { key: format(date, 'yyyy-MM'), label: format(date, 'MMM') };
  });
}

/**
 * Aggregates are computed from a full read of four small collections
 * (tens–hundreds of documents). At significantly larger volumes, move this into
 * a scheduled Cloud Function that maintains a `metrics/{month}` document — the
 * return shape is designed to stay identical.
 */
export const firebaseDashboardService: DashboardService = {
  async getOverview() {
    const database = getDb();

    const [eventsSnap, stationsSnap, usersSnap, purchasesSnap] = await Promise.all([
      getDocs(collection(database, COLLECTIONS.events)),
      getDocs(collection(database, COLLECTIONS.stations)),
      getDocs(collection(database, COLLECTIONS.users)),
      getDocs(collection(database, COLLECTIONS.purchases)),
    ]);

    const events = eventsSnap.docs.map(mapEvent);
    const stations = stationsSnap.docs.map(mapStationLite);
    const users = usersSnap.docs.map(mapUser);
    const purchases = purchasesSnap.docs.map(mapPurchase);

    const today = todayKey();

    const upcoming = events.filter((event) => event.date >= today && event.status !== 'Complete');
    const completed = events.filter((event) => event.status === 'Complete');

    const buckets = monthBuckets();

    const eventsByMonth: MonthlyEventPoint[] = buckets.map(({ key, label }) => {
      const inMonth = events.filter((event) => event.date.startsWith(key));
      return {
        month: label,
        complete: inMonth.filter((event) => event.status === 'Complete').length,
        inProgress: inMonth.filter((event) => event.status !== 'Complete').length,
      };
    });

    // Anyone who signed up before the window forms the starting baseline.
    let runningTotal = users.filter((user) => user.createdAt < `${buckets[0]!.key}-01`).length;
    const usersGrowth: UserGrowthPoint[] = buckets.map(({ key, label }) => {
      const newUsers = users.filter((user) => user.createdAt.startsWith(key)).length;
      runningTotal += newUsers;
      return { month: label, total: runningTotal, newUsers };
    });

    // The activity feed is real packing history pulled from each event's logs.
    const activities: ActivityEntry[] = events
      .flatMap((event) =>
        event.logs.map((log) => ({
          id: `${event.id}:${log.id}`,
          eventId: event.id,
          eventName: event.eventName,
          packerName: log.packerName,
          action: log.action,
          at: log.timestamp,
        })),
      )
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 20);

    return {
      stats: {
        totalUsers: toDelta(users.length, users),
        totalEvents: toDelta(events.length, events),
        // "Upcoming" and "completed" are states, not creation events — a
        // 30-day creation delta on them would be noise.
        upcomingEvents: toStatic(upcoming.length),
        completedEvents: toStatic(completed.length),
        totalStations: toDelta(stations.length, stations),
      },
      eventsByMonth,
      usersGrowth,
      activities,
      outstandingPurchases: purchases.filter((item) => !item.purchased).length,
    };
  },
};

/** Only `createdAt` is needed for the station metric — skip the full mapper. */
function mapStationLite(snapshot: { data: () => Record<string, unknown> }): { createdAt: string } {
  const createdAt = snapshot.data().createdAt;
  return { createdAt: typeof createdAt === 'string' ? createdAt : '' };
}
