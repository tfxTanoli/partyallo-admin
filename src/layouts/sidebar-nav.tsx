import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';
import { NAV_SECTIONS } from '@/constants/navigation';

import { BrandMark } from '@/components/common/brand-mark';
import { Tooltip } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useSettingsValue } from '@/features/settings/hooks/use-settings';

export interface SidebarNavProps {
  collapsed: boolean;
  /** Called after a nav item is chosen — used to close the mobile drawer. */
  onNavigate?: () => void;
  onSignOut: () => void;
}

export function SidebarNav({ collapsed, onNavigate, onSignOut }: SidebarNavProps) {
  const settings = useSettingsValue();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-3' : 'gap-3 px-5',
        )}
      >
        <BrandMark logoUrl={settings.logoUri} name={settings.companyName} />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-[0.9375rem] font-semibold leading-tight tracking-tight text-foreground">
              {settings.companyName}
            </p>
            <p className="truncate text-[0.6875rem] text-muted-foreground">
              {settings.appSubtitle}
            </p>
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 py-5"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed ? (
              <p className="px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {section.title}
              </p>
            ) : (
              <Separator className="mx-auto w-6 bg-sidebar-border" />
            )}

            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <Tooltip
                  key={item.to}
                  content={item.label}
                  side="right"
                  disabled={!collapsed}
                >
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                        collapsed ? 'h-10 w-10 justify-center' : 'h-10 gap-3 px-3',
                        isActive
                          ? 'bg-primary-soft text-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          <motion.span
                            layoutId="sidebar-active-indicator"
                            className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          />
                        ) : null}
                        <Icon className="size-4.5 shrink-0" />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </>
                    )}
                  </NavLink>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="mb-3 rounded-xl border border-sidebar-border bg-gradient-to-br from-primary/8 to-secondary/8 p-3.5">
            <p className="text-xs font-semibold text-foreground">Packing season is here</p>
            <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
              Duplicate a station catalogue to spin up a new event in seconds.
            </p>
          </div>
        ) : null}

        <Tooltip content="Log out" side="right" disabled={!collapsed}>
          <button
            type="button"
            onClick={onSignOut}
            className={cn(
              'flex w-full items-center rounded-xl text-sm font-medium text-sidebar-foreground transition-colors hover:bg-danger-soft hover:text-danger',
              collapsed ? 'h-10 w-10 justify-center' : 'h-10 gap-3 px-3',
            )}
          >
            <LogOut className="size-4.5 shrink-0" />
            {!collapsed ? <span>Logout</span> : null}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
