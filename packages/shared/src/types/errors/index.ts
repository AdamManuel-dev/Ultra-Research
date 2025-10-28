/**
 * @fileoverview Custom error classes for Deep Research Cockpit
 * @lastmodified 2025-10-28
 *
 * Features: Structured error types with context, stack traces, and HTTP status codes
 * Main APIs: AppError, AuthError, FetchError, GraphError, ValidationError
 * Constraints: All errors extend AppError base class
 * Patterns: Include statusCode, context, and isOperational flag for proper error handling
 */

export { AppError, ErrorContext } from './base';
export { AuthError } from './auth';
export { ConfigError } from './config';
export { FetchError } from './fetch';
export { GraphError } from './graph';
export { ServiceError } from './service';
export { ValidationError } from './validation';
