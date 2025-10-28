/**
 * @fileoverview Input validation errors
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

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
