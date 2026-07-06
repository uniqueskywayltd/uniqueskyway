type LogLevel = "debug" | "info" | "warn" | "error";

type LogCategory =
  | "app"
  | "security"
  | "financial"
  | "scheduler"
  | "email"
  | "migration"
  | "admin";

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  errorId?: string;
  metadata?: Record<string, unknown>;
};

function emit(entry: LogEntry) {
  const line = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(line);
    return;
  }
  if (entry.level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
  errorId?: string,
) {
  emit({
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    errorId,
    metadata,
  });
}

export const logger = {
  debug: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log("debug", category, message, metadata),
  info: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log("info", category, message, metadata),
  warn: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log("warn", category, message, metadata),
  error: (
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
    errorId?: string,
  ) => log("error", category, message, metadata, errorId),
};

export type { LogCategory, LogEntry, LogLevel };
