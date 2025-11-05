/**
 * @fileoverview Tests for event validation
 * @lastmodified 2025-11-05
 */

import { ResearchEvent } from '../types/events';
import { eventValidator } from '../validation/event-validator';

describe('EventValidator', () => {
  describe('validate()', () => {
    it('should validate a valid minimal event', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      expect(() => eventValidator.validate(event)).not.toThrow();
    });

    it('should validate an event with all fields', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 5,
        agent: 'fetch',
        action: 'fetch.complete',
        input: { url: 'https://example.com' },
        output: {
          status_code: 200,
          content_length: 1024,
          content_type: 'text/html',
        },
        artifacts: {
          urls: ['https://example.com/page1'],
          document_ids: ['doc-123'],
        },
        source: {
          type: 'url',
          value: 'https://example.com',
        },
        cost: {
          usd: 0.01,
          tokens: {
            input: 100,
            output: 50,
          },
          compute_ms: 250,
        },
        decision: {
          reason: 'High relevance score',
          score: 0.95,
        },
        error: undefined,
        metadata: {
          custom_field: 'custom_value',
        },
      };

      expect(() => eventValidator.validate(event)).not.toThrow();
    });

    it('should reject event missing required ts field', () => {
      const event = {
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      } as ResearchEvent;

      expect(() => eventValidator.validate(event)).toThrow();
    });

    it('should reject event missing required run_id field', () => {
      const event = {
        ts: new Date().toISOString(),
        step_id: 1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      } as ResearchEvent;

      expect(() => eventValidator.validate(event)).toThrow();
    });

    it('should reject event missing required step_id field', () => {
      const event = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        agent: 'orchestrator',
        action: 'orchestrator.start',
      } as ResearchEvent;

      expect(() => eventValidator.validate(event)).toThrow();
    });

    it('should reject event missing required agent field', () => {
      const event = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        action: 'orchestrator.start',
      } as ResearchEvent;

      expect(() => eventValidator.validate(event)).toThrow();
    });

    it('should reject event missing required action field', () => {
      const event = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
      } as ResearchEvent;

      expect(() => eventValidator.validate(event)).toThrow();
    });

    it('should reject event with invalid agent type', () => {
      const event = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'invalid_agent',
        action: 'orchestrator.start',
      } as unknown as ResearchEvent;

      expect(() => eventValidator.validate(event)).toThrow();
    });

    it('should reject event with invalid action type', () => {
      const event = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'orchestrator',
        action: 'invalid.action',
      } as unknown as ResearchEvent;

      expect(() => eventValidator.validate(event)).toThrow();
    });

    it('should reject event with negative step_id', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: -1,
        agent: 'orchestrator',
        action: 'orchestrator.start',
      };

      expect(() => eventValidator.validate(event)).toThrow();
    });

    it('should validate event with error field', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'fetch',
        action: 'fetch.error',
        error: {
          message: 'Connection timeout',
          code: 'ETIMEDOUT',
          stack: 'Error: Connection timeout\n  at ...',
        },
      };

      expect(() => eventValidator.validate(event)).not.toThrow();
    });

    it('should validate different agent types', () => {
      const agents: Array<ResearchEvent['agent']> = [
        'orchestrator',
        'fetch',
        'extract',
        'index',
        'graph',
        'synthesis',
        'system',
      ];

      agents.forEach((agent) => {
        const event: ResearchEvent = {
          ts: new Date().toISOString(),
          run_id: 'test-run-123',
          step_id: 1,
          agent,
          action: `${agent}.start` as ResearchEvent['action'],
        };

        expect(() => eventValidator.validate(event)).not.toThrow();
      });
    });

    it('should validate cost tracking fields', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'synthesis',
        action: 'synthesis.complete',
        cost: {
          usd: 0.05,
          tokens: {
            input: 1000,
            output: 500,
          },
          compute_ms: 1500,
        },
      };

      expect(() => eventValidator.validate(event)).not.toThrow();
    });

    it('should validate artifacts with various ID types', () => {
      const event: ResearchEvent = {
        ts: new Date().toISOString(),
        run_id: 'test-run-123',
        step_id: 1,
        agent: 'graph',
        action: 'graph.merge',
        artifacts: {
          node_ids: ['node-1', 'node-2'],
          edge_ids: ['edge-1', 'edge-2'],
          document_ids: ['doc-1'],
          file_paths: ['/path/to/file.json'],
        },
      };

      expect(() => eventValidator.validate(event)).not.toThrow();
    });

    it('should validate source field variations', () => {
      const sources: Array<ResearchEvent['source']> = [
        { type: 'url', value: 'https://example.com' },
        { type: 'query', value: 'search query' },
        { type: 'document', value: 'doc-123' },
        { type: 'node', value: 'node-456' },
        { type: 'command', value: '/search depth:high' },
      ];

      sources.forEach((source, index) => {
        const event: ResearchEvent = {
          ts: new Date().toISOString(),
          run_id: 'test-run-123',
          step_id: index + 1,
          agent: 'fetch',
          action: 'fetch.start',
          source,
        };

        expect(() => eventValidator.validate(event)).not.toThrow();
      });
    });
  });
});
