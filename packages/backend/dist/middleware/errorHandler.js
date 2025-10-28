"use strict";
/**
 * @fileoverview Express error handling middleware
 * @lastmodified 2025-10-28
 *
 * Features: Centralized error handling, proper HTTP status codes, error logging
 * Main APIs: errorHandler middleware, notFound middleware
 * Constraints: Must be last middleware in Express chain
 * Patterns: Distinguishes operational vs programming errors, logs all errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFound = notFound;
exports.asyncHandler = asyncHandler;
const shared_1 = require("@deep-research/shared");
const logger_1 = require("../utils/logger");
/**
 * Global error handler middleware
 * Must be defined after all routes
 */
function errorHandler(err, req, res, _next) {
    // Log error with request context
    (0, logger_1.logError)('Request error', err, {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
    });
    // Handle known operational errors
    if (err instanceof shared_1.AppError) {
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
    logger_1.logger.error('Unexpected error', {
        metadata: {
            error: {
                message: err.message,
                stack: err.stack,
            },
        },
    });
    // Don't leak error details in production
    const message = process.env['NODE_ENV'] === 'production' ? 'Internal server error' : err.message;
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
function notFound(req, res) {
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
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map