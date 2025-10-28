/**
 * @fileoverview Configuration errors (missing env vars, invalid config)
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * Configuration errors (missing env vars, invalid config)
 *
 * Use this error for configuration-related failures that typically
 * require application restart to fix. These are non-operational errors.
 *
 * Common scenarios:
 * - Missing required environment variables
 * - Invalid configuration values
 * - Configuration file parsing errors
 * - Incompatible configuration combinations
 *
 * @example <caption>Missing environment variable</caption>
 * throw new ConfigError('Missing required environment variable', {
 *   variable: 'DATABASE_URL',
 *   required: true
 * });
 *
 * @example <caption>Invalid configuration</caption>
 * throw new ConfigError('Invalid port configuration', {
 *   port: -1,
 *   validRange: '1-65535'
 * });
 */
export class ConfigError extends AppError {
  /**
   * Create a new ConfigError
   *
   * @param message - Human-readable error message
   * @param context - Additional error context (config keys, expected values, etc.)
   */
  constructor(message: string, context?: ErrorContext) {
    super(message, 500, context, false); // Not operational - requires restart
  }
}
