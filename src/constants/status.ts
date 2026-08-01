import type { EventStatus, StationStatus, UserRole, UserStatus } from '@/types';
import type { BadgeTone } from '@/components/ui/badge';

interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

/** Mirrors the PWA's four-stage packing lifecycle. */
export const EVENT_STATUS_META: Record<EventStatus, StatusMeta> = {
  Packing: { label: 'Packing', tone: 'warning' },
  Loading: { label: 'Loading', tone: 'info' },
  Loaded: { label: 'Loaded', tone: 'secondary' },
  Complete: { label: 'Complete', tone: 'success' },
};

export const STATION_STATUS_META: Record<StationStatus, StatusMeta> = EVENT_STATUS_META;

export const USER_ROLE_META: Record<UserRole, StatusMeta> = {
  admin: { label: 'Admin', tone: 'primary' },
  crew: { label: 'Crew', tone: 'neutral' },
};

export const USER_STATUS_META: Record<UserStatus, StatusMeta> = {
  active: { label: 'Active', tone: 'success' },
  disabled: { label: 'Disabled', tone: 'danger' },
};
