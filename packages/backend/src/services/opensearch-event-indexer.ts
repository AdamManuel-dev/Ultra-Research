/**
 * @fileoverview OpenSearch event indexer for fast event queries and analytics
 * @lastmodified 2025-10-28
 *
 * Features: Event indexing with sub-500ms queries, aggregations, full-text search
 * Main APIs: indexEvent(), searchEvents(), aggregateEvents()
 * Constraints: ≤500ms query latency, supports complex filters and aggregations
 * Patterns: Bulk indexing for performance, index templates, time-series optimization
 */

import { ResearchEvent, EventQuery } from '@deep-research/shared';
import { Client } from '@opensearch-project/opensearch';

import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * OpenSearch event search result
 */
export interface EventSearchResult {
  events: ResearchEvent[];
  total: number;
  took_ms: number;
  aggregations?: Record<string, unknown>;
}

/**
 * OpenSearch event indexer with optimized queries
 */
export class OpenSearchEventIndexer {
  private client: Client;

  private readonly indexPrefix = 'research-events';

  private bulkBuffer: ResearchEvent[] = [];

  private readonly bulkSize = 100;

  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.client = new Client({
      node: config.opensearch.node,
      auth: {
        username: config.opensearch.username,
        password: config.opensearch.password,
      },
      ssl: {
        rejectUnauthorized: false, // For local development
      },
    });

    this.startFlushTimer();
  }

  /**
   * Initialize index templates for time-series data
   */
  async initializeTemplates(): Promise<void> {
    try {
      const templateName = `${this.indexPrefix}-template`;

      const templateExists = await this.client.indices.existsIndexTemplate({
        name: templateName,
      });

      if (!templateExists.body) {
        await this.client.indices.putIndexTemplate({
          name: templateName,
          body: {
            index_patterns: [`${this.indexPrefix}-*`],
            template: {
              settings: {
                number_of_shards: 1,
                number_of_replicas: 0, // Single node for development
                refresh_interval: '5s',
              },
              mappings: {
                properties: {
                  ts: { type: 'date' },
                  run_id: { type: 'keyword' },
                  step_id: { type: 'integer' },
                  agent: { type: 'keyword' },
                  action: { type: 'keyword' },
                  input: { type: 'object', enabled: true },
                  output: { type: 'object', enabled: true },
                  'artifacts.urls': { type: 'keyword' },
                  'artifacts.document_ids': { type: 'keyword' },
                  'artifacts.node_ids': { type: 'keyword' },
                  'artifacts.edge_ids': { type: 'keyword' },
                  'artifacts.file_paths': { type: 'keyword' },
                  'source.type': { type: 'keyword' },
                  'source.value': { type: 'text' },
                  'cost.usd': { type: 'float' },
                  'cost.tokens.input': { type: 'integer' },
                  'cost.tokens.output': { type: 'integer' },
                  'cost.compute_ms': { type: 'integer' },
                  'decision.reason': { type: 'text' },
                  'decision.score': { type: 'float' },
                  'error.message': { type: 'text' },
                  'error.code': { type: 'keyword' },
                  metadata: { type: 'object', enabled: true },
                },
              },
            },
          },
        });

        logger.info('OpenSearch index template created', {
          metadata: { template: templateName },
        });
      }
    } catch (error) {
      logger.error('Failed to initialize OpenSearch templates', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  /**
   * Get index name for a date (daily indices for time-series data)
   */
  private getIndexName(date?: Date): string {
    const d = date || new Date();
    const dateStr = d.toISOString().split('T')[0];
    return `${this.indexPrefix}-${dateStr}`;
  }

  /**
   * Index a single event (buffered for bulk operations)
   */
  async indexEvent(event: ResearchEvent): Promise<void> {
    this.bulkBuffer.push(event);

    if (this.bulkBuffer.length >= this.bulkSize) {
      await this.flushBulk();
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.bulkBuffer.length > 0) {
        this.flushBulk().catch((error) => {
          logger.error('Bulk flush error', {
            metadata: {
              error: error instanceof Error ? error.message : String(error),
            },
          });
        });
      }
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Flush buffered events using bulk API
   */
  async flushBulk(): Promise<void> {
    if (this.bulkBuffer.length === 0) return;

    const events = [...this.bulkBuffer];
    this.bulkBuffer = [];

    const body = events.flatMap((event) => {
      const index = this.getIndexName(new Date(event.ts));
      return [{ index: { _index: index, _id: `${event.run_id}-${event.step_id}` } }, event];
    });

    try {
      const startTime = Date.now();

      const response = await this.client.bulk({
        body,
        refresh: false, // Async refresh for better performance
      });

      const took = Date.now() - startTime;

      if (response.body['errors']) {
        logger.error('Bulk indexing had errors', {
          metadata: {
            errors: response.body['items']
              .filter((item: { index?: { error?: unknown } }) => item.index?.error)
              .map((item: { index?: { error?: unknown } }) => item.index?.error),
          },
        });
      } else {
        logger.info('Events bulk indexed', {
          metadata: {
            count: events.length,
            took_ms: took,
          },
        });
      }
    } catch (error) {
      logger.error('Bulk indexing failed', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          event_count: events.length,
        },
      });
      throw error;
    }
  }

  /**
   * Search events with filters and aggregations
   */
  async searchEvents(query: EventQuery): Promise<EventSearchResult> {
    const startTime = Date.now();

    try {
      const must: unknown[] = [];

      // Build query filters
      if (query.run_id) {
        must.push({ term: { run_id: query.run_id } });
      }

      if (query.agent) {
        must.push({ term: { agent: query.agent } });
      }

      if (query.action) {
        must.push({ term: { action: query.action } });
      }

      if (query.from || query.to) {
        must.push({
          range: {
            ts: {
              gte: query.from,
              lte: query.to,
            },
          },
        });
      }

      const searchBody = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
          },
        },
        sort: [{ ts: { order: 'asc' } }],
        from: query.offset || 0,
        size: query.limit || 100,
      };

      const response = await this.client.search({
        index: `${this.indexPrefix}-*`,
        body: searchBody,
      });

      const took = Date.now() - startTime;

      const events = response.body['hits'].hits.map(
        (hit: { _source: ResearchEvent }) => hit._source
      );

      logger.info('Events searched', {
        metadata: {
          query,
          result_count: events.length,
          total: response.body['hits'].total.value,
          took_ms: took,
        },
      });

      return {
        events,
        total: response.body['hits'].total.value,
        took_ms: took,
      };
    } catch (error) {
      logger.error('Event search failed', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          query,
        },
      });
      throw error;
    }
  }

  /**
   * Aggregate events for analytics
   */
  async aggregateEvents(
    query: EventQuery,
    aggregations: Record<string, unknown>
  ): Promise<EventSearchResult> {
    const startTime = Date.now();

    try {
      const must: unknown[] = [];

      if (query.run_id) {
        must.push({ term: { run_id: query.run_id } });
      }

      if (query.agent) {
        must.push({ term: { agent: query.agent } });
      }

      if (query.from || query.to) {
        must.push({
          range: {
            ts: {
              gte: query.from,
              lte: query.to,
            },
          },
        });
      }

      const searchBody = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
          },
        },
        aggs: aggregations,
        size: 0, // Only return aggregations, not documents
      };

      const response = await this.client.search({
        index: `${this.indexPrefix}-*`,
        body: searchBody,
      });

      const took = Date.now() - startTime;

      logger.info('Events aggregated', {
        metadata: {
          query,
          aggregations: Object.keys(aggregations),
          took_ms: took,
        },
      });

      return {
        events: [],
        total: response.body['hits'].total.value,
        took_ms: took,
        aggregations: response.body['aggregations'],
      };
    } catch (error) {
      logger.error('Event aggregation failed', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          query,
        },
      });
      throw error;
    }
  }

  /**
   * Get event timeline histogram
   */
  async getTimeline(runId: string, interval: string = '1h'): Promise<EventSearchResult> {
    return this.aggregateEvents(
      { run_id: runId },
      {
        timeline: {
          date_histogram: {
            field: 'ts',
            fixed_interval: interval,
          },
          aggs: {
            by_action: {
              terms: {
                field: 'action',
                size: 50,
              },
            },
          },
        },
        total_cost: {
          sum: {
            field: 'cost.usd',
          },
        },
        total_tokens: {
          sum: {
            field: 'cost.tokens.input',
          },
        },
      }
    );
  }

  /**
   * Get agent activity summary
   */
  async getAgentActivity(runId?: string): Promise<EventSearchResult> {
    return this.aggregateEvents(
      { run_id: runId },
      {
        by_agent: {
          terms: {
            field: 'agent',
            size: 20,
          },
          aggs: {
            by_action: {
              terms: {
                field: 'action',
                size: 50,
              },
            },
            avg_cost: {
              avg: {
                field: 'cost.usd',
              },
            },
          },
        },
      }
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; cluster?: string; version?: string }> {
    try {
      const health = await this.client.cluster.health();
      const info = await this.client.info();

      return {
        healthy: health.body['status'] !== 'red',
        cluster: health.body['cluster_name'],
        version: info.body['version'].number,
      };
    } catch (error) {
      logger.error('OpenSearch health check failed', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return { healthy: false };
    }
  }

  /**
   * Cleanup (stop timers)
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushBulk();
  }
}

// Singleton instance
export const opensearchEventIndexer = new OpenSearchEventIndexer();
