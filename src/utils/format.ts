import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';
import type { ISODateString } from '@/types';

function toDate(value: ISODateString | Date): Date | null {
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? date : null;
}

export function formatDate(value: ISODateString | Date, pattern = 'dd MMM yyyy'): string {
  const date = toDate(value);
  return date ? format(date, pattern) : '—';
}

/** Today as `yyyy-MM-dd`, matching how the PWA stores `event.date`. */
export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** True when a `yyyy-MM-dd` date string is today or later. */
export function isUpcoming(dateKey: string): boolean {
  return dateKey >= todayKey();
}

export function formatDateTime(value: ISODateString | Date): string {
  const date = toDate(value);
  return date ? format(date, "dd MMM yyyy 'at' HH:mm") : '—';
}

export function formatTime(value: ISODateString | Date): string {
  const date = toDate(value);
  return date ? format(date, 'HH:mm') : '—';
}

export function formatRelative(value: ISODateString | Date): string {
  const date = toDate(value);
  if (!date) return '—';
  return `${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatSigned(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(fractionDigits)}%`;
}

/** "Ava Thompson" -> "AT" */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/** Deterministic hue per string — keeps avatar colours stable between renders. */
export function stringToHue(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function truncate(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
