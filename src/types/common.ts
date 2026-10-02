export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (nextTheme: ThemeMode) => void;
}

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  tone?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SearchFilterParams {
  search?: string;
  classification?: string;
  category?: string;
  status?: string;
  statusFilter?: string;
  page?: number;
  pageSize?: number;
}

export interface WorkspaceMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
  context: string;
}

export type ValidationErrors<T extends string = string> = Partial<Record<T, string>>;
