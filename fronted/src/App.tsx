import { useRoutes } from "react-router-dom";

import { routeObjects } from "./router/routes";

export function App() {
  return useRoutes(routeObjects);
}
