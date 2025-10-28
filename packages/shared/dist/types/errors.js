"use strict";
/**
 * @fileoverview Custom error classes for Deep Research Cockpit
 * @lastmodified 2025-10-28
 *
 * Features: Structured error types with context, stack traces, and HTTP status codes
 * Main APIs: AppError, AuthError, FetchError, GraphError, ValidationError
 * Constraints: All errors extend AppError base class
 * Patterns: Include statusCode, context, and isOperational flag for proper error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigError = exports.ServiceError = exports.ValidationError = exports.GraphError = exports.FetchError = exports.AuthError = exports.AppError = void 0;
/**
 * Base application error class with enhanced context and tracking
 */
class AppError extends Error {
    statusCode;
    context;
    isOperational;
    timestamp;
    constructor(message, statusCode = 500, context, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.context = context;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack,
        };
    }
}
exports.AppError = AppError;
/**
 * Authentication and authorization errors
 */
class AuthError extends AppError {
    constructor(message, context) {
        super(message, 401, context, true);
    }
}
exports.AuthError = AuthError;
/**
 * Fetch pipeline errors (HTTP, robots.txt, rate limiting)
 */
class FetchError extends AppError {
    url;
    constructor(message, statusCode = 500, url, context) {
        super(message, statusCode, { ...context, url }, true);
        this.url = url;
    }
}
exports.FetchError = FetchError;
/**
 * Graph database operation errors
 */
class GraphError extends AppError {
    query;
    constructor(message, query, context) {
        super(message, 500, { ...context, query }, true);
        this.query = query;
    }
}
exports.GraphError = GraphError;
/**
 * Input validation errors
 */
class ValidationError extends AppError {
    fields;
    constructor(message, fields, context) {
        super(message, 400, { ...context, fields }, true);
        this.fields = fields;
    }
}
exports.ValidationError = ValidationError;
/**
 * External service errors (OpenSearch, Redis, etc.)
 */
class ServiceError extends AppError {
    service;
    constructor(message, service, context) {
        super(message, 503, { ...context, service }, true);
        this.service = service;
    }
}
exports.ServiceError = ServiceError;
/**
 * Configuration errors (missing env vars, invalid config)
 */
class ConfigError extends AppError {
    constructor(message, context) {
        super(message, 500, context, false); // Not operational - requires restart
    }
}
exports.ConfigError = ConfigError;
//# sourceMappingURL=errors.js.map