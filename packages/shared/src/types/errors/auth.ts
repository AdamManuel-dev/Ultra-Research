/**
 * @fileoverview Authentication and authorization errors
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * Authentication and authorization errors
 *
 * Use this error for authentication failures (invalid credentials,
 * missing tokens) and authorization failures (insufficient permissions).
 *
 * @example <caption>Authentication failure</caption>
 * throw new AuthError('Invalid JWT token', {
 *   token: redactedToken,
 *   reason: 'Token expired'
 * });
 *
 * @example <caption>Authorization failure</caption>
 * throw new AuthError('Insufficient permissions', {
 *   userId: user.id,
 *   requiredRole: 'admin',
 *   actualRole: user.role
 * });
 */
export class AuthError extends AppError {
  /**
   * Create a new AuthError
   *
   * @param message - Human-readable error message
   * @param context - Additional error context (user ID, token info, etc.)
   */
  constructor(message: string, context?: ErrorContext) {
    super(message, 401, context, true);
  }
}
