export const ROUTES = {
  login: '/login',
  dashboard: '/',
  users: '/users',
  events: '/events',
  eventDetails: '/events/:eventId',
  catalogue: '/catalogue',
  purchases: '/purchases',
  settings: '/settings',
} as const;

/** Router state accepted by the event details page. */
export interface EventDetailsLocationState {
  /** Open the "add stations" step on arrival — set right after creating an event. */
  addStations?: boolean;
}

export function eventDetailsPath(eventId: string): string {
  return ROUTES.eventDetails.replace(':eventId', eventId);
}
