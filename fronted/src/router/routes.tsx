import type { RouteObject } from "react-router-dom";

import { appRoutes } from "./config";

export const routeObjects: RouteObject[] = appRoutes.map(({ path, element }) => ({
  path,
  element,
}));
