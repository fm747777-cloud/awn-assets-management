import React, { useState } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { Header } from './Header.tsx';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs.tsx';
import type { ResolvedRoute } from '../types/navigation.ts';

export interface AppShellProps {
  currentRoute: ResolvedRoute;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function AppShell({ currentRoute, onNavigate, children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-awn-bg text-awn-text-primary">
      <Sidebar
        currentPath={currentRoute?.path}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumbs
              items={currentRoute?.breadcrumbs || []}
              onNavigate={onNavigate}
            />
            <span className="text-xs text-awn-text-muted font-mono tabular-nums">
              {currentRoute?.path}
            </span>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
