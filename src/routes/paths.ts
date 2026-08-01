export const ROUTES = {
  login: '/login',
  dashboard: '/',
  users: '/users',
  events: '/events',
  eventDetails: '/events/:eventId',
  catalogue: '/catalogue',
  settings: '/settings',
} as const;

export function eventDetailsPath(eventId: string): string {
  return ROUTES.eventDetails.replace(':eventId', eventId);
}
