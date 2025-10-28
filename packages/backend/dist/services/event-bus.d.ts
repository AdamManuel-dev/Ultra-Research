/**
 * @fileoverview Event bus with real-time streaming support (SSE/WebSocket)
 * @lastmodified 2025-10-28
 *
 * Features: Pub/sub event distribution, SSE/WebSocket streaming, subscriber management
 * Main APIs: EventBus.publish(), EventBus.subscribe(), EventBus.streamSSE()
 * Constraints: <100ms latency for event delivery, handles backpressure
 * Patterns: Observer pattern, typed event emitter, connection lifecycle management
 */
import { Request, Response } from 'express';
import { ResearchEvent } from '@deep-research/shared';
/**
 * Event bus for real-time event distribution
 */
export declare class EventBus {
    private emitter;
    private subscribers;
    private sseClients;
    private eventHistory;
    private readonly maxHistorySize;
    constructor();
    /**
     * Publish an event to all subscribers
     */
    publish(event: ResearchEvent): Promise<void>;
    /**
     * Subscribe to events with optional run_id filter
     */
    subscribe(id: string, callback: (event: ResearchEvent) => void, runId?: string): () => void;
    /**
     * Create SSE stream for real-time events
     */
    streamSSE(req: Request, res: Response, runId?: string): void;
    /**
     * Broadcast event to all SSE clients
     */
    private broadcastToSSE;
    /**
     * Send SSE message to client
     */
    private sendSSE;
    /**
     * Get recent event history
     */
    getHistory(runId?: string, limit?: number): ResearchEvent[];
    /**
     * Get statistics
     */
    getStats(): {
        subscribers: number;
        sseClients: number;
        historySize: number;
    };
    /**
     * Clear event history
     */
    clearHistory(): void;
}
export declare const eventBus: EventBus;
//# sourceMappingURL=event-bus.d.ts.map