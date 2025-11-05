/**
 * @fileoverview Tests for event producer utilities
 * @lastmodified 2025-11-05
 */

import {
  createOrchestratorStartEvent,
  createOrchestratorCommandEvent,
  createOrchestratorPlanEvent,
  createFrontierUpdateEvent,
  createTaskScheduledEvent,
  createOrchestratorCompleteEvent,
  createFetchStartEvent,
  createFetchCompleteEvent,
  createFetchErrorEvent,
  createFetchCachedEvent,
  createExtractStartEvent,
  createExtractCompleteEvent,
  createExtractErrorEvent,
  createIndexWriteEvent,
  createIndexQueryEvent,
  createIndexUpdateEvent,
  createGraphMergeEvent,
  createGraphQueryEvent,
  createGraphUpdateEvent,
  createSynthesisStartEvent,
  createSynthesisCompleteEvent,
  createSynthesisErrorEvent,
  createSystemHealthEvent,
  createSystemErrorEvent,
  resetRun,
  getCurrentStep,
} from './event-producers';

jest.mock('../services/event-bus', () => ({
  eventBus: {
    publish: jest.fn(),
  },
}));

describe('Event Producers', () => {
  const runId = 'test-run-123';

  beforeEach(() => {
    resetRun(runId);
  });

  describe('Orchestrator Events', () => {
    it('should create orchestrator start event', () => {
      const event = createOrchestratorStartEvent(runId, {
        query: 'What is AI?',
        options: { depth: 'high' },
      });

      expect(event.agent).toBe('orchestrator');
      expect(event.action).toBe('orchestrator.start');
      expect(event.run_id).toBe(runId);
      expect(event.step_id).toBe(1);
      expect(event.input).toEqual({ query: 'What is AI?', options: { depth: 'high' } });
    });

    it('should create orchestrator command event', () => {
      const event = createOrchestratorCommandEvent(runId, {
        command: 'pause',
        params: { reason: 'user_request' },
      });

      expect(event.agent).toBe('orchestrator');
      expect(event.action).toBe('orchestrator.command');
      expect(event.input).toEqual({ command: 'pause', params: { reason: 'user_request' } });
    });

    it('should create orchestrator plan event', () => {
      const event = createOrchestratorPlanEvent(
        runId,
        {
          tasks: [
            { task_id: 'task-1', type: 'fetch', priority: 1 },
            { task_id: 'task-2', type: 'index', priority: 2 },
          ],
          strategy: 'breadth_first',
        },
        { reason: 'High priority tasks', score: 0.9 }
      );

      expect(event.agent).toBe('orchestrator');
      expect(event.action).toBe('orchestrator.plan');
      expect(event.output?.tasks).toHaveLength(2);
      expect(event.decision?.reason).toBe('High priority tasks');
    });

    it('should create frontier update event', () => {
      const event = createFrontierUpdateEvent(runId, {
        added: [{ url: 'https://example.com', score: 0.9, reason: 'High relevance' }],
        removed: [{ url: 'https://old.com', reason: 'Low score' }],
        total_items: 10,
      });

      expect(event.agent).toBe('orchestrator');
      expect(event.action).toBe('orchestrator.frontier.update');
      expect(event.output?.added).toHaveLength(1);
      expect(event.output?.removed).toHaveLength(1);
    });

    it('should create task scheduled event', () => {
      const event = createTaskScheduledEvent(runId, {
        task_id: 'task-123',
        task_type: 'fetch',
        scheduled_at: new Date().toISOString(),
      });

      expect(event.agent).toBe('orchestrator');
      expect(event.action).toBe('orchestrator.task.scheduled');
    });

    it('should create orchestrator complete event', () => {
      const event = createOrchestratorCompleteEvent(
        runId,
        {
          status: 'success',
          total_steps: 50,
          duration_ms: 30000,
        },
        { usd: 1.5, tokens: { input: 10000, output: 5000 } }
      );

      expect(event.agent).toBe('orchestrator');
      expect(event.action).toBe('orchestrator.complete');
      expect(event.cost?.usd).toBe(1.5);
    });
  });

  describe('Fetch Events', () => {
    it('should create fetch start event', () => {
      const event = createFetchStartEvent(
        runId,
        { url: 'https://example.com', method: 'GET' },
        { type: 'url', value: 'https://example.com' }
      );

      expect(event.agent).toBe('fetch');
      expect(event.action).toBe('fetch.start');
      expect(event.source?.type).toBe('url');
    });

    it('should create fetch complete event', () => {
      const event = createFetchCompleteEvent(
        runId,
        { url: 'https://example.com' },
        {
          status_code: 200,
          content_length: 1024,
          content_type: 'text/html',
          duration_ms: 250,
        },
        { urls: ['https://example.com/page1'], document_ids: ['doc-123'] }
      );

      expect(event.agent).toBe('fetch');
      expect(event.action).toBe('fetch.complete');
      expect(event.output?.status_code).toBe(200);
      expect(event.artifacts?.document_ids).toContain('doc-123');
    });

    it('should create fetch error event', () => {
      const event = createFetchErrorEvent(runId, { url: 'https://example.com' }, {
        message: 'Connection timeout',
        code: 'ETIMEDOUT',
        stack: 'Error stack trace',
      });

      expect(event.agent).toBe('fetch');
      expect(event.action).toBe('fetch.error');
      expect(event.error?.code).toBe('ETIMEDOUT');
    });

    it('should create fetch cached event', () => {
      const event = createFetchCachedEvent(runId, { url: 'https://example.com' }, {
        cache_hit: true,
        cache_age_ms: 3600000,
      });

      expect(event.agent).toBe('fetch');
      expect(event.action).toBe('fetch.cached');
      expect(event.output?.cache_hit).toBe(true);
    });
  });

  describe('Extraction Events', () => {
    it('should create extract start event', () => {
      const event = createExtractStartEvent(
        runId,
        { url: 'https://example.com', html_size: 50000 },
        { type: 'url', value: 'https://example.com' }
      );

      expect(event.agent).toBe('extract');
      expect(event.action).toBe('extract.start');
    });

    it('should create extract complete event', () => {
      const event = createExtractCompleteEvent(
        runId,
        { url: 'https://example.com' },
        {
          text_length: 10000,
          markdown_length: 8000,
          extraction_method: 'trafilatura',
          duration_ms: 150,
        },
        { document_ids: ['doc-123'], file_paths: ['/path/to/extracted.md'] }
      );

      expect(event.agent).toBe('extract');
      expect(event.action).toBe('extract.complete');
      expect(event.output?.extraction_method).toBe('trafilatura');
    });

    it('should create extract error event', () => {
      const event = createExtractErrorEvent(runId, { url: 'https://example.com' }, {
        message: 'Failed to extract content',
        code: 'EXTRACTION_ERROR',
      });

      expect(event.agent).toBe('extract');
      expect(event.action).toBe('extract.error');
    });
  });

  describe('Indexing Events', () => {
    it('should create index write event', () => {
      const event = createIndexWriteEvent(
        runId,
        { document_id: 'doc-123', content_length: 10000 },
        {
          indexed: true,
          chunks: 5,
          duration_ms: 200,
        },
        { document_ids: ['doc-123'] }
      );

      expect(event.agent).toBe('index');
      expect(event.action).toBe('index.write');
      expect(event.output?.chunks).toBe(5);
    });

    it('should create index query event', () => {
      const event = createIndexQueryEvent(
        runId,
        { query: 'artificial intelligence', limit: 10 },
        {
          results: 10,
          top_score: 0.95,
          duration_ms: 50,
        },
        100
      );

      expect(event.agent).toBe('index');
      expect(event.action).toBe('index.query');
      expect(event.cost?.compute_ms).toBe(100);
    });

    it('should create index update event', () => {
      const event = createIndexUpdateEvent(
        runId,
        { document_id: 'doc-123', updates: { field: 'value' } },
        {
          updated: true,
          duration_ms: 75,
        }
      );

      expect(event.agent).toBe('index');
      expect(event.action).toBe('index.update');
    });
  });

  describe('Graph Events', () => {
    it('should create graph merge event', () => {
      const event = createGraphMergeEvent(
        runId,
        {
          source_id: 'doc-123',
          entities: 10,
          relations: 15,
        },
        {
          nodes_created: 8,
          edges_created: 12,
          nodes_updated: 2,
          edges_updated: 3,
          duration_ms: 300,
        },
        { node_ids: ['node-1', 'node-2'], edge_ids: ['edge-1', 'edge-2'] }
      );

      expect(event.agent).toBe('graph');
      expect(event.action).toBe('graph.merge');
      expect(event.output?.nodes_created).toBe(8);
    });

    it('should create graph query event', () => {
      const event = createGraphQueryEvent(
        runId,
        { query: 'MATCH (n) RETURN n', params: { limit: 10 } },
        {
          nodes: 5,
          edges: 8,
          duration_ms: 100,
        }
      );

      expect(event.agent).toBe('graph');
      expect(event.action).toBe('graph.query');
    });

    it('should create graph update event', () => {
      const event = createGraphUpdateEvent(
        runId,
        { node_id: 'node-123', updates: { property: 'new_value' } },
        {
          updated: true,
          duration_ms: 50,
        }
      );

      expect(event.agent).toBe('graph');
      expect(event.action).toBe('graph.update');
    });
  });

  describe('Synthesis Events', () => {
    it('should create synthesis start event', () => {
      const event = createSynthesisStartEvent(runId, {
        query: 'Summarize findings',
        document_count: 20,
        synthesis_type: 'summary',
      });

      expect(event.agent).toBe('synthesis');
      expect(event.action).toBe('synthesis.start');
    });

    it('should create synthesis complete event', () => {
      const event = createSynthesisCompleteEvent(
        runId,
        { query: 'Summarize findings' },
        {
          result_length: 5000,
          sources_cited: 15,
          duration_ms: 2000,
        },
        { usd: 0.5, tokens: { input: 5000, output: 1000 } },
        { file_paths: ['/path/to/synthesis.md'] }
      );

      expect(event.agent).toBe('synthesis');
      expect(event.action).toBe('synthesis.complete');
      expect(event.cost?.usd).toBe(0.5);
    });

    it('should create synthesis error event', () => {
      const event = createSynthesisErrorEvent(runId, { query: 'Summarize findings' }, {
        message: 'Token limit exceeded',
        code: 'TOKEN_LIMIT',
      });

      expect(event.agent).toBe('synthesis');
      expect(event.action).toBe('synthesis.error');
    });
  });

  describe('System Events', () => {
    it('should create system health event', () => {
      const event = createSystemHealthEvent(runId, {
        status: 'healthy',
        components: {
          opensearch: { healthy: true, latency_ms: 10 },
          neo4j: { healthy: true, latency_ms: 15 },
        },
      });

      expect(event.agent).toBe('system');
      expect(event.action).toBe('system.health');
    });

    it('should create system error event', () => {
      const event = createSystemErrorEvent(
        runId,
        {
          message: 'Critical system error',
          code: 'SYSTEM_ERROR',
          stack: 'Error stack',
        },
        { component: 'event-bus' }
      );

      expect(event.agent).toBe('system');
      expect(event.action).toBe('system.error');
      expect(event.metadata?.component).toBe('event-bus');
    });
  });

  describe('Step ID Management', () => {
    it('should increment step IDs for same run', () => {
      const event1 = createOrchestratorStartEvent(runId, { query: 'test' });
      const event2 = createFetchStartEvent(runId, { url: 'https://example.com' }, {
        type: 'url',
        value: 'https://example.com',
      });
      const event3 = createIndexWriteEvent(
        runId,
        { document_id: 'doc-1', content_length: 1000 },
        { indexed: true, chunks: 1, duration_ms: 10 }
      );

      expect(event1.step_id).toBe(1);
      expect(event2.step_id).toBe(2);
      expect(event3.step_id).toBe(3);
    });

    it('should maintain separate step counters for different runs', () => {
      const run1 = 'run-1';
      const run2 = 'run-2';

      resetRun(run1);
      resetRun(run2);

      const event1 = createOrchestratorStartEvent(run1, { query: 'test1' });
      const event2 = createOrchestratorStartEvent(run2, { query: 'test2' });
      const event3 = createOrchestratorStartEvent(run1, { query: 'test3' });

      expect(event1.step_id).toBe(1);
      expect(event2.step_id).toBe(1);
      expect(event3.step_id).toBe(2);
    });

    it('should reset step counter for a run', () => {
      createOrchestratorStartEvent(runId, { query: 'test1' });
      createOrchestratorStartEvent(runId, { query: 'test2' });

      expect(getCurrentStep(runId)).toBe(2);

      resetRun(runId);

      const newEvent = createOrchestratorStartEvent(runId, { query: 'test3' });
      expect(newEvent.step_id).toBe(1);
    });
  });

  describe('Event Timestamps', () => {
    it('should generate valid ISO timestamps', () => {
      const event = createOrchestratorStartEvent(runId, { query: 'test' });

      expect(event.ts).toBeTruthy();
      expect(() => new Date(event.ts)).not.toThrow();

      const date = new Date(event.ts);
      expect(date.toISOString()).toBe(event.ts);
    });
  });
});
