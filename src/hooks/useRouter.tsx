import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { resolveRouteByPath } from '../data/navigationData.ts';
import type { RouterContextValue, RouterQueryParams } from '../types/navigation.ts';

const defaultRoute = resolveRouteByPath('/assets/registry');

const RouterContext = createContext<RouterContextValue>({
  currentPath: '/assets/registry',
  rawPath: '/assets/registry',
  queryParams: {},
  currentRoute: defaultRoute,
  navigate: () => {},
});

interface RouterProviderProps {
  children: React.ReactNode;
}

export function RouterProvider({ children }: RouterProviderProps) {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hashPath = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
    if (hashPath && hashPath.startsWith('/')) {
      return hashPath;
    }
    return '/assets/registry';
  });

  useEffect(() => {
    const handlePopState = () => {
      const hashPath = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
      if (hashPath && hashPath.startsWith('/')) {
        setCurrentPath(hashPath);
      }
    };
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((nextPath: string) => {
    const normalized = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    window.location.hash = normalized;
    setCurrentPath(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const currentRoute = resolveRouteByPath(currentPath);
  const queryString = currentPath.includes('?') ? currentPath.split('?')[1] : '';
  const queryParams: RouterQueryParams = Object.fromEntries(
    new URLSearchParams(queryString)
  );

  return (
    <RouterContext.Provider
      value={{
        currentPath: currentRoute.path,
        rawPath: currentPath,
        queryParams,
        currentRoute,
        navigate,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterContextValue {
  return useContext(RouterContext);
}
