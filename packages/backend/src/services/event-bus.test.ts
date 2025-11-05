/**
 * @fileoverview Tests for EventBus with SSE streaming
 * @lastmodified 2025-11-05
 */

import { ResearchEvent } from '@deep-research/shared';
import { Response } from 'express';

import { EventBus } from './event-bus';

// Mock dependencies
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('./opensearch-event-indexer', () => ({
  opensearchEventIndexer: {
    indexEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    jest.clearAllMocks();
  });

  afterEach(() => {
    eventBus.clearHistory();
  });

  describe('publish()', () => {
    it('should publish a valid event', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      expect(() => eventBus.publish(event)).not.toThrow();
    });

    it('should add event to history', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      eventBus.publish(event);

      const history = eventBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(event);
    });

    it('should reject invalid event', () => {
      const invalidEvent = {
        run_id: 'test-run-123',
        // Missing required fields
      } as ResearchEvent;

      expect(() => eventBus.publish(invalidEvent)).toThrow();
    });

    it('should maintain history up to max size', () => {
      // Publish more than maxHistorySize events
      for (let i = 0; i < 1100; i++) {
        const event: ResearchEvent = {
          ts: new Date().toISOString(),
          run_id: 'test-run-123',
          step_id: i,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        };
        eventBus.publish(event);
      }

      const history = eventBus.getHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('subscribe()', () => {
    it('should subscribe to events', (done) => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      eventBus.subscribe('test-sub', (receivedEvent) => {
        expect(receivedEvent).toEqual(event);
        done();
      });

      eventBus.publish(event);
    });

    it('should filter events by run_id', (done) => {
      const event1: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'run-1',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      const event2: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'run-2',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      let receivedCount = 0;

      eventBus.subscribe(
        'test-sub',
        (receivedEvent) => {
          receivedCount++;
          expect(receivedEvent.run_id).toBe('run-1');

          if (receivedCount === 1) {
            done();
          }
        },
        'run-1'
      );

      eventBus.publish(event1);
      eventBus.publish(event2);

      // Give some time for events to be processed
      setTimeout(() => {
        expect(receivedCount).toBe(1);
      }, 100);
    });

    it('should return unsubscribe function', () => {
      let callCount = 0;

      const unsubscribe = eventBus.subscribe('test-sub', () => {
        callCount++;
      });

      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      eventBus.publish(event);
      expect(callCount).toBe(1);

      unsubscribe();

      eventBus.publish(event);
      expect(callCount).toBe(1); // Should not increment after unsubscribe
    });

    it('should handle multiple subscribers', () => {
      let sub1Count = 0;
      let sub2Count = 0;

      eventBus.subscribe('sub-1', () => {
        sub1Count++;
      });

      eventBus.subscribe('sub-2', () => {
        sub2Count++;
      });

      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      eventBus.publish(event);

      expect(sub1Count).toBe(1);
      expect(sub2Count).toBe(1);
    });

    it('should handle subscriber callback errors gracefully', () => {
      eventBus.subscribe('error-sub', () => {
        throw new Error('Subscriber error');
      });

      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      // Should not throw
      expect(() => eventBus.publish(event)).not.toThrow();
    });
  });

  describe('getHistory()', () => {
    it('should return all events when no filter', () => {
      const events: ResearchEvent[] = [
        {
          ts: new Date().toISOString(),
          run_id: 'run-1',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
        {
          ts: new Date().toISOString(),
          run_id: 'run-2',
          step_id: 1,
          agent: 'fetch',
          action: 'fetch.start',
        },
      ];

      events.forEach((e) => eventBus.publish(e));

      const history = eventBus.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should filter history by run_id', () => {
      const events: ResearchEvent[] = [
        {
          ts: new Date().toISOString(),
          run_id: 'run-1',
          step_id: 1,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        },
        {
          ts: new Date().toISOString(),
          run_id: 'run-2',
          step_id: 1,
          agent: 'fetch',
          action: 'fetch.start',
        },
        {
          ts: new Date().toISOString(),
          run_id: 'run-1',
          step_id: 2,
          agent: 'index',
          action: 'index.write',
        },
      ];

      events.forEach((e) => eventBus.publish(e));

      const history = eventBus.getHistory('run-1');
      expect(history).toHaveLength(2);
      expect(history.every((e) => e.run_id === 'run-1')).toBe(true);
    });

    it('should limit history results', () => {
      for (let i = 0; i < 10; i++) {
        const event: ResearchEvent = {
          ts: new Date().toISOString(),
          run_id: 'test-run',
          step_id: i,
          agent: 'orchestrator',
          action: 'orchestrator.start',
        };
        eventBus.publish(event);
      }

      const history = eventBus.getHistory(undefined, 5);
      expect(history).toHaveLength(5);
    });
  });

  describe('getStats()', () => {
    it('should return correct statistics', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      eventBus.publish(event);
      eventBus.subscribe('sub-1', () => {});
      eventBus.subscribe('sub-2', () => {});

      const stats = eventBus.getStats();

      expect(stats.historySize).toBeGreaterThan(0);
      expect(stats.subscribers).toBe(2);
      expect(stats.sseClients).toBe(0);
    });
  });

  describe('clearHistory()', () => {
    it('should clear all event history', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      eventBus.publish(event);
      expect(eventBus.getHistory()).toHaveLength(1);

      eventBus.clearHistory();
      expect(eventBus.getHistory()).toHaveLength(0);
    });
  });

  describe('streamSSE()', () => {
    it('should set correct SSE headers', () => {
      const mockReq = {
        on: jest.fn(),
      } as any;

      const mockRes = {
        setHeader: jest.fn(),
        write: jest.fn(),
        writableEnded: false,
      } as unknown as Response;

      eventBus.streamSSE(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
    });

    it('should send initial heartbeat', () => {
      const mockReq = {
        on: jest.fn(),
      } as any;

      const mockRes = {
        setHeader: jest.fn(),
        write: jest.fn(),
        writableEnded: false,
      } as unknown as Response;

      eventBus.streamSSE(mockReq, mockRes);

      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('heartbeat'));
    });

    it('should register client and increment stats', () => {
      const mockReq = {
        on: jest.fn(),
      } as any;

      const mockRes = {
        setHeader: jest.fn(),
        write: jest.fn(),
        writableEnded: false,
      } as unknown as Response;

      const initialStats = eventBus.getStats();
      eventBus.streamSSE(mockReq, mockRes);
      const newStats = eventBus.getStats();

      expect(newStats.sseClients).toBe(initialStats.sseClients + 1);
    });
  });
});
