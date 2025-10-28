"use strict";
/**
 * @fileoverview Structured logging with correlation IDs and JSON output
 * @lastmodified 2025-10-28
 *
 * Features: Winston-based logger with run_id/step_id tracking, log levels, JSON formatting
 * Main APIs: logger.info(), logger.error(), logger.warn(), createChildLogger()
 * Constraints: Uses Winston transports, supports correlation ID propagation
 * Patterns: Include run_id and step_id in all logs for tracing, use child loggers for context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createChildLogger = createChildLogger;
exports.logRequest = logRequest;
exports.logError = logError;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
const config_1 = require("../config");
/**
 * Custom log format with timestamps and metadata
 */
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata(), winston_1.default.format.json());
/**
 * Console format for development (pretty-print)
 */
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss.SSS' }), winston_1.default.format.printf(({ timestamp, level, message, metadata }) => {
    const metaStr = Object.keys(metadata || {}).length > 0 ? JSON.stringify(metadata) : '';
    return `${timestamp} [${level}] ${message} ${metaStr}`;
}));
/**
 * Create Winston logger instance
 */
const createLogger = () => {
    const transports = [];
    // Console transport for development
    if (config_1.config.nodeEnv === 'development') {
        transports.push(new winston_1.default.transports.Console({
            format: consoleFormat,
        }));
    }
    else {
        // JSON format for production
        transports.push(new winston_1.default.transports.Console({
            format: logFormat,
        }));
    }
    // File transports for production
    if (config_1.config.nodeEnv === 'production') {
        transports.push(new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat,
        }), new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            format: logFormat,
        }));
    }
    return winston_1.default.createLogger({
        level: config_1.config.logLevel,
        transports,
        exitOnError: false,
    });
};
/**
 * Global logger instance
 */
exports.logger = createLogger();
/**
 * Create a child logger with default metadata (for correlation)
 */
function createChildLogger(defaultMeta) {
    return exports.logger.child({ metadata: defaultMeta });
}
/**
 * Log request/response with timing
 */
function logRequest(method, path, statusCode, durationMs, meta) {
    exports.logger.info('HTTP request', {
        metadata: {
            method,
            path,
            statusCode,
            duration_ms: durationMs,
            ...meta,
        },
    });
}
/**
 * Log error with full stack trace
 */
function logError(message, error, meta) {
    exports.logger.error(message, {
        metadata: {
            error: {
                message: error.message,
                name: error.name,
                stack: error.stack,
            },
            ...meta,
        },
    });
}
//# sourceMappingURL=logger.js.map