/**
 * @fileoverview Fetch pipeline errors (HTTP, robots.txt, rate limiting)
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

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
