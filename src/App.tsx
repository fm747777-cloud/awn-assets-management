import React, { Suspense, lazy } from 'react';
import { ThemeProvider } from './hooks/useTheme.tsx';
import { ToastProvider } from './hooks/useToast.tsx';
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
        {currentRoute?.id === 'dashboard' ? (
          <DashboardPage onNavigate={navigate} />
        ) : currentRoute?.id === 'assets-group' ? (
          <AssetsWorkspacePage onNavigate={navigate} />
        ) : currentRoute?.id === 'compliance-assets' ? (
          <ComplianceAssetsPage queryParams={queryParams} onNavigate={navigate} />
        ) : currentRoute?.id === 'non-compliance-assets' ? (
          <NonComplianceAssetsPage queryParams={queryParams} onNavigate={navigate} />
        ) : currentRoute?.id === 'asset-categories' ? (
          <AssetCategoriesPage />
        ) : currentRoute?.id === 'asset-types' ? (
          <AssetTypesPage />
        ) : currentRoute?.id === 'asset-tags' ? (
          <AssetTagsPage />
        ) : currentRoute?.id === 'asset-status' ? (
          <AssetStatusPage />
        ) : (
          <WorkspacePlaceholderPage currentRoute={currentRoute} onNavigate={navigate} />
        )}
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <ModuleWorkspaceRouter />
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
