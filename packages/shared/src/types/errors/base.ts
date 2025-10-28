/**
 * @fileoverview Base error class for Deep Research Cockpit
 * @lastmodified 2025-10-28
 *
 * Features: Enhanced error with context, stack traces, and HTTP status codes
 * Main APIs: AppError base class
 * Constraints: All application errors should extend this class
 * Patterns: Include statusCode, context, and isOperational flag for proper error handling
 */

/**
 * Additional context information for errors
 *
 * @example
 * const context: ErrorContext = {
 *   userId: '12345',
 *   operation: 'fetch',
 *   url: 'https://example.com'
 * };
 */
export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Base application error class with enhanced context and tracking
 *
 * All application-specific errors should extend this class to ensure
 * consistent error handling, logging, and HTTP status code mapping.
 *
 * @example
 * class CustomError extends AppError {
 *   constructor(message: string, context?: ErrorContext) {
 *     super(message, 500, context, true);
 *   }
 * }
 *
 * @example
 * try {
 *   // risky operation
 * } catch (error) {
 *   throw new AppError('Operation failed', 500, { originalError: error });
 * }
 */
export class AppError extends Error {
  public readonly statusCode: number;

  public readonly context?: ErrorContext;

  public readonly isOperational: boolean;

  /** ISO 8601 timestamp when error occurred */
  public readonly timestamp: string;

  /**
   * Create a new AppError
   *
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (default: 500)
   * @param context - Additional error context
   * @param isOperational - Whether error is operational (expected) or programming error
   */
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

  /**
   * Convert error to JSON for logging and API responses
   *
   * @returns JSON representation of the error
   */
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
