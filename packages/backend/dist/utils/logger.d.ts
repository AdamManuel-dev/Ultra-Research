/**
 * @fileoverview Structured logging with correlation IDs and JSON output
 * @lastmodified 2025-10-28
 *
 * Features: Winston-based logger with run_id/step_id tracking, log levels, JSON formatting
 * Main APIs: logger.info(), logger.error(), logger.warn(), createChildLogger()
 * Constraints: Uses Winston transports, supports correlation ID propagation
 * Patterns: Include run_id and step_id in all logs for tracing, use child loggers for context
 */
import winston from 'winston';
/**
 * Log metadata interface
 */
export interface LogMetadata {
    run_id?: string;
    step_id?: number;
    agent?: string;
    action?: string;
    duration_ms?: number;
    error?: Error;
    [key: string]: unknown;
}
/**
 * Global logger instance
 */
export declare const logger: winston.Logger;
/**
 * Create a child logger with default metadata (for correlation)
 */
export declare function createChildLogger(defaultMeta: LogMetadata): winston.Logger;
/**
 * Log request/response with timing
 */
export declare function logRequest(method: string, path: string, statusCode: number, durationMs: number, meta?: LogMetadata): void;
/**
 * Log error with full stack trace
 */
export declare function logError(message: string, error: Error, meta?: LogMetadata): void;
//# sourceMappingURL=logger.d.ts.map