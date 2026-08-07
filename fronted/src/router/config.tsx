import type { ReactNode } from "react";

import routes from "./routes.json";
import { TestPage } from "../pages/TestPage";

const pageRegistry: Record<string, ReactNode> = {
  test: <TestPage />,
};

export interface AppRouteConfig {
  path: string;
  label: string;
  navigation: boolean;
  page: string;
  element: ReactNode;
}

export const appRoutes: AppRouteConfig[] = routes.map((route) => ({
  ...route,
  element: pageRegistry[route.page],
}));
