import type { DeltaMetric, ISODateString } from './common';

/** Activity is derived from real event `logs[]` — nothing is synthesised. */
export interface ActivityEntry {
  id: string;
  eventId: string;
  eventName: string;
  packerName: string;
  action: string;
  at: ISODateString;
}

export interface DashboardStats {
  totalUsers: DeltaMetric;
  totalEvents: DeltaMetric;
  upcomingEvents: DeltaMetric;
  completedEvents: DeltaMetric;
  totalStations: DeltaMetric;
}

export interface MonthlyEventPoint {
  month: string;
  complete: number;
  inProgress: number;
}

export interface UserGrowthPoint {
  month: string;
  total: number;
  newUsers: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  eventsByMonth: MonthlyEventPoint[];
  usersGrowth: UserGrowthPoint[];
  activities: ActivityEntry[];
  /** Outstanding items in the purchase registry — surfaced as a headline number. */
  outstandingPurchases: number;
}
