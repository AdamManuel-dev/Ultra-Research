/**
 * @fileoverview Graph database operation errors
 * @lastmodified 2025-10-28
 */

import { AppError, ErrorContext } from './base';

/**
 * Graph database operation errors
 *
 * Use this error for Neo4j operations including:
 * - Query execution failures
 * - Connection errors
 * - Transaction errors
 * - Constraint violations
 * - Invalid Cypher syntax
 *
 * @example <caption>Query execution error</caption>
 * throw new GraphError(
 *   'Failed to create node',
 *   'CREATE (n:Person {name: $name}) RETURN n',
 *   { params: { name: 'John' } }
 * );
 *
 * @example <caption>Connection error</caption>
 * throw new GraphError('Neo4j connection failed', undefined, {
 *   host: 'localhost',
 *   port: 7687
 * });
 */
export class GraphError extends AppError {
  /** Cypher query that caused the error */
  public readonly query?: string;

  /**
   * Create a new GraphError
   *
   * @param message - Human-readable error message
   * @param query - Cypher query that failed
   * @param context - Additional error context (query params, transaction info, etc.)
   */
  constructor(message: string, query?: string, context?: ErrorContext) {
    super(message, 500, { ...context, query }, true);
    this.query = query;
  }
}
