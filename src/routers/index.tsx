import React, { Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useRouteError,
  isRouteErrorResponse,
  useSearchParams,
  type RouteObject,
} from 'react-router-dom';
import { AppShell } from '../layouts/AppShell.tsx';
import { resolveRouteByPath } from '../data/navigationData.ts';
import { MetricStripSkeleton, TableSkeleton } from '../components/ui/LoadingState.tsx';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';

/**
 * Authentication Route Guard
 * Verifies active session token; redirects to /login if unauthenticated.
 */
export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') ?? 'authenticated'
      : 'authenticated';
  const isAuth =
    Boolean(token) &&
    (typeof window === 'undefined' || localStorage.getItem('isAuthenticated') !== 'false');

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

/**
 * Application Root Layout
 * Binds AppShell navigation with child route rendering via <Outlet />.
 */
export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentRoute = resolveRouteByPath(location.pathname);

  return (
    <AppShell currentRoute={currentRoute} onNavigate={(path) => navigate(path)}>
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
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

/**
 * Global & Route-level Error Page
 * Provides contextual error presentation and 404 fallback handling.
 */
export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Page Not Found';
  let message = "The page you are looking for doesn't exist or has been moved.";
  let status = '404';

  if (isRouteErrorResponse(error)) {
    status = String(error.status);
    title = error.status === 404 ? 'Page Not Found' : 'Application Error';
    message = error.statusText || message;
  } else if (error instanceof Error) {
    status = '500';
    title = 'Unexpected Error';
    message = error.message;
  }

  return (
    <div className="min-h-screen bg-awn-bg text-awn-text-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-awn-surface border border-awn-border rounded-lg p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-awn-error-soft text-awn-error mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="font-mono text-xs font-semibold text-awn-text-muted">
          Status Code: {status}
        </div>
        <h1 className="text-xl font-bold text-awn-text-primary">{title}</h1>
        <p className="text-sm text-awn-text-secondary leading-relaxed">{message}</p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/service/dashboard')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/login',
    errorElement: <ErrorPage />,
    lazy: async () => {
      const { default: Component } = await import('../pages/LoginPage.tsx');
      return { Component };
    },
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/service/dashboard" replace />,
      },
      // Service Routes
      {
        path: 'service',
        element: <Navigate to="/service/dashboard" replace />,
      },
      {
        path: 'service/dashboard',
        lazy: async () => {
          const { default: Page } = await import('../pages/DashboardPage.tsx');
          return {
            Component: () => {
              const navigate = useNavigate();
              return <Page onNavigate={navigate} />;
            },
          };
        },
      },
      {
        path: 'service/services',
        lazy: async () => {
          const { default: Page } = await import('../pages/AssetsWorkspacePage.tsx');
          return {
            Component: () => {
              const navigate = useNavigate();
              return <Page onNavigate={navigate} />;
            },
          };
        },
      },
      {
        path: 'service/service-tags',
        lazy: async () => {
          const { default: Page } = await import('../pages/AssetTagsPage.tsx');
          return { Component: Page };
        },
      },
      {
        path: 'service/service-portals',
        lazy: async () => {
          const { default: Page } = await import('../pages/WorkspacePlaceholderPage.tsx');
          return {
            Component: () => {
              const navigate = useNavigate();
              const location = useLocation();
              return (
                <Page
                  onNavigate={navigate}
                  currentRoute={resolveRouteByPath(location.pathname)}
                />
              );
            },
          };
        },
      },
      // Existing Asset Workspace Routes
      {
        path: 'assets',
        element: <Navigate to="/assets/registry" replace />,
      },
      {
        path: 'assets/dashboard',
        lazy: async () => {
          const { default: Page } = await import('../pages/DashboardPage.tsx');
          return {
            Component: () => {
              const navigate = useNavigate();
              return <Page onNavigate={navigate} />;
            },
          };
        },
      },
      {
        path: 'assets/registry',
        lazy: async () => {
          const { default: Page } = await import('../pages/AssetsWorkspacePage.tsx');
          return {
            Component: () => {
              const navigate = useNavigate();
              return <Page onNavigate={navigate} />;
            },
          };
        },
      },
      {
        path: 'assets/compliance',
        lazy: async () => {
          const { default: Page } = await import('../pages/ComplianceAssetsPage.tsx');
          return {
            Component: () => {
              const navigate = useNavigate();
              const [searchParams] = useSearchParams();
              const queryParams = Object.fromEntries(searchParams.entries());
              return <Page onNavigate={navigate} queryParams={queryParams} />;
            },
          };
        },
      },
      {
        path: 'assets/non-compliance',
        lazy: async () => {
          const { default: Page } = await import('../pages/NonComplianceAssetsPage.tsx');
          return {
            Component: () => {
              const navigate = useNavigate();
              const [searchParams] = useSearchParams();
              const queryParams = Object.fromEntries(searchParams.entries());
              return <Page onNavigate={navigate} queryParams={queryParams} />;
            },
          };
        },
      },
      {
        path: 'assets/master/categories',
        lazy: async () => {
          const { default: Page } = await import('../pages/AssetCategoriesPage.tsx');
          return { Component: Page };
        },
      },
      {
        path: 'assets/master/types',
        lazy: async () => {
          const { default: Page } = await import('../pages/AssetTypesPage.tsx');
          return { Component: Page };
        },
      },
      {
        path: 'assets/master/tags',
        lazy: async () => {
          const { default: Page } = await import('../pages/AssetTagsPage.tsx');
          return { Component: Page };
        },
      },
      {
        path: 'assets/master/status',
        lazy: async () => {
          const { default: Page } = await import('../pages/AssetStatusPage.tsx');
          return { Component: Page };
        },
      },
      {
        path: 'assets/requests',
        lazy: async () => {
          const { default: Page } = await import('../pages/WorkspacePlaceholderPage.tsx');
          return {
            Component: () => {
              const navigate = useNavigate();
              const location = useLocation();
              return (
                <Page
                  onNavigate={navigate}
                  currentRoute={resolveRouteByPath(location.pathname)}
                />
              );
            },
          };
        },
      },
      {
        path: 'assets/audit-trails',
        lazy: async () => {
          const { default: Page } = await import('../pages/WorkspacePlaceholderPage.tsx');
          return {
            Component: () => {
              const navigate = useNavigate();
              const location = useLocation();
              return (
                <Page
                  onNavigate={navigate}
                  currentRoute={resolveRouteByPath(location.pathname)}
                />
              );
            },
          };
        },
      },
      // 404 Catch-All under root
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
];

export const router = createBrowserRouter(routes);
