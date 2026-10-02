import React from 'react';
import {
  Activity,
  Boxes,
  ClipboardList,
  Compass,
  FileSearch,
  FolderTree,
  History,
  Layers,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Sliders,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import type { RouteIconName } from '../types/navigation.ts';

const ICON_COMPONENTS: Record<RouteIconName, LucideIcon> = {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  ShieldCheck,
  Package,
  Sliders,
  FolderTree,
  Layers,
  Tag,
  Activity,
  History,
  FileSearch,
  Compass,
};

interface RouteIconProps {
  name: RouteIconName;
  className?: string;
}

export function RouteIcon({ name, className = 'w-4 h-4 shrink-0' }: RouteIconProps) {
  const IconComponent = ICON_COMPONENTS[name] || Boxes;
  return <IconComponent className={className} aria-hidden="true" />;
}
