import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Boxes,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/routes/paths';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Only highlight when the pathname matches exactly (used for the index route). */
  end?: boolean;
  description: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        to: ROUTES.dashboard,
        icon: LayoutDashboard,
        end: true,
        description: 'Live metrics across every event',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Users',
        to: ROUTES.users,
        icon: Users,
        description: 'Crew, managers and clients',
      },
      {
        label: 'Events',
        to: ROUTES.events,
        icon: CalendarDays,
        description: 'Bookings and packing progress',
      },
      {
        label: 'Station Catalogue',
        to: ROUTES.catalogue,
        icon: Boxes,
        description: 'Reusable packing templates',
      },
    ],
  },
  {
    title: 'Workspace',
    items: [
      {
        label: 'Settings',
        to: ROUTES.settings,
        icon: SettingsIcon,
        description: 'Branding and preferences',
      },
    ],
  },
];
