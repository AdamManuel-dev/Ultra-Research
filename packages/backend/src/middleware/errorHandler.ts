/**
 * @fileoverview Express error handling middleware
 * @lastmodified 2025-10-28
 *
 * Features: Centralized error handling, proper HTTP status codes, error logging
 * Main APIs: errorHandler middleware, notFound middleware
 * Constraints: Must be last middleware in Express chain
 * Patterns: Distinguishes operational vs programming errors, logs all errors
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@deep-research/shared';
import { logger, logError } from '../utils/logger';

/**
 * Global error handler middleware
 * Must be defined after all routes
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Log error with request context
  logError('Request error', err, {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        context: err.context,
        timestamp: err.timestamp,
      },
    });
  }

  // Handle unexpected errors (programming errors)
  logger.error('Unexpected error', {
    metadata: {
      error: {
        message: err.message,
        stack: err.stack,
      },
    },
  });

  // Don't leak error details in production
  const message =
    process.env['NODE_ENV'] === 'production' ? 'Internal server error' : err.message;

  return res.status(500).json({
    error: {
      name: 'InternalError',
      message,
      statusCode: 500,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * 404 Not Found handler
 */
export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: {
      name: 'NotFound',
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Async route wrapper to catch promise rejections
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
