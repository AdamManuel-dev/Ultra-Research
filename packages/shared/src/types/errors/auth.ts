/**
 * @fileoverview Authentication and authorization errors
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * Authentication and authorization errors
 */
export class AuthError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 401, context, true);
  }
}
