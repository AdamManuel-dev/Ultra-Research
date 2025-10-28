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
import { config } from '../config';

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
 * Custom log format with timestamps and metadata
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

/**
 * Console format for development (pretty-print)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const metaStr = Object.keys(metadata || {}).length > 0 ? JSON.stringify(metadata) : '';
    return `${timestamp} [${level}] ${message} ${metaStr}`;
  })
);

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const transports: winston.transport[] = [];

  // Console transport for development
  if (config.nodeEnv === 'development') {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
      })
    );
  } else {
    // JSON format for production
    transports.push(
      new winston.transports.Console({
        format: logFormat,
      })
    );
  }

  // File transports for production
  if (config.nodeEnv === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
      })
    );
  }

  return winston.createLogger({
    level: config.logLevel,
    transports,
    exitOnError: false,
  });
};

/**
 * Global logger instance
 */
export const logger = createLogger();

/**
 * Create a child logger with default metadata (for correlation)
 */
export function createChildLogger(defaultMeta: LogMetadata): winston.Logger {
  return logger.child({ metadata: defaultMeta });
}

/**
 * Log request/response with timing
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  meta?: LogMetadata
) {
  logger.info('HTTP request', {
    metadata: {
      method,
      path,
      statusCode,
      duration_ms: durationMs,
      ...meta,
    },
  });
}

/**
 * Log error with full stack trace
 */
export function logError(message: string, error: Error, meta?: LogMetadata) {
  logger.error(message, {
    metadata: {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      ...meta,
    },
  });
}
