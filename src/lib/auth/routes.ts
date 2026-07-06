import {
  ADMIN_LOGIN_ROUTE,
  ADMIN_PREFIX,
  AUTH_ROUTES,
  DASHBOARD_PREFIX,
  GUEST_ONLY_ROUTES,
  PUBLIC_AUTH_ROUTES,
} from "./constants";

export function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some((route) => pathname === route);
}

export function isPublicAuthRoute(pathname: string): boolean {
  return PUBLIC_AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isDashboardRoute(pathname: string): boolean {
  return matchesPrefix(pathname, DASHBOARD_PREFIX);
}

export function isAdminRoute(pathname: string): boolean {
  return (
    matchesPrefix(pathname, ADMIN_PREFIX) && pathname !== ADMIN_LOGIN_ROUTE
  );
}

export function isAdminLoginRoute(pathname: string): boolean {
  return pathname === ADMIN_LOGIN_ROUTE;
}

export function isAuthApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/auth");
}

export function isMaintenanceExempt(pathname: string): boolean {
  return (
    pathname === AUTH_ROUTES.maintenance ||
    pathname === "/api/health" ||
    pathname.startsWith("/auth/callback") ||
    isAuthApiRoute(pathname)
  );
}
