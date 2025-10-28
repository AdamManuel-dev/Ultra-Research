/**
 * @fileoverview Unified event schema for observability across all components
 * @lastmodified 2025-10-28
 *
 * Features: Structured events with correlation IDs, timing, costs, and artifacts
 * Main APIs: ResearchEvent interface, event action types
 * Constraints: All events must include run_id, ts, agent, action
 * Patterns: Use for real-time streaming, replay, and analytics
 */

/**
 * Event action types across all system components
 */
export type EventAction =
  // Orchestrator
  | 'orchestrator.start'
  | 'orchestrator.command'
  | 'orchestrator.plan'
  | 'orchestrator.frontier.update'
  | 'orchestrator.task.scheduled'
  | 'orchestrator.complete'
  // Fetch
  | 'fetch.start'
  | 'fetch.complete'
  | 'fetch.error'
  | 'fetch.cached'
  // Extraction
  | 'extract.start'
  | 'extract.complete'
  | 'extract.error'
  // Indexing
  | 'index.write'
  | 'index.query'
  | 'index.update'
  // Graph
  | 'graph.merge'
  | 'graph.query'
  | 'graph.update'
  // Synthesis
  | 'synthesis.start'
  | 'synthesis.complete'
  | 'synthesis.error'
  // System
  | 'system.health'
  | 'system.error';

/**
 * Agent type performing the action
 */
export type AgentType =
  | 'orchestrator'
  | 'fetch'
  | 'extract'
  | 'index'
  | 'graph'
  | 'synthesis'
  | 'system';

/**
 * Core event interface for all system events
 */
export interface ResearchEvent {
  /** ISO timestamp */
  ts: string;

  /** Research run identifier */
  run_id: string;

  /** Step within the run (sequential) */
  step_id: number;

  /** Component that emitted the event */
  agent: AgentType;

  /** Specific action taken */
  action: EventAction;

  /** Input data for the action */
  input?: Record<string, unknown>;

  /** Output data from the action */
  output?: Record<string, unknown>;

  /** Artifacts generated (URLs, IDs, etc.) */
  artifacts?: {
    urls?: string[];
    document_ids?: string[];
    node_ids?: string[];
    edge_ids?: string[];
    file_paths?: string[];
  };

  /** Source of the action (URL, query, etc.) */
  source?: {
    type: 'url' | 'query' | 'document' | 'node' | 'command';
    value: string;
  };

  /** Cost tracking */
  cost?: {
    usd: number;
    tokens?: {
      input: number;
      output: number;
    };
    compute_ms?: number;
  };

  /** Decision metadata (for orchestrator) */
  decision?: {
    reason: string;
    score?: number;
    alternatives?: Array<{ option: string; score: number }>;
  };

  /** Error information if action failed */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Event stream message for SSE/WebSocket
 */
export interface EventStreamMessage {
  event: 'research_event' | 'error' | 'heartbeat' | 'complete';
  data: ResearchEvent | { message: string };
  id?: string;
}

/**
 * Event query parameters
 */
export interface EventQuery {
  run_id?: string;
  agent?: AgentType;
  action?: EventAction;
  from?: string; // ISO timestamp
  to?: string; // ISO timestamp
  limit?: number;
  offset?: number;
}
