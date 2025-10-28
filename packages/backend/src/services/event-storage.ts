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
import { logger } from '../utils/logger';

/**
 * Event storage configuration
 */
interface StorageConfig {
  bucketName: string;
  flushInterval: number; // ms
  batchSize: number;
}

/**
 * Event storage service for durable persistence
 * Note: S3 client implementation to be added based on environment
 */
export class EventStorage {
  private buffer: Map<string, ResearchEvent[]>;
  private readonly config: StorageConfig;
  private flushTimer?: NodeJS.Timeout;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      bucketName: config?.bucketName || 'research-events',
      flushInterval: config?.flushInterval || 30000, // 30 seconds
      batchSize: config?.batchSize || 100,
    };

    this.buffer = new Map();
    this.startFlushTimer();
  }

  /**
   * Store an event (adds to buffer for batched write)
   */
  async store(event: ResearchEvent): Promise<void> {
    const partition = this.getPartitionKey(event);

    if (!this.buffer.has(partition)) {
      this.buffer.set(partition, []);
    }

    const events = this.buffer.get(partition)!;
    events.push(event);

    // Flush if batch is full
    if (events.length >= this.config.batchSize) {
      await this.flush(partition);
    }
  }

  /**
   * Generate partition key: run_id/YYYY-MM-DD
   */
  private getPartitionKey(event: ResearchEvent): string {
    const date = new Date(event.ts).toISOString().split('T')[0];
    return `${event.run_id}/${date}`;
  }

  /**
   * Generate object key: run_id/YYYY-MM-DD/HH-mm-ss-SSS.jsonl
   */
  private getObjectKey(partition: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];
    return `events/${partition}/${timestamp}.jsonl`;
  }

  /**
   * Flush buffered events to storage
   */
  async flush(partition?: string): Promise<void> {
    const partitions = partition ? [partition] : Array.from(this.buffer.keys());

    for (const p of partitions) {
      const events = this.buffer.get(p);
      if (!events || events.length === 0) continue;

      try {
        await this.writeEventsToStorage(p, events);

        logger.info('Events flushed to storage', {
          metadata: {
            partition: p,
            event_count: events.length,
          },
        });

        // Clear buffer for this partition
        this.buffer.delete(p);
      } catch (error) {
        logger.error('Failed to flush events', {
          metadata: {
            partition: p,
            event_count: events.length,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        // Keep events in buffer for retry
      }
    }
  }

  /**
   * Write events to object storage
   * TODO: Implement actual S3/MinIO client
   */
  private async writeEventsToStorage(partition: string, events: ResearchEvent[]): Promise<void> {
    const objectKey = this.getObjectKey(partition);

    // Convert events to JSONL format
    const jsonl = events.map((e) => JSON.stringify(e)).join('\n');

    logger.info('Writing events to storage', {
      metadata: {
        object_key: objectKey,
        size_bytes: Buffer.byteLength(jsonl),
        event_count: events.length,
      },
    });

    // TODO: Implement S3 upload
    // await s3Client.putObject({
    //   Bucket: this.config.bucketName,
    //   Key: objectKey,
    //   Body: jsonl,
    //   ContentType: 'application/x-ndjson',
    // });
  }

  /**
   * Retrieve events for a run
   */
  async retrieve(runId: string, fromDate?: Date, toDate?: Date): Promise<ResearchEvent[]> {
    // TODO: Implement S3 list and retrieve
    logger.info('Retrieving events from storage', {
      metadata: {
        run_id: runId,
        from_date: fromDate?.toISOString(),
        to_date: toDate?.toISOString(),
      },
    });

    return [];
  }

  /**
   * List all run IDs in storage
   */
  async listRuns(): Promise<string[]> {
    // TODO: Implement S3 list prefixes
    return [];
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        logger.error('Flush timer error', {
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
      });
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer and flush remaining events
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    let totalEvents = 0;
    for (const events of this.buffer.values()) {
      totalEvents += events.length;
    }

    return {
      partitions: this.buffer.size,
      bufferedEvents: totalEvents,
    };
  }
}

// Singleton instance
export const eventStorage = new EventStorage();
