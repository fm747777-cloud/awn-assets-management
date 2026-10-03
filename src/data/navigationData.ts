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
    arabicLabel: 'لوحة المعلومات',
    path: '/assets/dashboard',
    icon: 'LayoutDashboard',
    group: 'Overview',
    arabicGroup: 'نظرة عامة',
    description:
      'Executive summary of enterprise asset posture, compliance distribution, pending requests, and lifecycle health.',
    arabicDescription:
      'لوحة قيادية تنفيذية لمتابعة محفظة الأصول المؤسسية، الامتثال النظامي، والجاهزية التشغيلية.',
    phaseNote:
      'Executive Command Center — Real-time asset posture, lifecycle distribution, and compliance monitoring.',
  },
  {
    id: 'requests',
    label: 'Requests',
    arabicLabel: 'الطلبات',
    path: '/assets/requests',
    icon: 'ClipboardList',
    group: 'Operations',
    arabicGroup: 'العمليات',
    description:
      'Centralized intake and approval queue for asset requisitions, transfers, custodian assignments, and disposals.',
    arabicDescription:
      'منصة مركزية لإدارة ومصادقة طلبات صرف الأصول، نقل العهد، وإجراءات الاستبعاد والإرجاع.',
    phaseNote: 'Workspace Placeholder — Request approval workflows will bind in a later phase.',
  },
  {
    id: 'assets-group',
    label: 'Assets',
    arabicLabel: 'الأصول',
    path: '/assets/registry',
    icon: 'Boxes',
    group: 'Registry',
    arabicGroup: 'سجل الأصول',
    collapsible: true,
    defaultExpanded: true,
    description:
      'Track and manage company assets like devices, licenses, and equipment. Assign assets to employees, monitor status, and reduce loss or misplacement.',
    arabicDescription:
      'حصر ومتابعة الأصول المؤسسية من أجهزة وتراخيص ومعدات، وتعيين العهد للموظفين، وتتبع الحالة التشغيلية.',
    children: [
      {
        id: 'compliance-assets',
        label: 'Compliance Assets',
        arabicLabel: 'أصول الامتثال',
        path: '/assets/compliance',
        icon: 'ShieldCheck',
        parentLabel: 'Assets',
        parentArabicLabel: 'الأصول',
        parentPath: '/assets/registry',
        description:
          'Assets governed by statutory, regulatory, safety, or periodic inspection mandates requiring active verification.',
        arabicDescription:
          'الأصول الخاضعة للاشتراطات التنظيمية والفحص الدوري واللوائح الحكومية الإلزامية.',
        phaseNote: 'Compliance Assets Entry Point — Dedicated compliance forms will be implemented in the next phase.',
      },
      {
        id: 'non-compliance-assets',
        label: 'Non-Compliance Assets',
        arabicLabel: 'الأصول القياسية',
        path: '/assets/non-compliance',
        icon: 'Package',
        parentLabel: 'Assets',
        parentArabicLabel: 'الأصول',
        parentPath: '/assets/registry',
        description:
          'Standard operational devices, software licenses, and administrative equipment managed for custody and inventory tracking.',
        arabicDescription:
          'الأجهزة المكتبية القياسية، والبرمجيات، والأثاث المدار لتتبع العهد والمستودعات.',
        phaseNote: 'Non-Compliance Assets Entry Point — Dedicated non-compliance forms will be implemented in the next phase.',
      },
    ],
  },
  {
    id: 'master-group',
    label: 'Master',
    arabicLabel: 'البيانات الأساسية',
    path: '/assets/master',
    icon: 'Sliders',
    group: 'Configuration',
    arabicGroup: 'الإعدادات والترميز',
    collapsible: true,
    defaultExpanded: true,
    description:
      'Foundational classification taxonomies, asset types, metadata tags, and lifecycle status definitions.',
    arabicDescription:
      'الترميز والتصنيف المعتمد، وقواعد الاستهلاك، وتحديد أنواع ووسوم وحالات دورة حياة الأصول.',
    children: [
      {
        id: 'asset-categories',
        label: 'Asset Categories',
        arabicLabel: 'تصنيفات الأصول',
        path: '/assets/master/categories',
        icon: 'FolderTree',
        parentLabel: 'Master',
        parentArabicLabel: 'البيانات الأساسية',
        parentPath: '/assets/master/categories',
        description:
          'Top-level functional and accounting classifications governing depreciation rules and compliance defaults.',
        arabicDescription:
          'التصنيفات المحاسبية والتشغيلية الرئيسية الحاكمة لنسب الإهلاك ومتطلبات الامتثال.',
        phaseNote: 'Master Workspace Placeholder — Category management will bind in a later phase.',
      },
      {
        id: 'asset-types',
        label: 'Asset Types',
        arabicLabel: 'أنواع الأصول',
        path: '/assets/master/types',
        icon: 'Layers',
        parentLabel: 'Master',
        parentArabicLabel: 'البيانات الأساسية',
        parentPath: '/assets/master/categories',
        description:
          'Granular specification templates mapped to parent Asset Categories for standardized data capture.',
        arabicDescription:
          'النماذج والمواصفات التفصيلية المرتبطة بفئات الأصول لضمان توحيد إدخال البيانات.',
        phaseNote: 'Master Workspace Placeholder — Type management will bind in a later phase.',
      },
      {
        id: 'asset-tags',
        label: 'Asset Tags',
        arabicLabel: 'وسوم الأصول',
        path: '/assets/master/tags',
        icon: 'Tag',
        parentLabel: 'Master',
        parentArabicLabel: 'البيانات الأساسية',
        parentPath: '/assets/master/categories',
        description:
          'Controlled operational labels for cross-departmental grouping, cost-center tracking, and audit scoping.',
        arabicDescription:
          'الوسوم المؤسسية لربط الأصول بمراكز التكلفة والمشاريع والأغراض الرقابية.',
        phaseNote: 'Master Workspace Placeholder — Tag management will bind in a later phase.',
      },
      {
        id: 'asset-status',
        label: 'Asset Status',
        arabicLabel: 'حالات الأصول',
        path: '/assets/master/status',
        icon: 'Activity',
        parentLabel: 'Master',
        parentArabicLabel: 'البيانات الأساسية',
        parentPath: '/assets/master/categories',
        description:
          'Standardized lifecycle state definitions governing permissible transitions and operational availability.',
        arabicDescription:
          'الحالات التشغيلية المعتمدة الحاكمة لدورة حياة الأصل وتوافره في المستودعات.',
        phaseNote: 'Master Workspace Placeholder — Status configuration will bind in a later phase.',
      },
    ],
  },
  {
    id: 'audit-trail-group',
    label: 'Audit Trail',
    arabicLabel: 'سجل التدقيق',
    path: '/assets/audit',
    icon: 'History',
    group: 'Governance',
    arabicGroup: 'الحوكمة والرقابة',
    collapsible: true,
    defaultExpanded: true,
    description:
      'Immutable chronological ledger of asset creation, field modifications, custody transfers, and status changes.',
    arabicDescription:
      'سجل زمني موثوق وغير قابل للتعديل يوثق كافة حركات العهد والتعديلات والاعتمادات.',
    children: [
      {
        id: 'audit-trails',
        label: 'Audit Trails',
        arabicLabel: 'سجلات التدقيق',
        path: '/assets/audit-trails',
        icon: 'FileSearch',
        parentLabel: 'Audit Trail',
        parentArabicLabel: 'سجل التدقيق',
        parentPath: '/assets/audit-trails',
        description:
          'Searchable event log recording actor identity, timestamp, target entity, and before/after field diffs.',
        arabicDescription:
          'سجل الأحداث والعمليات يوثق هوية المستخدم، التوقيت، الأصل المعني، وفروقات الحقول قبل وبعد.',
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
      arabicLabel: item.arabicLabel,
      path: item.path,
      icon: item.icon,
      description: item.description,
      arabicDescription: item.arabicDescription,
      phaseNote: item.phaseNote,
      breadcrumbs:
        item.id === 'assets-group'
          ? [{ label: 'Assets', arabicLabel: 'الأصول', path: '/assets/registry' }]
          : [
              { label: 'Assets', arabicLabel: 'الأصول', path: '/assets/registry' },
              { label: item.label, arabicLabel: item.arabicLabel, path: item.path },
            ],
    });

    if (Array.isArray(item.children)) {
      item.children.forEach((child) => {
        routes.push({
          id: child.id,
          label: child.label,
          arabicLabel: child.arabicLabel,
          path: child.path,
          icon: child.icon,
          parentId: item.id,
          parentLabel: item.label,
          parentArabicLabel: item.arabicLabel,
          description: child.description,
          arabicDescription: child.arabicDescription,
          phaseNote: child.phaseNote,
          breadcrumbs: [
            { label: 'Assets', arabicLabel: 'الأصول', path: '/assets/registry' },
            ...(item.id !== 'assets-group'
              ? [{ label: item.label, arabicLabel: item.arabicLabel, path: item.children?.[0]?.path || item.path }]
              : []),
            { label: child.label, arabicLabel: child.arabicLabel, path: child.path },
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
