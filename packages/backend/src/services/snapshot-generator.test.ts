/**
 * @fileoverview Tests for snapshot generator
 * @lastmodified 2025-11-05
 */

import { ResearchEvent } from '@deep-research/shared';

import { SnapshotGenerator } from './snapshot-generator';

// Mock OpenSearch indexer
const mockSearchEvents = jest.fn();

jest.mock('./opensearch-event-indexer', () => ({
  opensearchEventIndexer: {
    searchEvents: mockSearchEvents,
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('SnapshotGenerator', () => {
  let generator: SnapshotGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new SnapshotGenerator();
  });

  describe('generateSnapshot()', () => {
    it('should generate snapshot with all events up to timestamp', async () => {
      const mockEvents: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
        {
          ts: '2025-01-01T00:01:00Z',
          run_id: 'test-run-123',
          step_id: 2,
          agent: 'fetch',
          action: 'fetch.complete',
          cost: { usd: 0.01 },
        },
      ];

      mockSearchEvents.mockResolvedValue({
        events: mockEvents,
        total: 2,
        took_ms: 10,
      });

      const snapshot = await generator.generateSnapshot({
        run_id: 'test-run-123',
        timestamp: '2025-01-01T00:02:00Z',
      });

      expect(snapshot.run_id).toBe('test-run-123');
      expect(snapshot.events).toHaveLength(2);
      expect(snapshot.metadata.event_count).toBe(2);
      expect(snapshot.metadata.agents).toContain('orchestrator');
      expect(snapshot.metadata.agents).toContain('fetch');
    });

    it('should filter events by step_id', async () => {
      const mockEvents: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
        {
          ts: '2025-01-01T00:01:00Z',
          run_id: 'test-run-123',
          step_id: 2,
          agent: 'fetch',
          action: 'fetch.complete',
        },
        {
          ts: '2025-01-01T00:02:00Z',
          run_id: 'test-run-123',
          step_id: 3,
          agent: 'index',
          action: 'index.write',
        },
      ];

      mockSearchEvents.mockResolvedValue({
        events: mockEvents,
        total: 3,
        took_ms: 10,
      });

      const snapshot = await generator.generateSnapshot({
        run_id: 'test-run-123',
        step_id: 2,
      });

      expect(snapshot.events).toHaveLength(2);
      expect(snapshot.step_id).toBe(2);
      expect(snapshot.events.every((e) => e.step_id <= 2)).toBe(true);
    });

    it('should calculate total cost', async () => {
      const mockEvents: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
          cost: { usd: 0.01 },
        },
        {
          ts: '2025-01-01T00:01:00Z',
          run_id: 'test-run-123',
          step_id: 2,
          agent: 'fetch',
          action: 'fetch.complete',
          cost: { usd: 0.02 },
        },
      ];

      mockSearchEvents.mockResolvedValue({
        events: mockEvents,
        total: 2,
        took_ms: 10,
      });

      const snapshot = await generator.generateSnapshot({
        run_id: 'test-run-123',
      });

      expect(snapshot.metadata.total_cost_usd).toBe(0.03);
    });

    it('should collect unique agents and actions', async () => {
      const mockEvents: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
        {
          ts: '2025-01-01T00:01:00Z',
          run_id: 'test-run-123',
          step_id: 2,
          agent: 'orchestrator',
          action: 'orchestrator.plan',
        },
        {
          ts: '2025-01-01T00:02:00Z',
          run_id: 'test-run-123',
          step_id: 3,
          agent: 'fetch',
          action: 'fetch.complete',
        },
      ];

      mockSearchEvents.mockResolvedValue({
        events: mockEvents,
        total: 3,
        took_ms: 10,
      });

      const snapshot = await generator.generateSnapshot({
        run_id: 'test-run-123',
      });

      expect(snapshot.metadata.agents).toEqual(['orchestrator', 'fetch']);
      expect(snapshot.metadata.actions).toContain('orchestrator.start');
      expect(snapshot.metadata.actions).toContain('orchestrator.plan');
      expect(snapshot.metadata.actions).toContain('fetch.complete');
    });

    it('should handle empty event list', async () => {
      mockSearchEvents.mockResolvedValue({
        events: [],
        total: 0,
        took_ms: 5,
      });

      const snapshot = await generator.generateSnapshot({
        run_id: 'nonexistent-run',
      });

      expect(snapshot.events).toHaveLength(0);
      expect(snapshot.metadata.event_count).toBe(0);
      expect(snapshot.step_id).toBe(0);
    });
  });

  describe('replayToSnapshot()', () => {
    it('should replay events through reducer', async () => {
      const mockEvents: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
        {
          ts: '2025-01-01T00:01:00Z',
          run_id: 'test-run-123',
          step_id: 2,
          agent: 'fetch',
          action: 'fetch.complete',
        },
      ];

      mockSearchEvents.mockResolvedValue({
        events: mockEvents,
        total: 2,
        took_ms: 10,
      });

      interface State {
        count: number;
        actions: string[];
      }

      const reducer = (state: unknown, event: ResearchEvent): unknown => {
        const s = state as State;
        return {
          count: s.count + 1,
          actions: [...s.actions, event.action],
        };
      };

      const initialState: State = { count: 0, actions: [] };

      const result = await generator.replayToSnapshot('test-run-123-snapshot', reducer, initialState);

      expect((result.state as State).count).toBe(2);
      expect((result.state as State).actions).toEqual(['orchestrator.start', 'fetch.complete']);
      expect(result.events).toHaveLength(2);
    });
  });

  describe('getSnapshotAtStep()', () => {
    it('should get snapshot at specific step', async () => {
      const mockEvents: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
        {
          ts: '2025-01-01T00:01:00Z',
          run_id: 'test-run-123',
          step_id: 2,
          agent: 'fetch',
          action: 'fetch.complete',
        },
      ];

      mockSearchEvents.mockResolvedValue({
        events: mockEvents,
        total: 2,
        took_ms: 10,
      });

      const snapshot = await generator.getSnapshotAtStep('test-run-123', 1);

      expect(snapshot.events).toHaveLength(1);
      expect(snapshot.step_id).toBe(1);
    });
  });

  describe('getLatestSnapshot()', () => {
    it('should get latest snapshot for run', async () => {
      const mockEvents: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
      ];

      mockSearchEvents.mockResolvedValue({
        events: mockEvents,
        total: 1,
        took_ms: 10,
      });

      const snapshot = await generator.getLatestSnapshot('test-run-123');

      expect(snapshot.run_id).toBe('test-run-123');
      expect(snapshot.events).toHaveLength(1);
    });
  });

  describe('getSnapshotDiff()', () => {
    it('should calculate diff between two steps', async () => {
      const mockEvents: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
          cost: { usd: 0.01 },
        },
        {
          ts: '2025-01-01T00:01:00Z',
          run_id: 'test-run-123',
          step_id: 2,
          agent: 'fetch',
          action: 'fetch.complete',
          cost: { usd: 0.02 },
        },
        {
          ts: '2025-01-01T00:02:00Z',
          run_id: 'test-run-123',
          step_id: 3,
          agent: 'index',
          action: 'index.write',
          cost: { usd: 0.03 },
        },
      ];

      mockSearchEvents.mockResolvedValue({
        events: mockEvents,
        total: 3,
        took_ms: 10,
      });

      const diff = await generator.getSnapshotDiff('test-run-123', 1, 3);

      expect(diff.from_step).toBe(1);
      expect(diff.to_step).toBe(3);
      expect(diff.added_events).toHaveLength(2); // Steps 2 and 3
      expect(diff.metadata.event_count).toBe(2);
      expect(diff.metadata.cost_delta_usd).toBe(0.05); // 0.02 + 0.03
    });

    it('should handle no new events in diff', async () => {
      mockSearchEvents.mockResolvedValue({
        events: [],
        total: 0,
        took_ms: 5,
      });

      const diff = await generator.getSnapshotDiff('test-run-123', 5, 5);

      expect(diff.added_events).toHaveLength(0);
      expect(diff.metadata.cost_delta_usd).toBe(0);
    });
  });

  describe('buildStateSummary()', () => {
    it('should build comprehensive state summary', () => {
      const events: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
          cost: { usd: 0.01 },
        },
        {
          ts: '2025-01-01T00:01:00Z',
          run_id: 'test-run-123',
          step_id: 2,
          agent: 'orchestrator',
          action: 'orchestrator.plan',
          cost: { usd: 0.02 },
        },
        {
          ts: '2025-01-01T00:02:00Z',
          run_id: 'test-run-123',
          step_id: 3,
          agent: 'fetch',
          action: 'fetch.complete',
          cost: { usd: 0.05 },
        },
      ];

      const summary = generator.buildStateSummary(events);

      expect(summary.agents['orchestrator']).toBe(2);
      expect(summary.agents['fetch']).toBe(1);
      expect(summary.actions['orchestrator.start']).toBe(1);
      expect(summary.actions['orchestrator.plan']).toBe(1);
      expect(summary.timeline).toHaveLength(3);
      expect(summary.costs.total).toBe(0.08);
      expect(summary.costs.by_agent['orchestrator']).toBe(0.03);
      expect(summary.costs.by_agent['fetch']).toBe(0.05);
    });

    it('should handle events without cost', () => {
      const events: ResearchEvent[] = [
        {
          ts: '2025-01-01T00:00:00Z',
          run_id: 'test-run-123',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
      ];

      const summary = generator.buildStateSummary(events);

      expect(summary.costs.total).toBe(0);
    });

    it('should handle empty event list', () => {
      const summary = generator.buildStateSummary([]);

      expect(summary.agents).toEqual({});
      expect(summary.actions).toEqual({});
      expect(summary.timeline).toHaveLength(0);
      expect(summary.costs.total).toBe(0);
    });
  });
});
