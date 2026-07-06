import type { ServiceError } from "./types";

export function serviceError(
  code: string,
  message: string,
  details?: unknown,
): ServiceError {
  return { code, message, details };
}

export function ok<T>(data: T) {
  return { success: true as const, data };
}

export function fail(code: string, message: string, details?: unknown) {
  return { success: false as const, error: serviceError(code, message, details) };
}
