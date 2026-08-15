import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  section: 'Overview' | 'Operations' | 'Intelligence' | 'Governance' | 'System';
};