import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { GlobalSearch } from './global-search';
import { ProfileMenu } from './profile-menu';
import { ThemeToggle } from './theme-toggle';
import type { AdminProfile } from '@/types';

export interface NavbarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobileNav: () => void;
  profile: AdminProfile;
  onSignOut: () => void;
}

export function Navbar({
  collapsed,
  onToggleCollapse,
  onOpenMobileNav,
  profile,
  onSignOut,
}: NavbarProps) {
  return (
    <header className="glass-navbar sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 sm:gap-3 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="bottom">
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </Tooltip>

      <div className="ml-1 flex-1 md:ml-2 md:flex-none">
        <GlobalSearch />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1 sm:gap-1.5">

        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <ProfileMenu profile={profile} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
