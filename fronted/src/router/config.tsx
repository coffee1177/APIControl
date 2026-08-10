import type { ReactNode } from "react";

import routes from "./routes.json";
import { ManagementLayout } from "../layouts";
import { Home } from "../pages/Home";
import { TestPage } from "../pages/TestPage";
import { WebRetention } from "../pages/WebRetention";

const pageRegistry: Record<string, ReactNode> = {
  home: <Home />,
  test: <TestPage />,
  webRetention: <WebRetention />,
};

interface RouteConfig {
  key: string;
  icon?: string;
  label: string;
  path?: string;
  page?: string;
  children?: RouteConfig[];
}

export interface AppRouteConfig {
  path: string;
  label: string;
  page: string;
  element: ReactNode;
}

function getPageRoutes(routeList: RouteConfig[]): AppRouteConfig[] {
  return routeList.flatMap((route) => {
    const currentRoute =
      (route.path ?? route.key) && route.page
        ? [
            {
              path: route.path ?? route.key,
              label: route.label,
              page: route.page,
              element: (
                <ManagementLayout>{pageRegistry[route.page]}</ManagementLayout>
              ),
            },
          ]
        : [];

    return [...currentRoute, ...getPageRoutes(route.children ?? [])];
  });
}

export const appRoutes = getPageRoutes(routes as RouteConfig[]);
