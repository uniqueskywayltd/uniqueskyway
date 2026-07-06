import { NextResponse } from "next/server";
import { AppError, appErrorResponse, toAppError } from "./app-error";
import { logger } from "@/lib/logging/logger";

export function handleApiError(error: unknown, context?: string): NextResponse {
  const appError = toAppError(error);

  if (!(error instanceof AppError)) {
    logger.error("app", context ?? "Unhandled API error", {
      code: appError.code,
      message: appError.message,
    }, appError.errorId);
  }

  return NextResponse.json(appErrorResponse(appError), {
    status: appError.statusCode,
  });
}
