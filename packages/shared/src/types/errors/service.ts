/**
 * @fileoverview External service errors (OpenSearch, Redis, etc.)
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * External service errors (OpenSearch, Redis, etc.)
 */
export class ServiceError extends AppError {
  public readonly service: string;

  constructor(message: string, service: string, context?: ErrorContext) {
    super(message, 503, { ...context, service }, true);
    this.service = service;
  }
}
