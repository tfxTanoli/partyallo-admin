import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/utils/cn';
import { STORAGE_KEYS } from '@/constants/app';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useAuth } from '@/providers/auth-provider';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { ROUTES } from '@/routes/paths';
import { Navbar } from './navbar';
import { SidebarNav } from './sidebar-nav';
import { EASE_OUT_EXPO } from '@/components/common/motion';

/**
 * The route element this transition container was created for.
 *
 * A plain `<Outlet />` inside the exiting container re-renders with the NEW
 * location, so the next page mounted inside the fading-out container and then
 * a second time once the exit finished — losing any state set on first mount
 * (e.g. a dialog opened on arrival) and running its effects twice.
 */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const { profile, signOut } = useAuth();

  const [collapsed, setCollapsed] = useLocalStorage(STORAGE_KEYS.sidebarCollapsed, false);
  const mobileNav = useDisclosure();

  // The mobile drawer must not linger once the layout grows into the desktop shell.
  const closeMobileNav = mobileNav.close;
  useEffect(() => {
    if (isDesktop) closeMobileNav();
  }, [isDesktop, closeMobileNav]);

  const handleSignOut = useCallback(() => {
    signOut();
    navigate(ROUTES.login, { replace: true });
  }, [navigate, signOut]);

  if (!profile) return null;

  return (
    <div className="surface-gradient flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 264 }}
        transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
        className="fixed inset-y-0 left-0 z-40 hidden shrink-0 border-r border-sidebar-border lg:block"
      >
        <SidebarNav collapsed={collapsed} onSignOut={handleSignOut} />
      </motion.aside>

      {/* Mobile sidebar */}
      <Drawer open={mobileNav.isOpen} onOpenChange={mobileNav.setOpen}>
        <DrawerContent side="left" width="sm" className="p-0 lg:hidden">
          <DrawerTitle className="sr-only">Navigation</DrawerTitle>
          <SidebarNav collapsed={false} onNavigate={mobileNav.close} onSignOut={handleSignOut} />
        </DrawerContent>
      </Drawer>

      {/* Main column */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out',
          collapsed ? 'lg:pl-20' : 'lg:pl-[264px]',
        )}
      >
        <Navbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onOpenMobileNav={mobileNav.open}
          profile={profile}
          onSignOut={handleSignOut}
        />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
              className="mx-auto w-full max-w-[100rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
            >
              <FrozenOutlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-border px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            PartyAllo Event Packing Tracker · Admin console
          </p>
        </footer>
      </div>
    </div>
  );
}
