export type RouteIconName =
  | 'LayoutDashboard'
  | 'ClipboardList'
  | 'Boxes'
  | 'ShieldCheck'
  | 'Package'
  | 'Sliders'
  | 'FolderTree'
  | 'Layers'
  | 'Tag'
  | 'Activity'
  | 'History'
  | 'FileSearch'
  | 'Compass';

export interface ModuleRootConfig {
  id: string;
  label: string;
  arabicLabel: string;
  basePath: string;
}

export interface BreadcrumbItem {
  label: string;
  arabicLabel?: string;
  path: string;
}

export interface NavigationChildItem {
  id: string;
  label: string;
  arabicLabel?: string;
  path: string;
  icon: RouteIconName;
  parentLabel: string;
  parentArabicLabel?: string;
  parentPath: string;
  description: string;
  arabicDescription?: string;
  phaseNote?: string;
}

export interface NavigationTreeItem {
  id: string;
  label: string;
  arabicLabel?: string;
  path: string;
  icon: RouteIconName;
  group: string;
  arabicGroup?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  description: string;
  arabicDescription?: string;
  phaseNote?: string;
  children?: NavigationChildItem[];
}

export interface ResolvedRoute {
  id: string;
  label: string;
  arabicLabel?: string;
  path: string;
  icon: RouteIconName;
  parentId?: string;
  parentLabel?: string;
  parentArabicLabel?: string;
  description: string;
  arabicDescription?: string;
  phaseNote?: string;
  breadcrumbs: BreadcrumbItem[];
}

export interface RouterQueryParams {
  flow?: string;
  assetId?: string;
  [key: string]: string | undefined;
}

export interface RouterContextValue {
  currentPath: string;
  rawPath?: string;
  queryParams: RouterQueryParams;
  currentRoute: ResolvedRoute;
  navigate: (nextPath: string) => void;
}
