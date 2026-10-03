import React from 'react';
import { BrowserRouter, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { resolveRouteByPath } from '../data/navigationData.ts';
import type { RouterContextValue, RouterQueryParams } from '../types/navigation.ts';

export function useRouter(): RouterContextValue {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentPath = location.pathname;
  const currentRoute = resolveRouteByPath(currentPath);
  const queryParams: RouterQueryParams = Object.fromEntries(searchParams.entries());

  return {
    currentPath: currentRoute.path,
    rawPath: location.pathname + location.search,
    queryParams,
    currentRoute,
    navigate: (nextPath: string) => {
      const normalized = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
      navigate(normalized);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  };
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}
