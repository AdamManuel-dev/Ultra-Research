/**
 * @fileoverview Tests for OpenSearch event indexer
 * @lastmodified 2025-11-05
 */

import { ResearchEvent } from '@deep-research/shared';

import { OpenSearchEventIndexer } from './opensearch-event-indexer';

// Mock OpenSearch client
let mockSearch: jest.Mock;
let mockBulk: jest.Mock;
let mockPutIndexTemplate: jest.Mock;
let mockExistsIndexTemplate: jest.Mock;
let mockClusterHealth: jest.Mock;
let mockInfo: jest.Mock;

jest.mock('@opensearch-project/opensearch', () => {
  mockSearch = jest.fn();
  mockBulk = jest.fn();
  mockPutIndexTemplate = jest.fn();
  mockExistsIndexTemplate = jest.fn();
  mockClusterHealth = jest.fn();
  mockInfo = jest.fn();

  return {
    Client: jest.fn().mockImplementation(() => ({
      search: mockSearch,
      bulk: mockBulk,
      indices: {
        putIndexTemplate: mockPutIndexTemplate,
        existsIndexTemplate: mockExistsIndexTemplate,
      },
      cluster: {
        health: mockClusterHealth,
      },
      info: mockInfo,
    })),
  };
});

jest.mock('../config', () => ({
  config: {
    opensearch: {
      node: 'http://localhost:9200',
      username: 'admin',
      password: 'admin',
    },
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('OpenSearchEventIndexer', () => {
  let indexer: OpenSearchEventIndexer;

  beforeEach(() => {
    jest.clearAllMocks();
    indexer = new OpenSearchEventIndexer();
  });

  afterEach(async () => {
    await indexer.close();
  });

  describe('initializeTemplates()', () => {
    it('should create index template if it does not exist', async () => {
      mockExistsIndexTemplate.mockResolvedValue({ body: false });
      mockPutIndexTemplate.mockResolvedValue({ body: {} });

      await indexer.initializeTemplates();

      expect(mockExistsIndexTemplate).toHaveBeenCalled();
      expect(mockPutIndexTemplate).toHaveBeenCalled();
    });

    it('should not create template if it already exists', async () => {
      mockExistsIndexTemplate.mockResolvedValue({ body: true });

      await indexer.initializeTemplates();

      expect(mockExistsIndexTemplate).toHaveBeenCalled();
      expect(mockPutIndexTemplate).not.toHaveBeenCalled();
    });

    it('should handle errors during template creation', async () => {
      mockExistsIndexTemplate.mockResolvedValue({ body: false });
      mockPutIndexTemplate.mockRejectedValue(new Error('Template creation failed'));

      await expect(indexer.initializeTemplates()).rejects.toThrow('Template creation failed');
    });
  });

  describe('indexEvent()', () => {
    it('should buffer events for bulk indexing', async () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      await indexer.indexEvent(event);

      // Event should be buffered, not immediately indexed
      expect(mockBulk).not.toHaveBeenCalled();
    });

    it('should flush when buffer reaches bulk size', async () => {
      mockBulk.mockResolvedValue({ body: { errors: false } });

      // Index 100 events to trigger bulk flush
      for (let i = 0; i < 100; i++) {
        const event: ResearchEvent = {
          ts: new Date().toISOString(),
          run_id: 'test-run-123',
          step_id: i,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        };
        await indexer.indexEvent(event);
      }

      expect(mockBulk).toHaveBeenCalled();
    });
  });

  describe('flushBulk()', () => {
    it('should bulk index buffered events', async () => {
      mockBulk.mockResolvedValue({ body: { errors: false } });

      // Buffer some events
      for (let i = 0; i < 10; i++) {
        const event: ResearchEvent = {
          ts: new Date().toISOString(),
          run_id: 'test-run-123',
          step_id: i,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        };
        await indexer.indexEvent(event);
      }

      await indexer.flushBulk();

      expect(mockBulk).toHaveBeenCalled();
      const bulkCall = mockBulk.mock.calls[0][0];
      expect(bulkCall.body).toBeDefined();
    });

    it('should handle bulk indexing errors', async () => {
      mockBulk.mockResolvedValue({
        body: {
          errors: true,
          items: [
            {
              index: {
                error: { type: 'mapper_parsing_exception', reason: 'Failed to parse' },
              },
            },
          ],
        },
      });

      // Buffer an event
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };
      await indexer.indexEvent(event);

      // Flush should not throw even with errors
      await expect(indexer.flushBulk()).resolves.not.toThrow();
    });

    it('should do nothing if buffer is empty', async () => {
      await indexer.flushBulk();

      expect(mockBulk).not.toHaveBeenCalled();
    });
  });

  describe('searchEvents()', () => {
    it('should search events with filters', async () => {
      const mockEvents: ResearchEvent[] = [
        {
          ts: new Date().toISOString(),
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
      ];

      mockSearch.mockResolvedValue({
        body: {
          hits: {
            hits: mockEvents.map((e) => ({ _source: e })),
            total: { value: 1 },
          },
        },
      });

      const result = await indexer.searchEvents({
        run_id: 'test-run-123',
        agent: 'orchestrator',
      });

      expect(result.events).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.took_ms).toBeGreaterThanOrEqual(0);
    });

    it('should apply run_id filter', async () => {
      mockSearch.mockResolvedValue({
        body: {
          hits: {
            hits: [],
            total: { value: 0 },
          },
        },
      });

      await indexer.searchEvents({ run_id: 'test-run-123' });

      const searchCall = mockSearch.mock.calls[0][0];
      expect(searchCall.body.query.bool.must).toContainEqual({
        term: { run_id: 'test-run-123' },
      });
    });

    it('should apply agent filter', async () => {
      mockSearch.mockResolvedValue({
        body: {
          hits: {
            hits: [],
            total: { value: 0 },
          },
        },
      });

      await indexer.searchEvents({ agent: 'fetch' });

      const searchCall = mockSearch.mock.calls[0][0];
      expect(searchCall.body.query.bool.must).toContainEqual({
        term: { agent: 'fetch' },
      });
    });

    it('should apply time range filter', async () => {
      mockSearch.mockResolvedValue({
        body: {
          hits: {
            hits: [],
            total: { value: 0 },
          },
        },
      });

      const from = '2025-01-01T00:00:00Z';
      const to = '2025-01-02T00:00:00Z';

      await indexer.searchEvents({ from, to });

      const searchCall = mockSearch.mock.calls[0][0];
      expect(searchCall.body.query.bool.must).toContainEqual({
        range: {
          ts: {
            gte: from,
            lte: to,
          },
        },
      });
    });

    it('should handle pagination', async () => {
      mockSearch.mockResolvedValue({
        body: {
          hits: {
            hits: [],
            total: { value: 0 },
          },
        },
      });

      await indexer.searchEvents({ offset: 10, limit: 50 });

      const searchCall = mockSearch.mock.calls[0][0];
      expect(searchCall.body.from).toBe(10);
      expect(searchCall.body.size).toBe(50);
    });
  });

  describe('aggregateEvents()', () => {
    it('should perform aggregations', async () => {
      mockSearch.mockResolvedValue({
        body: {
          hits: {
            total: { value: 100 },
          },
          aggregations: {
            by_agent: {
              buckets: [
                { key: 'orchestrator', doc_count: 50 },
                { key: 'fetch', doc_count: 50 },
              ],
            },
          },
        },
      });

      const result = await indexer.aggregateEvents(
        { run_id: 'test-run-123' },
        {
          by_agent: {
            terms: {
              field: 'agent',
              size: 10,
            },
          },
        }
      );

      expect(result.aggregations).toBeDefined();
      expect(result.total).toBe(100);
      expect(result.took_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return zero documents', async () => {
      mockSearch.mockResolvedValue({
        body: {
          hits: {
            total: { value: 0 },
          },
          aggregations: {},
        },
      });

      const result = await indexer.aggregateEvents({}, {});

      expect(result.events).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getTimeline()', () => {
    it('should return timeline histogram', async () => {
      mockSearch.mockResolvedValue({
        body: {
          hits: {
            total: { value: 100 },
          },
          aggregations: {
            timeline: {
              buckets: [
                {
                  key_as_string: '2025-01-01T00:00:00Z',
                  doc_count: 50,
                },
              ],
            },
          },
        },
      });

      const result = await indexer.getTimeline('test-run-123', '1h');

      expect(result.aggregations).toBeDefined();
      expect(result.total).toBe(100);
    });
  });

  describe('getAgentActivity()', () => {
    it('should return agent activity summary', async () => {
      mockSearch.mockResolvedValue({
        body: {
          hits: {
            total: { value: 100 },
          },
          aggregations: {
            by_agent: {
              buckets: [
                {
                  key: 'orchestrator',
                  doc_count: 50,
                  by_action: {
                    buckets: [{ key: 'orchestrator.start', doc_count: 25 }],
                  },
                  avg_cost: { value: 0.05 },
                },
              ],
            },
          },
        },
      });

      const result = await indexer.getAgentActivity('test-run-123');

      expect(result.aggregations).toBeDefined();
    });
  });

  describe('healthCheck()', () => {
    it('should return healthy status', async () => {
      mockClusterHealth.mockResolvedValue({
        body: {
          status: 'green',
          cluster_name: 'test-cluster',
        },
      });

      mockInfo.mockResolvedValue({
        body: {
          version: {
            number: '2.11.0',
          },
        },
      });

      const result = await indexer.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.cluster).toBe('test-cluster');
      expect(result.version).toBe('2.11.0');
    });

    it('should return unhealthy status when cluster is red', async () => {
      mockClusterHealth.mockResolvedValue({
        body: {
          status: 'red',
          cluster_name: 'test-cluster',
        },
      });

      mockInfo.mockResolvedValue({
        body: {
          version: {
            number: '2.11.0',
          },
        },
      });

      const result = await indexer.healthCheck();

      expect(result.healthy).toBe(false);
    });

    it('should handle connection errors', async () => {
      mockClusterHealth.mockRejectedValue(new Error('Connection refused'));

      const result = await indexer.healthCheck();

      expect(result.healthy).toBe(false);
    });
  });
});
