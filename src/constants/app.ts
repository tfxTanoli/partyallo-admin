export const APP_NAME = 'PartyAllo';
export const APP_TAGLINE = 'Event Packing Tracker';

export const STORAGE_KEYS = {
  theme: 'partyallo.admin.theme',
  primaryColor: 'partyallo.admin.primary-color',
  sidebarCollapsed: 'partyallo.admin.sidebar-collapsed',
  catalogueView: 'partyallo.admin.catalogue-view',
} as const;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Duration presets offered by the event form; the field also accepts free text. */
export const EVENT_DURATIONS = [
  '1h 0m',
  '1h 30m',
  '2h 0m',
  '2h 30m',
  '3h 0m',
  '4h 0m',
  '5h 0m',
  '6h 0m',
  '8h 0m',
] as const;
