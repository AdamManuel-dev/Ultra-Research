/**
 * @fileoverview Event bus with real-time streaming support (SSE/WebSocket)
 * @lastmodified 2025-10-28
 *
 * Features: Pub/sub event distribution, SSE/WebSocket streaming, subscriber management
 * Main APIs: EventBus.publish(), EventBus.subscribe(), EventBus.streamSSE()
 * Constraints: <100ms latency for event delivery, handles backpressure
 * Patterns: Observer pattern, typed event emitter, connection lifecycle management
 */

import { EventEmitter } from 'events';

import { ResearchEvent, EventStreamMessage, eventValidator } from '@deep-research/shared';
import { Request, Response } from 'express';

import { logger } from '../utils/logger';

import { opensearchEventIndexer } from './opensearch-event-indexer';

/**
 * Event subscriber interface
 */
interface EventSubscriber {
  id: string;
  runId?: string; // Optional filter by run_id
  callback: (event: ResearchEvent) => void;
}

/**
 * SSE client connection
 */
interface SSEClient {
  id: string;
  response: Response;
  runId?: string;
  lastEventId?: string;
}

/**
 * Event bus for real-time event distribution
 */
export class EventBus {
  private emitter: EventEmitter;

  private subscribers: Map<string, EventSubscriber>;

  private sseClients: Map<string, SSEClient>;

  private eventHistory: ResearchEvent[];

  private readonly maxHistorySize: number = 1000;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Allow many concurrent subscribers
    this.subscribers = new Map();
    this.sseClients = new Map();
    this.eventHistory = [];
  }

  /**
   * Publish an event to all subscribers
   */
  publish(event: ResearchEvent): void {
    const startTime = Date.now();

    try {
      // Validate event before publishing
      eventValidator.validate(event);

      // Add to history
      this.eventHistory.push(event);
      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
      }

      // Emit to subscribers
      this.emitter.emit('event', event);

      // Send to SSE clients
      this.broadcastToSSE(event);

      // Index in OpenSearch (async, don't wait)
      opensearchEventIndexer.indexEvent(event).catch((error) => {
        logger.error('Failed to index event in OpenSearch', {
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            event_id: `${event.run_id}-${event.step_id}`,
          },
        });
      });

      const latency = Date.now() - startTime;

      logger.info('Event published', {
        metadata: {
          run_id: event.run_id,
          step_id: event.step_id,
          action: event.action,
          latency_ms: latency,
          subscriber_count: this.subscribers.size,
          sse_client_count: this.sseClients.size,
        },
      });
    } catch (error) {
      logger.error('Failed to publish event', {
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
  subscribe(id: string, callback: (event: ResearchEvent) => void, runId?: string): () => void {
    const subscriber: EventSubscriber = {
      id,
      runId,
      callback,
    };

    this.subscribers.set(id, subscriber);

    const eventHandler = (event: ResearchEvent) => {
      // Filter by run_id if specified
      if (!runId || event.run_id === runId) {
        try {
          callback(event);
        } catch (error) {
          logger.error('Subscriber callback error', {
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

      logger.info('Subscriber removed', {
        metadata: { subscriber_id: id },
      });
    };
  }

  /**
   * Create SSE stream for real-time events
   */
  streamSSE(req: Request, res: Response, runId?: string) {
    const clientId = `sse-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Register client
    const client: SSEClient = {
      id: clientId,
      response: res,
      runId,
    };

    this.sseClients.set(clientId, client);

    logger.info('SSE client connected', {
      metadata: { client_id: clientId, run_id: runId },
    });

    // Send initial heartbeat
    EventBus.sendSSE(res, { event: 'heartbeat', data: { message: 'connected' } });

    // Handle client disconnect
    req.on('close', () => {
      this.sseClients.delete(clientId);
      logger.info('SSE client disconnected', {
        metadata: { client_id: clientId },
      });
    });

    // Keep connection alive with periodic heartbeats
    const heartbeatInterval = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeatInterval);
        return;
      }
      EventBus.sendSSE(res, { event: 'heartbeat', data: { message: 'alive' } });
    }, 30000); // 30 seconds

    req.on('close', () => clearInterval(heartbeatInterval));
  }

  /**
   * Broadcast event to all SSE clients
   */
  private broadcastToSSE(event: ResearchEvent) {
    this.sseClients.forEach((client, clientId) => {
      // Filter by run_id if client specified one
      if (!client.runId || event.run_id === client.runId) {
        try {
          const message: EventStreamMessage = {
            event: 'research_event',
            data: event,
            id: `${event.run_id}-${event.step_id}`,
          };

          EventBus.sendSSE(client.response, message);
        } catch (error) {
          logger.error('Failed to send SSE to client', {
            metadata: {
              client_id: clientId,
              error: error instanceof Error ? error.message : String(error),
            },
          });
          // Remove dead client
          this.sseClients.delete(clientId);
        }
      }
    });
  }

  /**
   * Send SSE message to client
   */
  private static sendSSE(res: Response, message: EventStreamMessage) {
    if (res.writableEnded) return;

    try {
      res.write(`event: ${message.event}\n`);
      if (message.id) {
        res.write(`id: ${message.id}\n`);
      }
      res.write(`data: ${JSON.stringify(message.data)}\n\n`);
    } catch (error) {
      logger.error('SSE write error', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Get recent event history
   */
  getHistory(runId?: string, limit?: number): ResearchEvent[] {
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

// Singleton instance
export const eventBus = new EventBus();
