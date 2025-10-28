"use strict";
/**
 * @fileoverview Express application setup with middleware and routes
 * @lastmodified 2025-10-28
 *
 * Features: Express server with CORS, helmet, logging, error handling
 * Main APIs: createApp() - returns configured Express app
 * Constraints: Apply security middleware, enable CORS for frontend
 * Patterns: Middleware order matters - error handler must be last
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const health_1 = require("./routes/health");
const events_1 = require("./routes/events");
/**
 * Create and configure Express application
 */
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: config_1.config.security.corsOrigin,
        credentials: true,
    }));
    // Body parsing
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Request logging middleware
    app.use((req, _res, next) => {
        logger_1.logger.info('Incoming request', {
            metadata: {
                method: req.method,
                path: req.path,
                query: req.query,
                ip: req.ip,
            },
        });
        next();
    });
    // Routes
    app.use('/health', health_1.healthRouter);
    app.use('/events', events_1.eventsRouter);
    // 404 handler
    app.use(errorHandler_1.notFound);
    // Error handler (must be last)
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map