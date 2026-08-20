import type { LucideIcon } from 'lucide-react';

interface NavigationItem {
  title: string;
  href?: string;
  icon?: LucideIcon;
  items?: NavigationItem[];
}

interface NavigationSection {
  label: string | null;
  items: NavigationItem[];
}

interface DashboardNavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  subtitle?: string;
}

export type { DashboardNavigationItem, NavigationItem, NavigationSection };
