import type {
  CategoryDistributionItem,
  DashboardAlertItem,
  DashboardDataResponse,
  DashboardFilterState,
  DashboardKpi,
  LocationDistributionItem,
  RecentActivityItem,
} from '../types/dashboard.ts';
import {
  DASHBOARD_CATEGORY_COLORS,
  DASHBOARD_LOCATION_COLORS,
  DASHBOARD_STATUS_COLORS,
} from '../constants/dashboardPalette.ts';

const BASE_KPIS: DashboardKpi[] = [
  {
    id: 'total-assets',
    label: 'Total Assets',
    labelAr: 'إجمالي الأصول',
    value: '8,150',
    rawCount: 8150,
    subtext: 'Enterprise registry portfolio',
    subtextAr: 'محفظة الأصول المؤسسية المعتمدة',
    iconName: 'Boxes',
    tone: 'default',
  },
  {
    id: 'active-assets',
    label: 'Active Assets',
    labelAr: 'الأصول النشطة',
    value: '6,380',
    rawCount: 6380,
    subtext: '78.3% operational availability',
    subtextAr: '78.3% الجاهزية والتشغيل',
    iconName: 'CheckCircle2',
    tone: 'success',
  },
  {
    id: 'assigned-assets',
    label: 'Assigned Assets',
    labelAr: 'الأصول المخصصة',
    value: '4,972',
    rawCount: 4972,
    subtext: '61.0% in active employee custody',
    subtextAr: '61.0% في عهدة الموظفين الحالية',
    iconName: 'UserCheck',
    tone: 'info',
  },
  {
    id: 'available-assets',
    label: 'Available Assets',
    labelAr: 'الأصول المتاحة',
    value: '1,467',
    rawCount: 1467,
    subtext: '18.0% ready in warehouse depot',
    subtextAr: '18.0% جاهزة للتوزيع بالمستودعات',
    iconName: 'Layers',
    tone: 'default',
  },
  {
    id: 'compliance-assets',
    label: 'Compliance Assets',
    labelAr: 'أصول الامتثال',
    value: '3,260',
    rawCount: 3260,
    subtext: '40.0% statutory oversight mandate',
    subtextAr: '40.0% خاضعة للمطابقة والرقابة النظامية',
    iconName: 'ShieldCheck',
    tone: 'warning',
  },
  {
    id: 'non-compliance-assets',
    label: 'Non-Compliance Assets',
    labelAr: 'أصول بدون متطلبات امتثال',
    value: '4,890',
    rawCount: 4890,
    subtext: '60.0% standard devices & licenses',
    subtextAr: '60.0% أجهزة قياسية وتراخيص برمجية',
    iconName: 'Package',
    tone: 'default',
  },
];

const BASE_DISTRIBUTION: CategoryDistributionItem[] = [
  {
    id: 'cat-it',
    name: 'IT Equipment',
    nameAr: 'معدات تقنية المعلومات',
    count: 3120,
    percentage: 38.3,
    color: DASHBOARD_CATEGORY_COLORS['cat-it'],
  },
  {
    id: 'cat-elec',
    name: 'Electronics & Devices',
    nameAr: 'الأجهزة والإلكترونيات',
    count: 2180,
    percentage: 26.7,
    color: DASHBOARD_CATEGORY_COLORS['cat-elec'],
  },
  {
    id: 'cat-veh',
    name: 'Vehicles & Fleet',
    nameAr: 'المركبات والأسطول',
    count: 1240,
    percentage: 15.2,
    color: DASHBOARD_CATEGORY_COLORS['cat-veh'],
  },
  {
    id: 'cat-furn',
    name: 'Office Furniture',
    nameAr: 'الأثاث المكتبي',
    count: 950,
    percentage: 11.7,
    color: DASHBOARD_CATEGORY_COLORS['cat-furn'],
  },
  {
    id: 'cat-fac',
    name: 'Real Estate & Facilities',
    nameAr: 'العقارات والمرافق',
    count: 660,
    percentage: 8.1,
    color: DASHBOARD_CATEGORY_COLORS['cat-fac'],
  },
];

const BASE_LOCATIONS: LocationDistributionItem[] = [
  {
    id: 'loc-ruh',
    location: 'Riyadh HQ',
    locationAr: 'المقر الرئيسي بالرياض',
    subLocation: 'Digital City & Olaya Towers',
    subLocationAr: 'المدينة الرقمية وأبراج العليا',
    count: 4480,
    percentage: 55.0,
    colorHex: DASHBOARD_LOCATION_COLORS['loc-ruh'],
  },
  {
    id: 'loc-jed',
    location: 'Jeddah Branch',
    locationAr: 'فرع جدة الإقليمي',
    subLocation: 'Corniche Business District',
    subLocationAr: 'حي الشاطئ والواجهة البحرية',
    count: 1875,
    percentage: 23.0,
    colorHex: DASHBOARD_LOCATION_COLORS['loc-jed'],
  },
  {
    id: 'loc-dmm',
    location: 'Dammam Logistics Hub',
    locationAr: 'مركز الدمام اللوجستي',
    subLocation: 'Eastern Industrial Zone',
    subLocationAr: 'المنطقة الصناعية الشرقية',
    count: 1304,
    percentage: 16.0,
    colorHex: DASHBOARD_LOCATION_COLORS['loc-dmm'],
  },
  {
    id: 'loc-oth',
    location: 'Other Locations',
    locationAr: 'المواقع الأخرى',
    subLocation: 'Cloud Data Depots & Remote Hubs',
    subLocationAr: 'مستودعات سحابية ومواقع ميدانية',
    count: 491,
    percentage: 6.0,
    colorHex: DASHBOARD_LOCATION_COLORS['loc-oth'],
  },
];

const BASE_ACTIVITIES: RecentActivityItem[] = [
  {
    id: 'act-1',
    type: 'ASSET_ADDED',
    typeLabel: 'Asset Added',
    typeLabelAr: 'إضافة أصل جديد',
    assetCode: 'AST-IT-1092',
    assetName: 'Company Laptop - Dell Latitude 5440',
    assetNameAr: 'حاسوب محمول مكتبي - Dell Latitude 5440',
    description: 'Registered into Central Depot inventory by M. Al-Harbi',
    descriptionAr: 'تم تسجيل الأصل في مستودع الأجهزة المركزي بواسطة م. الحربي',
    relativeTime: '10 min ago',
    relativeTimeAr: 'منذ 10 دقائق',
    timestamp: '2026-10-02 09:44',
    tone: 'info',
    linkPath: '/assets/registry',
  },
  {
    id: 'act-2',
    type: 'ASSET_ASSIGNED',
    typeLabel: 'Asset Assigned',
    typeLabelAr: 'تخصيص عهدة أصل',
    assetCode: 'AST-VEH-002',
    assetName: 'Toyota Land Cruiser (Fleet Operations)',
    assetNameAr: 'تويوتا لاند كروزر (أسطول العمليات)',
    description: 'Assigned to Custodian Ahmed Al Saud under Department Logistics',
    descriptionAr: 'تم تعيين العهدة للأستاذ أحمد آل سعود ضمن قسم العمليات اللوجستية',
    relativeTime: '32 min ago',
    relativeTimeAr: 'منذ 32 دقيقة',
    timestamp: '2026-10-02 09:22',
    tone: 'success',
    linkPath: '/assets/compliance',
  },
  {
    id: 'act-3',
    type: 'DOCUMENT_EXPIRING',
    typeLabel: 'Document Expiring',
    typeLabelAr: 'اقتراب انتهاء مستند',
    assetCode: 'AST-VEH-002',
    assetName: 'SASO Commercial Inspection Policy',
    assetNameAr: 'شهادة فحص ساسو للمركبات التجارية',
    description: 'Statutory compliance renewal required within 5 days',
    descriptionAr: 'مطلوب تجديد الفحص الدوري النظامي خلال 5 أيام',
    relativeTime: 'Today',
    relativeTimeAr: 'اليوم',
    timestamp: '2026-10-02 08:30',
    tone: 'warning',
    linkPath: '/assets/compliance',
  },
  {
    id: 'act-4',
    type: 'ASSET_REASSIGNED',
    typeLabel: 'Asset Reassigned',
    typeLabelAr: 'إعادة تعيين عهدة',
    assetCode: 'AST-DEV-008',
    assetName: 'MacBook Pro 16" M3 Max Workstation',
    assetNameAr: 'ماك بوك برو 16 بوصة M3 Max',
    description: 'Custody successfully transferred to Sarah Al-Otaibi',
    descriptionAr: 'تمت مصادقة نقل العهدة بنجاح إلى سارة العتيبي',
    relativeTime: 'Yesterday',
    relativeTimeAr: 'أمس',
    timestamp: '2026-10-01 16:40',
    tone: 'info',
    linkPath: '/assets/registry',
  },
  {
    id: 'act-5',
    type: 'ASSET_UPDATED',
    typeLabel: 'Status Transition',
    typeLabelAr: 'تحديث حالة الأصل',
    assetCode: 'AST-NET-014',
    assetName: 'Cisco Catalyst 9300 48-Port Switch',
    assetNameAr: 'محول شبكة سيسكو كاتاليست 9300',
    description: 'Status shifted from Intake to Active in Olaya Server Room',
    descriptionAr: 'تم تغيير الحالة من مرحلة الاستلام إلى نشط في غرفة خوادم العليا',
    relativeTime: 'Yesterday',
    relativeTimeAr: 'أمس',
    timestamp: '2026-10-01 11:15',
    tone: 'neutral',
    linkPath: '/assets/registry',
  },
  {
    id: 'act-6',
    type: 'COMPLIANCE_VERIFIED',
    typeLabel: 'Compliance Verified',
    typeLabelAr: 'اعتماد الامتثال',
    assetCode: 'CMP-4004',
    assetName: 'Automated Fire Suppression Manifold FS-11',
    assetNameAr: 'نظام إخماد الحريق التلقائي FS-11',
    description: 'Civil Defense certified verification stamped and logged',
    descriptionAr: 'تم اعتماد شهادة الدفاع المدني وتحديث السجل النظامي للأصل',
    relativeTime: '2 days ago',
    relativeTimeAr: 'منذ يومين',
    timestamp: '2026-09-30 14:00',
    tone: 'success',
    linkPath: '/assets/compliance',
  },
];

const BASE_ALERTS: DashboardAlertItem[] = [
  {
    id: 'alert-1',
    title: 'Statutory SASO Inspection Due',
    titleAr: 'استحقاق الفحص الدوري (ساسو)',
    targetRef: 'Fleet Vehicle (AST-VEH-002)',
    description: 'Safety and roadworthiness certificate expires in 5 calendar days. Immediate renewal required to maintain operational legality.',
    descriptionAr: 'شهادة السلامة والفحص الفني تنتهي خلال 5 أيام. يلزم إجراء التجديد الفوري لتفادي إيقاف تشغيل المركبة.',
    tone: 'warning',
    urgency: 'high',
    actionLabel: 'Review Compliance',
    actionLabelAr: 'مراجعة الامتثال',
    actionPath: '/assets/compliance',
  },
  {
    id: 'alert-2',
    title: 'Unassigned Inventory in Stock',
    titleAr: 'أجهزة غير مخصصة في المستودع',
    targetRef: '24x High-Performance Laptops',
    description: 'Hardware items received into the Riyadh Central Depot over 14 days ago without allocated custodian.',
    descriptionAr: 'أجهزة حاسوب تم استلامها بمستودع الرياض منذ أكثر من 14 يوماً ولم تُعيّن عهدتها للموظفين بعد.',
    tone: 'info',
    urgency: 'medium',
    actionLabel: 'View Assets',
    actionLabelAr: 'عرض الأصول',
    actionPath: '/assets/registry',
  },
  {
    id: 'alert-3',
    title: 'Requisition Approvals Pending',
    titleAr: 'طلبات أصول بانتظار الاعتماد',
    targetRef: '3 Governance Approvals',
    description: 'Cross-departmental asset transfers and procurement requests awaiting managerial sign-off.',
    descriptionAr: 'طلبات نقل عهدة ومشتريات جديدة بانتظار توقيع واعتماد إدارة حوكمة الأصول.',
    tone: 'warning',
    urgency: 'medium',
    actionLabel: 'Open Requests',
    actionLabelAr: 'فتح الطلبات',
    actionPath: '/assets/requests',
  },
];

class DashboardService {
  private activeAlerts: DashboardAlertItem[] = [...BASE_ALERTS];

  async getDashboardData(filters: DashboardFilterState): Promise<DashboardDataResponse> {
    // Simulate slight asynchronous resolution for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Calculate scaled metrics based on scope filter
    let kpis = [...BASE_KPIS];
    let distribution = [...BASE_DISTRIBUTION];
    let locations = [...BASE_LOCATIONS];

    if (filters.scope === 'COMPLIANCE') {
      kpis = kpis.map((kpi) => {
        if (kpi.id === 'total-assets') {
          return { ...kpi, value: '3,260', rawCount: 3260, subtext: 'Filtered: Mandated compliance assets' };
        }
        if (kpi.id === 'active-assets') {
          return { ...kpi, value: '2,980', rawCount: 2980, subtext: '91.4% currently certified' };
        }
        if (kpi.id === 'assigned-assets') {
          return { ...kpi, value: '2,810', rawCount: 2810, subtext: '86.2% allocated to departments' };
        }
        if (kpi.id === 'available-assets') {
          return { ...kpi, value: '450', rawCount: 450, subtext: '13.8% standby/spares' };
        }
        return kpi;
      });
      distribution = [
        { id: 'cat-veh', name: 'Vehicles & Fleet', nameAr: 'المركبات والأسطول', count: 1240, percentage: 38.0, color: DASHBOARD_CATEGORY_COLORS['cat-veh'] },
        { id: 'cat-it', name: 'Critical IT Infrastructure', nameAr: 'البنية التحتية الحرجة', count: 1120, percentage: 34.4, color: DASHBOARD_CATEGORY_COLORS['cat-it'] },
        { id: 'cat-fac', name: 'Regulated Facilities', nameAr: 'المرافق الخاضعة للوائح', count: 660, percentage: 20.2, color: DASHBOARD_CATEGORY_COLORS['cat-fac'] },
        { id: 'cat-elec', name: 'Safety Monitoring Hardware', nameAr: 'أجهزة المراقبة والسلامة', count: 240, percentage: 7.4, color: DASHBOARD_CATEGORY_COLORS['cat-elec'] },
      ];
    } else if (filters.scope === 'NON_COMPLIANCE') {
      kpis = kpis.map((kpi) => {
        if (kpi.id === 'total-assets') {
          return { ...kpi, value: '4,890', rawCount: 4890, subtext: 'Filtered: Standard operational assets' };
        }
        if (kpi.id === 'active-assets') {
          return { ...kpi, value: '3,400', rawCount: 3400, subtext: '69.5% in daily service' };
        }
        if (kpi.id === 'assigned-assets') {
          return { ...kpi, value: '2,162', rawCount: 2162, subtext: 'Assigned to individual custodians' };
        }
        if (kpi.id === 'available-assets') {
          return { ...kpi, value: '1,017', rawCount: 1017, subtext: 'In IT storage & spare room' };
        }
        return kpi;
      });
      distribution = [
        { id: 'cat-it', name: 'Laptops & Workstations', nameAr: 'أجهزة الحاسوب والمحمول', count: 2000, percentage: 40.9, color: DASHBOARD_CATEGORY_COLORS['cat-it'] },
        { id: 'cat-elec', name: 'Monitors & Peripherals', nameAr: 'الشاشات والملحقات', count: 1940, percentage: 39.7, color: DASHBOARD_CATEGORY_COLORS['cat-elec'] },
        { id: 'cat-furn', name: 'Workstation Furniture', nameAr: 'أثاث المكاتب والمحطات', count: 950, percentage: 19.4, color: DASHBOARD_CATEGORY_COLORS['cat-furn'] },
      ];
    }

    if (filters.location !== 'ALL') {
      const locMap: Record<string, string> = {
        RIYADH: 'Riyadh HQ',
        JEDDAH: 'Jeddah Branch',
        DAMMAM: 'Dammam Logistics Hub',
        OTHER: 'Other Locations',
      };
      const activeLocName = locMap[filters.location];
      locations = locations.map((loc) => ({
        ...loc,
        percentage: loc.location === activeLocName ? 100 : 0,
      }));
    }

    const healthBreakdown = {
      overallHealthyPercentage: 96,
      totalEvaluated: 8150,
      valid: {
        count: 7824,
        percentage: 96.0,
        label: 'Valid Documents',
        labelAr: 'مستندات سارية ومكتملة',
      },
      expiringSoon: {
        count: 245,
        percentage: 3.0,
        label: 'Expiring Soon (<30d)',
        labelAr: 'تنتهي قريباً (أقل من 30 يوماً)',
      },
      expired: {
        count: 81,
        percentage: 1.0,
        label: 'Expired Mandates',
        labelAr: 'مستندات منتهية الصلاحية',
      },
      missing: {
        count: 0,
        percentage: 0.0,
        label: 'Missing Documents',
        labelAr: 'مستندات مفقودة',
      },
    };

    const statuses = [
      { id: 'st-active', status: 'Active', statusAr: 'نشط', count: 6380, percentage: 78.3, tone: 'success' as const, colorHex: DASHBOARD_STATUS_COLORS['st-active'] },
      { id: 'st-assigned', status: 'Assigned', statusAr: 'مخصص بالعهدة', count: 4972, percentage: 61.0, tone: 'info' as const, colorHex: DASHBOARD_STATUS_COLORS['st-assigned'] },
      { id: 'st-available', status: 'Available', statusAr: 'متاح بالمستودع', count: 1467, percentage: 18.0, tone: 'neutral' as const, colorHex: DASHBOARD_STATUS_COLORS['st-available'] },
      { id: 'st-retired', status: 'Retired', statusAr: 'متقاعد / تالف', count: 408, percentage: 5.0, tone: 'muted' as const, colorHex: DASHBOARD_STATUS_COLORS['st-retired'] },
      { id: 'st-draft', status: 'Draft / Intake', statusAr: 'مسودة / وارد جديد', count: 163, percentage: 2.0, tone: 'warning' as const, colorHex: DASHBOARD_STATUS_COLORS['st-draft'] },
    ];

    return {
      kpis,
      distribution,
      health: healthBreakdown,
      statuses,
      locations,
      recentActivities: BASE_ACTIVITIES,
      alerts: this.activeAlerts,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  dismissAlert(alertId: string): void {
    this.activeAlerts = this.activeAlerts.filter((a) => a.id !== alertId);
  }

  resetAlerts(): void {
    this.activeAlerts = [...BASE_ALERTS];
  }
}

export const dashboardService = new DashboardService();
