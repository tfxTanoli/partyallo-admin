import { Link } from 'react-router-dom';
import { ChevronDown, LifeBuoy, LogOut, Settings, UserCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/routes/paths';
import { titleCase } from '@/utils/format';
import type { AdminProfile } from '@/types';

export interface ProfileMenuProps {
  profile: AdminProfile;
  onSignOut: () => void;
}

export function ProfileMenu({ profile, onSignOut }: ProfileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 pl-1.5 pr-2 sm:pr-3"
          aria-label="Account menu"
        >
          <Avatar name={profile.name} src={profile.avatarUrl} size="sm" />
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[9rem] truncate text-sm font-medium text-foreground">
              {profile.name}
            </span>
            <span className="text-[0.6875rem] text-muted-foreground">
              {titleCase(profile.role)}
            </span>
          </span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
        <div className="flex items-center gap-3 px-2.5 pb-2.5 pt-1">
          <Avatar name={profile.name} src={profile.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <div className="px-2.5 pb-2">
          <Badge tone="primary" size="sm">
            {titleCase(profile.role)}
          </Badge>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to={ROUTES.settings}>
            <UserCircle />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.settings}>
            <Settings />
            Workspace settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="https://partyallo.com/help" target="_blank" rel="noreferrer">
            <LifeBuoy />
            Help &amp; support
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem destructive onSelect={onSignOut}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
