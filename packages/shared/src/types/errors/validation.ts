/**
 * @fileoverview Input validation errors
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * Input validation errors
 *
 * Use this error for any input validation failures including:
 * - Schema validation (JSON Schema, Zod)
 * - Type validation
 * - Business rule violations
 * - Required field missing
 * - Invalid format (email, URL, etc.)
 *
 * @example <caption>Schema validation error</caption>
 * throw new ValidationError(
 *   'Invalid user input',
 *   ['email', 'age'],
 *   {
 *     errors: [
 *       { field: 'email', message: 'Invalid email format' },
 *       { field: 'age', message: 'Must be positive' }
 *     ]
 *   }
 * );
 *
 * @example <caption>Required field error</caption>
 * throw new ValidationError('Missing required field', ['username']);
 */
export class ValidationError extends AppError {
  /** List of field names that failed validation */
  public readonly fields?: string[];

  /**
   * Create a new ValidationError
   *
   * @param message - Human-readable error message
   * @param fields - Field names that failed validation
   * @param context - Additional error context (validation details, schema, etc.)
   */
  constructor(message: string, fields?: string[], context?: ErrorContext) {
    super(message, 400, { ...context, fields }, true);
    this.fields = fields;
  }
}
