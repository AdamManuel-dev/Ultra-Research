"use strict";
/**
 * @fileoverview Event streaming and query API endpoints
 * @lastmodified 2025-10-28
 *
 * Features: SSE event streaming, event query API, event history
 * Main APIs: GET /events/stream (SSE), GET /events (query), POST /events (publish)
 * Constraints: Authentication required for publishing, public streaming
 * Patterns: RESTful API, Server-Sent Events for real-time updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRouter = void 0;
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const event_bus_1 = require("../services/event-bus");
const logger_1 = require("../utils/logger");
exports.eventsRouter = (0, express_1.Router)();
/**
 * GET /events/stream
 * Server-Sent Events stream for real-time events
 */
exports.eventsRouter.get('/stream', (req, res) => {
    const runId = req.query['run_id'];
    logger_1.logger.info('Starting SSE stream', {
        metadata: {
            run_id: runId,
            ip: req.ip,
        },
    });
    event_bus_1.eventBus.streamSSE(req, res, runId);
});
/**
 * GET /events
 * Query event history
 */
exports.eventsRouter.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const runId = req.query['run_id'];
    const limit = req.query['limit'] ? parseInt(req.query['limit'], 10) : 100;
    const events = event_bus_1.eventBus.getHistory(runId, limit);
    res.json({
        events,
        count: events.length,
        filters: {
            run_id: runId,
            limit,
        },
    });
}));
/**
 * POST /events
 * Publish a new event
 */
exports.eventsRouter.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const event = req.body;
    // Publish to event bus
    await event_bus_1.eventBus.publish(event);
    res.status(201).json({
        success: true,
        event: {
            run_id: event.run_id,
            step_id: event.step_id,
            action: event.action,
        },
    });
}));
/**
 * GET /events/stats
 * Get event bus statistics
 */
exports.eventsRouter.get('/stats', (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const stats = event_bus_1.eventBus.getStats();
    res.json(stats);
}));
//# sourceMappingURL=events.js.map