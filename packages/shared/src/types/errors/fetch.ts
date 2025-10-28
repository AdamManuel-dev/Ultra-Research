/**
 * @fileoverview Fetch pipeline errors (HTTP, robots.txt, rate limiting)
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * Fetch pipeline errors (HTTP, robots.txt, rate limiting)
 *
 * Use this error for any failures during web scraping operations including:
 * - HTTP errors (404, 500, etc.)
 * - robots.txt violations
 * - Rate limiting
 * - Network timeouts
 * - Invalid URLs
 *
 * @example <caption>HTTP error</caption>
 * throw new FetchError('Page not found', 404, 'https://example.com/missing');
 *
 * @example <caption>Rate limiting</caption>
 * throw new FetchError('Rate limit exceeded', 429, 'https://api.example.com', {
 *   retryAfter: 60,
 *   requestCount: 100
 * });
 */
export class FetchError extends AppError {
  /** URL that caused the fetch error */
  public readonly url?: string;

  /**
   * Create a new FetchError
   *
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (default: 500)
   * @param url - URL that caused the error
   * @param context - Additional error context (retry info, headers, etc.)
   */
  constructor(message: string, statusCode = 500, url?: string, context?: ErrorContext) {
    super(message, statusCode, { ...context, url }, true);
    this.url = url;
  }
}
