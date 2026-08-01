import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  EVENT_STATUS_META,
  STATION_STATUS_META,
  USER_ROLE_META,
  USER_STATUS_META,
} from '@/constants/status';
import type { EventStatus, StationStatus, UserRole, UserStatus } from '@/types';

type Common = Omit<BadgeProps, 'tone' | 'children'>;

export function EventStatusBadge({ status, ...props }: { status: EventStatus } & Common) {
  const meta = EVENT_STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot {...props}>
      {meta.label}
    </Badge>
  );
}

export function StationStatusBadge({ status, ...props }: { status: StationStatus } & Common) {
  const meta = STATION_STATUS_META[status];
  return (
    <Badge tone={meta.tone} size="sm" dot {...props}>
      {meta.label}
    </Badge>
  );
}

export function UserStatusBadge({ status, ...props }: { status: UserStatus } & Common) {
  const meta = USER_STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot {...props}>
      {meta.label}
    </Badge>
  );
}

export function UserRoleBadge({ role, ...props }: { role: UserRole } & Common) {
  const meta = USER_ROLE_META[role];
  return (
    <Badge tone={meta.tone} size="sm" {...props}>
      {meta.label}
    </Badge>
  );
}
