export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'gold'
  | 'danger'
  | 'dangerOutline';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: string) => void;
}

export type ModalSize = 'sm' | 'md' | 'lg';

export type DrawerSize = 'md' | 'lg' | 'xl';

export interface TableFilterTab<T extends string = string> {
  id: T;
  label: string;
}

export interface TableColumnDefinition<TRow> {
  key: keyof TRow | string;
  header: string;
  align?: 'left' | 'center' | 'right';
}
