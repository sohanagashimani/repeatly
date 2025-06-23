import { Router } from "express";
import { Path } from "../types";

const getRouteType = (route: any): "jobs" => {
  // For now, all routes are jobs type
  // Can be expanded later for other route types
  return "jobs";
};

export default (routes: Router) => {
  const routesWithPathAndMethod: Path[] = [];

  // Access the router's layer stack directly
  (routes as any).stack.forEach((layer: any) => {
    if (layer.route) {
      // Direct route on the router
      const methods = Object.keys(layer.route.methods);
      methods.forEach(method => {
        routesWithPathAndMethod.push({
          path: layer.route.path,
          method: method,
          type: getRouteType(layer),
        });
      });
    }
  });

  return routesWithPathAndMethod;
};
