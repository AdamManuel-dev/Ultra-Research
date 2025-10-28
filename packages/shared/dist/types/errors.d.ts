/**
 * @fileoverview Custom error classes for Deep Research Cockpit
 * @lastmodified 2025-10-28
 *
 * Features: Structured error types with context, stack traces, and HTTP status codes
 * Main APIs: AppError, AuthError, FetchError, GraphError, ValidationError
 * Constraints: All errors extend AppError base class
 * Patterns: Include statusCode, context, and isOperational flag for proper error handling
 */
export interface ErrorContext {
    [key: string]: unknown;
}
/**
 * Base application error class with enhanced context and tracking
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly context?: ErrorContext;
    readonly isOperational: boolean;
    readonly timestamp: string;
    constructor(message: string, statusCode?: number, context?: ErrorContext, isOperational?: boolean);
    toJSON(): {
        name: string;
        message: string;
        statusCode: number;
        context: ErrorContext | undefined;
        timestamp: string;
        stack: string | undefined;
    };
}
/**
 * Authentication and authorization errors
 */
export declare class AuthError extends AppError {
    constructor(message: string, context?: ErrorContext);
}
/**
 * Fetch pipeline errors (HTTP, robots.txt, rate limiting)
 */
export declare class FetchError extends AppError {
    readonly url?: string;
    constructor(message: string, statusCode?: number, url?: string, context?: ErrorContext);
}
/**
 * Graph database operation errors
 */
export declare class GraphError extends AppError {
    readonly query?: string;
    constructor(message: string, query?: string, context?: ErrorContext);
}
/**
 * Input validation errors
 */
export declare class ValidationError extends AppError {
    readonly fields?: string[];
    constructor(message: string, fields?: string[], context?: ErrorContext);
}
/**
 * External service errors (OpenSearch, Redis, etc.)
 */
export declare class ServiceError extends AppError {
    readonly service: string;
    constructor(message: string, service: string, context?: ErrorContext);
}
/**
 * Configuration errors (missing env vars, invalid config)
 */
export declare class ConfigError extends AppError {
    constructor(message: string, context?: ErrorContext);
}
//# sourceMappingURL=errors.d.ts.map