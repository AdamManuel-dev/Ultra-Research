/**
 * @fileoverview External service errors (OpenSearch, Redis, etc.)
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * External service errors (OpenSearch, Redis, etc.)
 *
 * Use this error for external service failures including:
 * - OpenSearch connection/query errors
 * - Redis connection errors
 * - AWS service errors
 * - Third-party API failures
 * - Service timeouts
 *
 * @example <caption>OpenSearch error</caption>
 * throw new ServiceError(
 *   'OpenSearch query failed',
 *   'opensearch',
 *   {
 *     cluster: 'research-cluster',
 *     index: 'documents',
 *     operation: 'search'
 *   }
 * );
 *
 * @example <caption>Redis connection error</caption>
 * throw new ServiceError('Redis connection timeout', 'redis', {
 *   host: 'localhost',
 *   port: 6379,
 *   timeout: 5000
 * });
 */
export class ServiceError extends AppError {
  /** Name of the external service that failed */
  public readonly service: string;

  /**
   * Create a new ServiceError
   *
   * @param message - Human-readable error message
   * @param service - Name of the service (opensearch, redis, neo4j, etc.)
   * @param context - Additional error context (connection info, operation details, etc.)
   */
  constructor(message: string, service: string, context?: ErrorContext) {
    super(message, 503, { ...context, service }, true);
    this.service = service;
  }
}
