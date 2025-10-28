/**
 * @fileoverview Durable event storage with object store integration (S3/MinIO)
 * @lastmodified 2025-10-28
 *
 * Features: Persist events to object storage, JSONL format, partitioned by run_id/date
 * Main APIs: EventStorage.store(), EventStorage.retrieve(), EventStorage.listRuns()
 * Constraints: Append-only storage, immutable events, automatic partitioning
 * Patterns: Write-ahead logging, buffered writes with flush, date-based partitioning
 */
import { ResearchEvent } from '@deep-research/shared';
/**
 * Event storage configuration
 */
interface StorageConfig {
    bucketName: string;
    flushInterval: number;
    batchSize: number;
}
/**
 * Event storage service for durable persistence
 * Note: S3 client implementation to be added based on environment
 */
export declare class EventStorage {
    private buffer;
    private readonly config;
    private flushTimer?;
    constructor(config?: Partial<StorageConfig>);
    /**
     * Store an event (adds to buffer for batched write)
     */
    store(event: ResearchEvent): Promise<void>;
    /**
     * Generate partition key: run_id/YYYY-MM-DD
     */
    private getPartitionKey;
    /**
     * Generate object key: run_id/YYYY-MM-DD/HH-mm-ss-SSS.jsonl
     */
    private getObjectKey;
    /**
     * Flush buffered events to storage
     */
    flush(partition?: string): Promise<void>;
    /**
     * Write events to object storage
     * TODO: Implement actual S3/MinIO client
     */
    private writeEventsToStorage;
    /**
     * Retrieve events for a run
     */
    retrieve(runId: string, fromDate?: Date, toDate?: Date): Promise<ResearchEvent[]>;
    /**
     * List all run IDs in storage
     */
    listRuns(): Promise<string[]>;
    /**
     * Start periodic flush timer
     */
    private startFlushTimer;
    /**
     * Stop flush timer and flush remaining events
     */
    close(): Promise<void>;
    /**
     * Get buffer statistics
     */
    getStats(): {
        partitions: number;
        bufferedEvents: number;
    };
}
export declare const eventStorage: EventStorage;
export {};
//# sourceMappingURL=event-storage.d.ts.map