/** Auth route configuration — used by middleware and guards */

export const AUTH_ROUTES = {
  callback: "/auth/callback",
  verify: "/auth/verify",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  checkEmail: "/check-email",
  maintenance: "/maintenance",
} as const;

export const DASHBOARD_PREFIX = "/dashboard";
export const ADMIN_PREFIX = "/hard/auth";

export const GUEST_ONLY_ROUTES = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.forgotPassword,
  AUTH_ROUTES.resetPassword,
] as const;

export const PUBLIC_AUTH_ROUTES = [
  "/auth/callback",
  AUTH_ROUTES.verify,
  AUTH_ROUTES.maintenance,
] as const;

export const PROTECTED_CUSTOMER_PREFIXES = [
  DASHBOARD_PREFIX,
] as const;

export const PROTECTED_ADMIN_PREFIXES = [
  ADMIN_PREFIX,
] as const;

export const ADMIN_LOGIN_ROUTE = "/hard/auth/login";

export const LOCKOUT_MAX_ATTEMPTS = 5;
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
export const LOCKOUT_DURATION_MS = 30 * 60 * 1000;

export const GENERIC_AUTH_ERROR =
  "Invalid email or password. Please try again.";

export const GENERIC_REGISTER_ERROR =
  "Unable to create account. Please check your details and try again.";

export const SYSTEM_SETTINGS_KEYS = {
  ADMIN_BOOTSTRAP_COMPLETED: "admin_bootstrap_completed",
} as const;
