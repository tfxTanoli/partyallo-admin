import type { PartyEvent } from '@/types';

type Scheduled = Pick<PartyEvent, 'date' | 'startTime' | 'eventDuration'>;

/**
 * Event scheduling helpers. `startTime` is a 24h `HH:mm` clock string written by
 * the crew app's time input — deliberately not a `Date`, because an event's
 * start is a wall-clock time at the venue, not an instant.
 */

/** Minutes since midnight, or null when the value is missing or malformed. */
export function parseClockTime(value?: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) return null;
  return hours * 60 + mins;
}

/** `14:30` → `2:30 PM`. Empty string when there is no usable time. */
export function formatClockTime(value?: string): string {
  const total = parseClockTime(value);
  if (total === null) return '';
  const hour = Math.floor(total / 60);
  const mins = total % 60;
  return `${hour % 12 || 12}:${String(mins).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

/** Hours+minutes of an `eventDuration` string such as "2h 30m". */
export function parseEventDuration(duration?: string): { hours: number; mins: number } {
  const h = /(\d+)\s*h/.exec(duration ?? '');
  const m = /(\d+)\s*m/.exec(duration ?? '');
  return { hours: h ? Number(h[1]) : 0, mins: m ? Number(m[1]) : 0 };
}

/** Clock time the event ends, wrapping past midnight for late-night bookings. */
export function getEventEndTime(startTime?: string, duration?: string): string | undefined {
  const start = parseClockTime(startTime);
  if (start === null) return undefined;
  const { hours, mins } = parseEventDuration(duration);
  const length = hours * 60 + mins;
  if (length <= 0) return undefined;
  const end = (start + length) % (24 * 60);
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
}

/** `2:30 PM – 5:30 PM`, or just the start when the duration is unusable. */
export function formatEventTimeRange(event: Scheduled): string {
  const start = formatClockTime(event.startTime);
  if (!start) return '';
  const end = formatClockTime(getEventEndTime(event.startTime, event.eventDuration));
  return end ? `${start} – ${end}` : start;
}

/**
 * Ascending running order: by day, then by start time within the day, so the
 * table reads in the order the crew packs. Events with no start time trail the
 * timed ones for their day — they are unscheduled, not midnight.
 */
export function compareEventSchedule(a: Scheduled, b: Scheduled): number {
  const byDate = (a.date ?? '').localeCompare(b.date ?? '');
  if (byDate !== 0) return byDate;

  const aTime = parseClockTime(a.startTime);
  const bTime = parseClockTime(b.startTime);
  if (aTime === bTime) return 0;
  if (aTime === null) return 1;
  if (bTime === null) return -1;
  return aTime - bTime;
}

/** `compareEventSchedule` applied in either direction; `desc` is its exact mirror. */
export function sortByEventSchedule<T extends Scheduled>(rows: T[], direction: 'asc' | 'desc'): T[] {
  const sorted = [...rows].sort(compareEventSchedule);
  return direction === 'asc' ? sorted : sorted.reverse();
}
