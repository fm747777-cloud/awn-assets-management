import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.ts';
import { ThemeProvider } from './hooks/useTheme.tsx';
import { ToastProvider } from './hooks/useToast.tsx';
import { LanguageProvider } from './hooks/useLanguage.tsx';
import { RouterProvider, useRouter } from './hooks/useRouter.tsx';
import { AppShell } from './layouts/AppShell.tsx';
import { MetricStripSkeleton, TableSkeleton } from './components/ui/LoadingState.tsx';

const AssetsWorkspacePage = lazy(() => import('./pages/AssetsWorkspacePage.tsx'));
const ComplianceAssetsPage = lazy(() => import('./pages/ComplianceAssetsPage.tsx'));
const NonComplianceAssetsPage = lazy(() => import('./pages/NonComplianceAssetsPage.tsx'));
const AssetCategoriesPage = lazy(() => import('./pages/AssetCategoriesPage.tsx'));
const AssetTypesPage = lazy(() => import('./pages/AssetTypesPage.tsx'));
const AssetTagsPage = lazy(() => import('./pages/AssetTagsPage.tsx'));
const AssetStatusPage = lazy(() => import('./pages/AssetStatusPage.tsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'));
const WorkspacePlaceholderPage = lazy(() => import('./pages/WorkspacePlaceholderPage.tsx'));

function ModuleWorkspaceRouter() {
  const { currentRoute, queryParams, navigate } = useRouter();

  return (
    <AppShell currentRoute={currentRoute} onNavigate={navigate}>
      <Suspense
        fallback={
          <div className="space-y-5">
            <MetricStripSkeleton count={4} />
            <div className="bg-awn-surface border border-awn-border rounded-lg overflow-hidden">
              <TableSkeleton rows={5} columns={6} />
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/assets/registry" replace />} />
          <Route path="/assets" element={<Navigate to="/assets/registry" replace />} />
          <Route path="/assets/dashboard" element={<DashboardPage onNavigate={navigate} />} />
          <Route path="/assets/registry" element={<AssetsWorkspacePage onNavigate={navigate} />} />
          <Route path="/assets/compliance" element={<ComplianceAssetsPage queryParams={queryParams} onNavigate={navigate} />} />
          <Route path="/assets/non-compliance" element={<NonComplianceAssetsPage queryParams={queryParams} onNavigate={navigate} />} />
          <Route path="/assets/master/categories" element={<AssetCategoriesPage />} />
          <Route path="/assets/master/types" element={<AssetTypesPage />} />
          <Route path="/assets/master/tags" element={<AssetTagsPage />} />
          <Route path="/assets/master/status" element={<AssetStatusPage />} />
          <Route path="*" element={<WorkspacePlaceholderPage currentRoute={currentRoute} onNavigate={navigate} />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <RouterProvider>
              <ModuleWorkspaceRouter />
            </RouterProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
