type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";

type LogContext = Record<string, unknown>;

function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === "test" && process.env.LOG_IN_TESTS !== "true") {
    return;
  }

  const payload: Record<string, unknown> = {
    severity: level,
    message,
    timestamp: new Date().toISOString(),
    service: process.env.K_SERVICE || "wow-professions-backend",
    environment: process.env.NODE_ENV || "development",
  };

  if (context && Object.keys(context).length > 0) {
    payload.context = context;
  }

  console.log(JSON.stringify(payload));
}

export function logDebug(message: string, context?: LogContext): void {
  emit("DEBUG", message, context);
}

export function logInfo(message: string, context?: LogContext): void {
  emit("INFO", message, context);
}

export function logWarning(message: string, context?: LogContext): void {
  emit("WARNING", message, context);
}

export function logError(message: string, error?: unknown, context?: LogContext): void {
  const errorContext: LogContext = { ...(context || {}) };

  if (error instanceof Error) {
    errorContext.error_name = error.name;
    errorContext.error_message = error.message;
    errorContext.error_stack = error.stack;
  } else if (error !== undefined) {
    errorContext.error = error;
  }

  emit("ERROR", message, errorContext);
}
