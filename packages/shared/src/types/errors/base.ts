/**
 * @fileoverview Base error class for Deep Research Cockpit
 * @lastmodified 2025-10-28
 *
 * Features: Enhanced error with context, stack traces, and HTTP status codes
 * Main APIs: AppError base class
 * Constraints: All application errors should extend this class
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

  constructor(message: string, statusCode = 500, context?: ErrorContext, isOperational = true) {
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
