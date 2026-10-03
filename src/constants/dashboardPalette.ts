/**
 * Centralized Dashboard Visualization Palette
 * 
 * Official 5-color palette for the AWN Assets Dashboard:
 * 1. Deep Forest (#192A22) - Primary Dashboard Data Color
 * 2. Muted Olive (#6A7358) - Secondary Dashboard Data Color
 * 3. Soft Beige (#BEB9A3) - Neutral Data Color
 * 4. Warm Taupe (#BFAB93) - Soft Warm Accent
 * 5. Terracotta Brown (#8C6046) - Strong Warm Accent
 * 
 * These 5 colors are fixed and remain identical across Light and Dark modes.
 */

export const dashboardChartColors = [
  '#192A22',
  '#6A7358',
  '#BEB9A3',
  '#BFAB93',
  '#8C6046',
] as const;

export const DASHBOARD_PALETTE = {
  /** Primary KPI emphasis, main chart data, important dashboard metrics, primary active state */
  primary: '#192A22',
  /** Secondary analytics, secondary chart series, asset distribution categories, supporting metrics */
  secondary: '#6A7358',
  /** Neutral metrics, supporting chart data, low-priority categories, background data indicators */
  neutral: '#BEB9A3',
  /** Secondary highlights, supporting visualization elements, subtle chart categories */
  softWarm: '#BFAB93',
  /** Selected secondary category, specific asset classifications, attention-related visual emphasis */
  strongWarm: '#8C6046',
} as const;

/**
 * Consistent category-to-color mapping across all Dashboard views and scopes:
 * - IT Equipment / Critical IT / Laptops -> Primary Data Color (#192A22)
 * - Electronics & Devices / Monitors / Safety -> Secondary Data Color (#6A7358)
 * - Vehicles & Fleet -> Strong Warm Accent (#8C6046)
 * - Office Furniture / Workstations -> Soft Warm Accent (#BFAB93)
 * - Real Estate & Facilities / Regulated Facilities -> Neutral Data Color (#BEB9A3)
 */
export const DASHBOARD_CATEGORY_COLORS: Record<string, string> = {
  'cat-it': DASHBOARD_PALETTE.primary,      // #192A22
  'cat-elec': DASHBOARD_PALETTE.secondary,  // #6A7358
  'cat-veh': DASHBOARD_PALETTE.strongWarm,  // #8C6046
  'cat-furn': DASHBOARD_PALETTE.softWarm,   // #BFAB93
  'cat-fac': DASHBOARD_PALETTE.neutral,     // #BEB9A3
};

/**
 * Consistent regional location-to-color mapping:
 * - Riyadh HQ (Primary 55%) -> Primary (#192A22)
 * - Jeddah Branch (Secondary 23%) -> Secondary (#6A7358)
 * - Dammam Logistics Hub (16%) -> Soft Warm Accent (#BFAB93)
 * - Other Locations (6%) -> Neutral Data Color (#BEB9A3)
 */
export const DASHBOARD_LOCATION_COLORS: Record<string, string> = {
  'loc-ruh': DASHBOARD_PALETTE.primary,     // #192A22
  'loc-jed': DASHBOARD_PALETTE.secondary,   // #6A7358
  'loc-dmm': DASHBOARD_PALETTE.softWarm,    // #BFAB93
  'loc-oth': DASHBOARD_PALETTE.neutral,     // #BEB9A3
};

/**
 * Consistent lifecycle status-to-color mapping:
 * - Active (Primary active state) -> Primary (#192A22)
 * - Assigned (Secondary / operational) -> Secondary (#6A7358)
 * - Available (Depot standby) -> Soft Warm Accent (#BFAB93)
 * - Retired (Neutral / decommissioned) -> Neutral Data Color (#BEB9A3)
 * - Draft / Intake (Specific category accent) -> Strong Warm Accent (#8C6046)
 */
export const DASHBOARD_STATUS_COLORS: Record<string, string> = {
  'st-active': DASHBOARD_PALETTE.primary,     // #192A22
  'st-assigned': DASHBOARD_PALETTE.secondary, // #6A7358
  'st-available': DASHBOARD_PALETTE.softWarm, // #BFAB93
  'st-retired': DASHBOARD_PALETTE.neutral,    // #BEB9A3
  'st-draft': DASHBOARD_PALETTE.strongWarm,   // #8C6046
};
