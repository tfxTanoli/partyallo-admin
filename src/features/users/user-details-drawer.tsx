import type { ReactNode } from 'react';
import {
  CalendarDays,
  Clock,
  KeyRound,
  Mail,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { UserRoleBadge, UserStatusBadge } from '@/components/common/status-badge';
import { formatDate, formatRelative } from '@/utils/format';
import type { User } from '@/types';

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function providerLabel(providers: string[]): string {
  if (providers.includes('google.com')) return 'Google';
  if (providers.includes('password')) return 'Email and password';
  return providers.join(', ') || 'Unknown';
}

export interface UserDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  isSelf: boolean;
  onEdit: (user: User) => void;
  onToggleRole: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserDetailsDrawer({
  open,
  onOpenChange,
  user,
  isSelf,
  onEdit,
  onToggleRole,
  onDelete,
}: UserDetailsDrawerProps) {
  const isAdmin = user?.role === 'admin';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent width="md">
        {user ? (
          <>
            <DrawerHeader>
              <DrawerTitle>User details</DrawerTitle>
              <DrawerDescription>
                Profile, access level and sign-in history for this account.
              </DrawerDescription>
            </DrawerHeader>

            <DrawerBody className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar name={user.displayName} src={user.photoUrl} size="xl" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-tight text-foreground">
                    {user.displayName}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <UserStatusBadge status={user.status} />
                    <UserRoleBadge role={user.role} />
                  </div>
                </div>
              </div>

              <div
                className={
                  isAdmin
                    ? 'rounded-xl border border-primary/25 bg-primary-soft p-4'
                    : 'rounded-xl border border-border bg-muted/40 p-4'
                }
              >
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {isAdmin ? (
                    <ShieldCheck className="size-4 text-primary" />
                  ) : (
                    <ShieldOff className="size-4 text-muted-foreground" />
                  )}
                  {isAdmin ? 'Has admin console access' : 'Crew app only'}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {isAdmin
                    ? 'This account can sign in here and manage every event, station and user.'
                    : 'This account can use the PartyAllo crew app but cannot sign in to this console.'}
                </p>
              </div>

              <Separator />

              <div className="divide-y divide-border">
                <DetailRow
                  icon={<Mail />}
                  label="Email"
                  value={
                    <a href={`mailto:${user.email}`} className="hover:text-primary hover:underline">
                      {user.email}
                    </a>
                  }
                />
                <DetailRow
                  icon={<KeyRound />}
                  label="Sign-in method"
                  value={providerLabel(user.providers)}
                />
                <DetailRow
                  icon={<CalendarDays />}
                  label="Account created"
                  value={formatDate(user.createdAt)}
                />
                <DetailRow
                  icon={<Clock />}
                  label="Last sign-in"
                  value={user.lastSignInAt ? formatRelative(user.lastSignInAt) : 'Never signed in'}
                />
              </div>
            </DrawerBody>

            <DrawerFooter className="flex-wrap">
              <Button variant="primary" leftIcon={<Pencil />} onClick={() => onEdit(user)}>
                Edit
              </Button>
              <Button
                variant="outline"
                leftIcon={isAdmin ? <ShieldOff /> : <ShieldCheck />}
                disabled={isSelf}
                onClick={() => onToggleRole(user)}
              >
                {isAdmin ? 'Remove admin' : 'Make admin'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove profile"
                disabled={isSelf}
                className="ml-auto text-danger hover:bg-danger-soft hover:text-danger"
                onClick={() => onDelete(user)}
              >
                <Trash2 />
              </Button>
            </DrawerFooter>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
