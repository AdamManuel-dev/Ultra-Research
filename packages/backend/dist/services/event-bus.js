"use strict";
/**
 * @fileoverview Event bus with real-time streaming support (SSE/WebSocket)
 * @lastmodified 2025-10-28
 *
 * Features: Pub/sub event distribution, SSE/WebSocket streaming, subscriber management
 * Main APIs: EventBus.publish(), EventBus.subscribe(), EventBus.streamSSE()
 * Constraints: <100ms latency for event delivery, handles backpressure
 * Patterns: Observer pattern, typed event emitter, connection lifecycle management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
const events_1 = require("events");
const shared_1 = require("@deep-research/shared");
const logger_1 = require("../utils/logger");
/**
 * Event bus for real-time event distribution
 */
class EventBus {
    emitter;
    subscribers;
    sseClients;
    eventHistory;
    maxHistorySize = 1000;
    constructor() {
        this.emitter = new events_1.EventEmitter();
        this.emitter.setMaxListeners(100); // Allow many concurrent subscribers
        this.subscribers = new Map();
        this.sseClients = new Map();
        this.eventHistory = [];
    }
    /**
     * Publish an event to all subscribers
     */
    async publish(event) {
        const startTime = Date.now();
        try {
            // Validate event before publishing
            shared_1.eventValidator.validate(event);
            // Add to history
            this.eventHistory.push(event);
            if (this.eventHistory.length > this.maxHistorySize) {
                this.eventHistory.shift();
            }
            // Emit to subscribers
            this.emitter.emit('event', event);
            // Send to SSE clients
            this.broadcastToSSE(event);
            const latency = Date.now() - startTime;
            logger_1.logger.info('Event published', {
                metadata: {
                    run_id: event.run_id,
                    step_id: event.step_id,
                    action: event.action,
                    latency_ms: latency,
                    subscriber_count: this.subscribers.size,
                    sse_client_count: this.sseClients.size,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to publish event', {
                metadata: {
                    error: error instanceof Error ? error.message : String(error),
                    event: event.action,
                },
            });
            throw error;
        }
    }
    /**
     * Subscribe to events with optional run_id filter
     */
    subscribe(id, callback, runId) {
        const subscriber = {
            id,
            runId,
            callback,
        };
        this.subscribers.set(id, subscriber);
        const eventHandler = (event) => {
            // Filter by run_id if specified
            if (!runId || event.run_id === runId) {
                try {
                    callback(event);
                }
                catch (error) {
                    logger_1.logger.error('Subscriber callback error', {
                        metadata: {
                            subscriber_id: id,
                            error: error instanceof Error ? error.message : String(error),
                        },
                    });
                }
            }
        };
        this.emitter.on('event', eventHandler);
        // Return unsubscribe function
        return () => {
            this.emitter.off('event', eventHandler);
            this.subscribers.delete(id);
            logger_1.logger.info('Subscriber removed', {
                metadata: { subscriber_id: id },
            });
        };
    }
    /**
     * Create SSE stream for real-time events
     */
    streamSSE(req, res, runId) {
        const clientId = `sse-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        // Register client
        const client = {
            id: clientId,
            response: res,
            runId,
        };
        this.sseClients.set(clientId, client);
        logger_1.logger.info('SSE client connected', {
            metadata: { client_id: clientId, run_id: runId },
        });
        // Send initial heartbeat
        this.sendSSE(res, { event: 'heartbeat', data: { message: 'connected' } });
        // Handle client disconnect
        req.on('close', () => {
            this.sseClients.delete(clientId);
            logger_1.logger.info('SSE client disconnected', {
                metadata: { client_id: clientId },
            });
        });
        // Keep connection alive with periodic heartbeats
        const heartbeatInterval = setInterval(() => {
            if (res.writableEnded) {
                clearInterval(heartbeatInterval);
                return;
            }
            this.sendSSE(res, { event: 'heartbeat', data: { message: 'alive' } });
        }, 30000); // 30 seconds
        req.on('close', () => clearInterval(heartbeatInterval));
    }
    /**
     * Broadcast event to all SSE clients
     */
    broadcastToSSE(event) {
        for (const [clientId, client] of this.sseClients.entries()) {
            // Filter by run_id if client specified one
            if (!client.runId || event.run_id === client.runId) {
                try {
                    const message = {
                        event: 'research_event',
                        data: event,
                        id: `${event.run_id}-${event.step_id}`,
                    };
                    this.sendSSE(client.response, message);
                }
                catch (error) {
                    logger_1.logger.error('Failed to send SSE to client', {
                        metadata: {
                            client_id: clientId,
                            error: error instanceof Error ? error.message : String(error),
                        },
                    });
                    // Remove dead client
                    this.sseClients.delete(clientId);
                }
            }
        }
    }
    /**
     * Send SSE message to client
     */
    sendSSE(res, message) {
        if (res.writableEnded)
            return;
        try {
            res.write(`event: ${message.event}\n`);
            if (message.id) {
                res.write(`id: ${message.id}\n`);
            }
            res.write(`data: ${JSON.stringify(message.data)}\n\n`);
        }
        catch (error) {
            logger_1.logger.error('SSE write error', {
                metadata: {
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
    /**
     * Get recent event history
     */
    getHistory(runId, limit) {
        let events = this.eventHistory;
        if (runId) {
            events = events.filter((e) => e.run_id === runId);
        }
        if (limit) {
            events = events.slice(-limit);
        }
        return events;
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            subscribers: this.subscribers.size,
            sseClients: this.sseClients.size,
            historySize: this.eventHistory.length,
        };
    }
    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }
}
exports.EventBus = EventBus;
// Singleton instance
exports.eventBus = new EventBus();
//# sourceMappingURL=event-bus.js.map