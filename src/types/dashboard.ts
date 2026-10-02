export type DashboardScopeFilter = 'ALL' | 'COMPLIANCE' | 'NON_COMPLIANCE';
export type DashboardLocationFilter = 'ALL' | 'RIYADH' | 'JEDDAH' | 'DAMMAM' | 'OTHER';
export type DashboardTimeRange = '30D' | '7D' | '90D' | 'YTD';

export interface DashboardFilterState {
  scope: DashboardScopeFilter;
  location: DashboardLocationFilter;
  timeRange: DashboardTimeRange;
}

export interface DashboardKpi {
  id: string;
  label: string;
  labelAr: string;
  value: string;
  rawCount: number;
  subtext: string;
  subtextAr: string;
  trend?: string;
  iconName: 'Boxes' | 'CheckCircle2' | 'UserCheck' | 'Layers' | 'ShieldCheck' | 'Package';
  tone?: 'default' | 'success' | 'info' | 'warning';
}

export interface CategoryDistributionItem {
  id: string;
  name: string;
  nameAr: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AssetHealthBreakdown {
  overallHealthyPercentage: number;
  totalEvaluated: number;
  valid: {
    count: number;
    percentage: number;
    label: string;
    labelAr: string;
  };
  expiringSoon: {
    count: number;
    percentage: number;
    label: string;
    labelAr: string;
  };
  expired: {
    count: number;
    percentage: number;
    label: string;
    labelAr: string;
  };
  missing: {
    count: number;
    percentage: number;
    label: string;
    labelAr: string;
  };
}

export interface AssetStatusItem {
  id: string;
  status: string;
  statusAr: string;
  count: number;
  percentage: number;
  tone: 'success' | 'info' | 'warning' | 'neutral' | 'muted';
  colorHex: string;
}

export interface LocationDistributionItem {
  id: string;
  location: string;
  locationAr: string;
  subLocation: string;
  subLocationAr: string;
  count: number;
  percentage: number;
  colorHex: string;
}

export type ActivityType =
  | 'ASSET_ADDED'
  | 'ASSET_ASSIGNED'
  | 'ASSET_REASSIGNED'
  | 'ASSET_UPDATED'
  | 'ASSET_DEACTIVATED'
  | 'DOCUMENT_EXPIRING'
  | 'COMPLIANCE_VERIFIED';

export interface RecentActivityItem {
  id: string;
  type: ActivityType;
  typeLabel: string;
  typeLabelAr: string;
  assetCode: string;
  assetName: string;
  assetNameAr: string;
  description: string;
  descriptionAr: string;
  relativeTime: string;
  relativeTimeAr: string;
  timestamp: string;
  tone: 'info' | 'success' | 'warning' | 'neutral';
  linkPath?: string;
}

export interface DashboardAlertItem {
  id: string;
  title: string;
  titleAr: string;
  targetRef: string;
  description: string;
  descriptionAr: string;
  tone: 'warning' | 'error' | 'info';
  urgency: 'high' | 'medium' | 'low';
  actionLabel: string;
  actionLabelAr: string;
  actionPath: string;
}

export interface DashboardDataResponse {
  kpis: DashboardKpi[];
  distribution: CategoryDistributionItem[];
  health: AssetHealthBreakdown;
  statuses: AssetStatusItem[];
  locations: LocationDistributionItem[];
  recentActivities: RecentActivityItem[];
  alerts: DashboardAlertItem[];
  lastUpdated: string;
}
