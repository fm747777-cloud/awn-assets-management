/**
 * AWN (عَوْن) — Assets Module Navigation & Route Hierarchy
 */

import type {
  ModuleRootConfig,
  NavigationTreeItem,
  ResolvedRoute,
} from '../types/navigation.ts';

export const MODULE_ROOT: ModuleRootConfig = {
  id: 'assets-module',
  label: 'Assets',
  arabicLabel: 'عَوْن · الأصول',
  basePath: '/assets',
};

export const NAVIGATION_TREE: NavigationTreeItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/assets/dashboard',
    icon: 'LayoutDashboard',
    group: 'Overview',
    description:
      'Executive summary of enterprise asset posture, compliance distribution, pending requests, and lifecycle health.',
    phaseNote:
      'Executive Command Center — Real-time asset posture, lifecycle distribution, and compliance monitoring.',
  },
  {
    id: 'requests',
    label: 'Requests',
    path: '/assets/requests',
    icon: 'ClipboardList',
    group: 'Operations',
    description:
      'Centralized intake and approval queue for asset requisitions, transfers, custodian assignments, and disposals.',
    phaseNote: 'Workspace Placeholder — Request approval workflows will bind in a later phase.',
  },
  {
    id: 'assets-group',
    label: 'Assets',
    path: '/assets/registry',
    icon: 'Boxes',
    group: 'Registry',
    collapsible: true,
    defaultExpanded: true,
    description:
      'Track and manage company assets like devices, licenses, and equipment. Assign assets to employees, monitor status, and reduce loss or misplacement.',
    children: [
      {
        id: 'compliance-assets',
        label: 'Compliance Assets',
        path: '/assets/compliance',
        icon: 'ShieldCheck',
        parentLabel: 'Assets',
        parentPath: '/assets/registry',
        description:
          'Assets governed by statutory, regulatory, safety, or periodic inspection mandates requiring active verification.',
        phaseNote: 'Compliance Assets Entry Point — Dedicated compliance forms will be implemented in the next phase.',
      },
      {
        id: 'non-compliance-assets',
        label: 'Non-Compliance Assets',
        path: '/assets/non-compliance',
        icon: 'Package',
        parentLabel: 'Assets',
        parentPath: '/assets/registry',
        description:
          'Standard operational devices, software licenses, and administrative equipment managed for custody and inventory tracking.',
        phaseNote: 'Non-Compliance Assets Entry Point — Dedicated non-compliance forms will be implemented in the next phase.',
      },
    ],
  },
  {
    id: 'master-group',
    label: 'Master',
    path: '/assets/master',
    icon: 'Sliders',
    group: 'Configuration',
    collapsible: true,
    defaultExpanded: true,
    description:
      'Foundational classification taxonomies, asset types, metadata tags, and lifecycle status definitions.',
    children: [
      {
        id: 'asset-categories',
        label: 'Asset Categories',
        path: '/assets/master/categories',
        icon: 'FolderTree',
        parentLabel: 'Master',
        parentPath: '/assets/master/categories',
        description:
          'Top-level functional and accounting classifications governing depreciation rules and compliance defaults.',
        phaseNote: 'Master Workspace Placeholder — Category management will bind in a later phase.',
      },
      {
        id: 'asset-types',
        label: 'Asset Types',
        path: '/assets/master/types',
        icon: 'Layers',
        parentLabel: 'Master',
        parentPath: '/assets/master/categories',
        description:
          'Granular specification templates mapped to parent Asset Categories for standardized data capture.',
        phaseNote: 'Master Workspace Placeholder — Type management will bind in a later phase.',
      },
      {
        id: 'asset-tags',
        label: 'Asset Tags',
        path: '/assets/master/tags',
        icon: 'Tag',
        parentLabel: 'Master',
        parentPath: '/assets/master/categories',
        description:
          'Controlled operational labels for cross-departmental grouping, cost-center tracking, and audit scoping.',
        phaseNote: 'Master Workspace Placeholder — Tag management will bind in a later phase.',
      },
      {
        id: 'asset-status',
        label: 'Asset Status',
        path: '/assets/master/status',
        icon: 'Activity',
        parentLabel: 'Master',
        parentPath: '/assets/master/categories',
        description:
          'Standardized lifecycle state definitions governing permissible transitions and operational availability.',
        phaseNote: 'Master Workspace Placeholder — Status configuration will bind in a later phase.',
      },
    ],
  },
  {
    id: 'audit-trail-group',
    label: 'Audit Trail',
    path: '/assets/audit',
    icon: 'History',
    group: 'Governance',
    collapsible: true,
    defaultExpanded: true,
    description:
      'Immutable chronological ledger of asset creation, field modifications, custody transfers, and status changes.',
    children: [
      {
        id: 'audit-trails',
        label: 'Audit Trails',
        path: '/assets/audit-trails',
        icon: 'FileSearch',
        parentLabel: 'Audit Trail',
        parentPath: '/assets/audit-trails',
        description:
          'Searchable event log recording actor identity, timestamp, target entity, and before/after field diffs.',
        phaseNote: 'Governance Workspace Placeholder — Detailed audit inspection will bind in a later phase.',
      },
    ],
  },
];

export function getAllRoutes(): ResolvedRoute[] {
  const routes: ResolvedRoute[] = [];
  NAVIGATION_TREE.forEach((item) => {
    routes.push({
      id: item.id,
      label: item.label,
      path: item.path,
      icon: item.icon,
      description: item.description,
      phaseNote: item.phaseNote,
      breadcrumbs:
        item.id === 'assets-group'
          ? [{ label: 'Assets', path: '/assets/registry' }]
          : [
              { label: 'Assets', path: '/assets/registry' },
              { label: item.label, path: item.path },
            ],
    });

    if (Array.isArray(item.children)) {
      item.children.forEach((child) => {
        routes.push({
          id: child.id,
          label: child.label,
          path: child.path,
          icon: child.icon,
          parentId: item.id,
          parentLabel: item.label,
          description: child.description,
          phaseNote: child.phaseNote,
          breadcrumbs: [
            { label: 'Assets', path: '/assets/registry' },
            ...(item.id !== 'assets-group'
              ? [{ label: item.label, path: item.children?.[0]?.path || item.path }]
              : []),
            { label: child.label, path: child.path },
          ],
        });
      });
    }
  });

  return routes;
}

export function resolveRouteByPath(pathname?: string | null): ResolvedRoute {
  const allRoutes = getAllRoutes();
  const cleanPath = String(pathname || '').split('?')[0];
  const normalized =
    cleanPath === '/' || cleanPath === '/assets' || !cleanPath
      ? '/assets/registry'
      : cleanPath;
  return (
    allRoutes.find((r) => r.path === normalized) ||
    allRoutes.find((r) => r.id === 'assets-group') ||
    allRoutes[0]
  );
}
