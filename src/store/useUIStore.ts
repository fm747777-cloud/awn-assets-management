import { create } from 'zustand';

interface UIState {
  // Mobile / Desktop sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Global search or filter terms when shared across views
  workspaceSearch: string;
  setWorkspaceSearch: (search: string) => void;

  // Selected asset / record IDs for batch actions
  selectedRecordIds: string[];
  setSelectedRecordIds: (ids: string[]) => void;
  toggleRecordSelection: (id: string) => void;
  clearRecordSelection: () => void;

  // Notification count and read states
  readNotificationIds: string[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (allIds: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  workspaceSearch: '',
  setWorkspaceSearch: (search: string) => set({ workspaceSearch: search }),

  selectedRecordIds: [],
  setSelectedRecordIds: (ids: string[]) => set({ selectedRecordIds: ids }),
  toggleRecordSelection: (id: string) =>
    set((state) => ({
      selectedRecordIds: state.selectedRecordIds.includes(id)
        ? state.selectedRecordIds.filter((item) => item !== id)
        : [...state.selectedRecordIds, id],
    })),
  clearRecordSelection: () => set({ selectedRecordIds: [] }),

  readNotificationIds: [],
  markNotificationAsRead: (id: string) =>
    set((state) => ({
      readNotificationIds: state.readNotificationIds.includes(id)
        ? state.readNotificationIds
        : [...state.readNotificationIds, id],
    })),
  markAllNotificationsAsRead: (allIds: string[]) =>
    set({ readNotificationIds: allIds }),
}));
