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
/**
 * Global error handler middleware
 * Must be defined after all routes
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): Response<any, Record<string, any>>;
/**
 * 404 Not Found handler
 */
export declare function notFound(req: Request, res: Response): void;
/**
 * Async route wrapper to catch promise rejections
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map