/**
 * @fileoverview Custom error classes for Deep Research Cockpit
 * @lastmodified 2025-10-28
 *
 * Features: Structured error types with context, stack traces, and HTTP status codes
 * Main APIs: AppError, AuthError, FetchError, GraphError, ValidationError
 * Constraints: All errors extend AppError base class
 * Patterns: Include statusCode, context, and isOperational flag for proper error handling
 */

export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Base application error class with enhanced context and tracking
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly context?: ErrorContext;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode = 500,
    context?: ErrorContext,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.context = context;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 401, context, true);
  }
}

/**
 * Fetch pipeline errors (HTTP, robots.txt, rate limiting)
 */
export class FetchError extends AppError {
  public readonly url?: string;

  constructor(message: string, statusCode = 500, url?: string, context?: ErrorContext) {
    super(message, statusCode, { ...context, url }, true);
    this.url = url;
  }
}

/**
 * Graph database operation errors
 */
export class GraphError extends AppError {
  public readonly query?: string;

  constructor(message: string, query?: string, context?: ErrorContext) {
    super(message, 500, { ...context, query }, true);
    this.query = query;
  }
}

/**
 * Input validation errors
 */
export class ValidationError extends AppError {
  public readonly fields?: string[];

  constructor(message: string, fields?: string[], context?: ErrorContext) {
    super(message, 400, { ...context, fields }, true);
    this.fields = fields;
  }
}

/**
 * External service errors (OpenSearch, Redis, etc.)
 */
export class ServiceError extends AppError {
  public readonly service: string;

  constructor(message: string, service: string, context?: ErrorContext) {
    super(message, 503, { ...context, service }, true);
    this.service = service;
  }
}

/**
 * Configuration errors (missing env vars, invalid config)
 */
export class ConfigError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 500, context, false); // Not operational - requires restart
  }
}
