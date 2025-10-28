/**
 * @fileoverview Graph database operation errors
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * Graph database operation errors
 */
export class GraphError extends AppError {
  public readonly query?: string;

  constructor(message: string, query?: string, context?: ErrorContext) {
    super(message, 500, { ...context, query }, true);
    this.query = query;
  }
}
