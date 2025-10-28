/**
 * @fileoverview Configuration errors (missing env vars, invalid config)
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * Configuration errors (missing env vars, invalid config)
 */
export class ConfigError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 500, context, false); // Not operational - requires restart
  }
}
