import { randomBytes } from "node:crypto";

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INFRASTRUCTURE_NOT_CONFIGURED"
  | "INTERNAL_ERROR";

const USER_MESSAGES: Record<AppErrorCode, string> = {
  VALIDATION_ERROR: "The request could not be processed. Please check your input and try again.",
  UNAUTHORIZED: "You must be signed in to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  CONFLICT: "This action conflicts with the current state. Please refresh and try again.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  INFRASTRUCTURE_NOT_CONFIGURED:
    "This feature is temporarily unavailable. Please try again later.",
  INTERNAL_ERROR: "Something went wrong. Our team has been notified.",
};

export class AppError extends Error {
  readonly errorId: string;
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly userMessage: string;
  readonly details?: unknown;
  readonly retryable: boolean;

  constructor(options: {
    code: AppErrorCode;
    message: string;
    statusCode?: number;
    userMessage?: string;
    details?: unknown;
    retryable?: boolean;
    errorId?: string;
  }) {
    super(options.message);
    this.name = "AppError";
    this.errorId = options.errorId ?? `err_${randomBytes(6).toString("hex")}`;
    this.code = options.code;
    this.statusCode = options.statusCode ?? statusForCode(options.code);
    this.userMessage = options.userMessage ?? USER_MESSAGES[options.code];
    this.details = options.details;
    this.retryable = options.retryable ?? false;
  }
}

function statusForCode(code: AppErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "RATE_LIMITED":
      return 429;
    case "INFRASTRUCTURE_NOT_CONFIGURED":
      return 503;
    default:
      return 500;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError({
    code: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : String(error),
  });
}

export function appErrorResponse(error: AppError) {
  return {
    error: error.userMessage,
    code: error.code,
    errorId: error.errorId,
    retryable: error.retryable,
  };
}
