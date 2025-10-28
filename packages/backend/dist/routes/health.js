"use strict";
/**
 * @fileoverview Health check endpoint for service monitoring
 * @lastmodified 2025-10-28
 *
 * Features: Service health checks, dependency status, uptime tracking
 * Main APIs: GET /health - returns service status and dependencies
 * Constraints: Should be accessible without authentication
 * Patterns: Returns 200 OK if healthy, 503 if dependencies unavailable
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
exports.healthRouter = (0, express_1.Router)();
/**
 * Check dependency health
 */
async function checkDependencies() {
    const dependencies = {};
    // TODO: Implement actual health checks for each service
    // For now, return mock status
    dependencies['neo4j'] = { status: 'up', latency_ms: 5 };
    dependencies['opensearch'] = { status: 'up', latency_ms: 10 };
    dependencies['redis'] = { status: 'up', latency_ms: 2 };
    return dependencies;
}
/**
 * GET /health
 * Returns service health status
 */
exports.healthRouter.get('/', (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const startTime = Date.now();
    const dependencies = await checkDependencies();
    // Determine overall status
    const hasDownDependency = Object.values(dependencies).some((dep) => dep.status === 'down');
    const status = hasDownDependency ? 'degraded' : 'healthy';
    const response = {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env['npm_package_version'] || '0.1.0',
        dependencies,
    };
    const latency = Date.now() - startTime;
    logger_1.logger.info('Health check', {
        metadata: {
            status,
            latency_ms: latency,
        },
    });
    const statusCode = status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
}));
//# sourceMappingURL=health.js.map