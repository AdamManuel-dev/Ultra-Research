/**
 * @fileoverview Event producer utilities for consistent event creation across components
 * @lastmodified 2025-10-28
 *
 * Features: Typed event producers for all system components, auto-incrementing step IDs
 * Main APIs: createOrchestratorEvent(), createFetchEvent(), createIndexEvent(), etc.
 * Constraints: All events must have run_id, step_id, ts, agent, action
 * Patterns: Factory pattern for event creation, ensures consistency
 */

import { ResearchEvent, AgentType, EventAction } from '@deep-research/shared';

import { eventBus } from '../services/event-bus';

/**
 * Run context tracking
 */
class RunContext {
  private stepCounters: Map<string, number> = new Map();

  getNextStepId(runId: string): number {
    const current = this.stepCounters.get(runId) || 0;
    const next = current + 1;
    this.stepCounters.set(runId, next);
    return next;
  }

  resetRun(runId: string): void {
    this.stepCounters.delete(runId);
  }

  getCurrentStep(runId: string): number {
    return this.stepCounters.get(runId) || 0;
  }
}

const runContext = new RunContext();

/**
 * Base event creator
 */
function createEvent(
  runId: string,
  agent: AgentType,
  action: EventAction,
  data?: Partial<ResearchEvent>
): ResearchEvent {
  const event: ResearchEvent = {
    ts: new Date().toISOString(),
    run_id: runId,
    step_id: runContext.getNextStepId(runId),
    agent,
    action,
    ...data,
  };

  return event;
}

/**
 * Publish an event to the event bus
 */
export function publishEvent(event: ResearchEvent): void {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  eventBus.publish(event);
}

// ==================== ORCHESTRATOR EVENTS ====================

export function createOrchestratorStartEvent(
  runId: string,
  input: { query: string; options?: Record<string, unknown> }
): ResearchEvent {
  return createEvent(runId, 'orchestrator', 'orchestrator.start', {
    input,
    metadata: {
      start_time: new Date().toISOString(),
    },
  });
}

export function createOrchestratorCommandEvent(
  runId: string,
  input: { command: string; params?: Record<string, unknown> }
): ResearchEvent {
  return createEvent(runId, 'orchestrator', 'orchestrator.command', {
    input,
  });
}

export function createOrchestratorPlanEvent(
  runId: string,
  output: {
    tasks: Array<{ task_id: string; type: string; priority: number }>;
    strategy: string;
  },
  decision?: { reason: string; score?: number }
): ResearchEvent {
  return createEvent(runId, 'orchestrator', 'orchestrator.plan', {
    output,
    decision,
  });
}

export function createFrontierUpdateEvent(
  runId: string,
  output: {
    added: Array<{ url: string; score: number; reason: string }>;
    removed: Array<{ url: string; reason: string }>;
    total_items: number;
  }
): ResearchEvent {
  return createEvent(runId, 'orchestrator', 'orchestrator.frontier.update', {
    output,
  });
}

export function createTaskScheduledEvent(
  runId: string,
  output: {
    task_id: string;
    task_type: string;
    scheduled_at: string;
  }
): ResearchEvent {
  return createEvent(runId, 'orchestrator', 'orchestrator.task.scheduled', {
    output,
  });
}

export function createOrchestratorCompleteEvent(
  runId: string,
  output: {
    status: string;
    total_steps: number;
    duration_ms: number;
  },
  cost?: { usd: number; tokens?: { input: number; output: number } }
): ResearchEvent {
  return createEvent(runId, 'orchestrator', 'orchestrator.complete', {
    output,
    cost,
  });
}

// ==================== FETCH EVENTS ====================

export function createFetchStartEvent(
  runId: string,
  input: { url: string; method?: string },
  source: { type: 'url' | 'query'; value: string }
): ResearchEvent {
  return createEvent(runId, 'fetch', 'fetch.start', {
    input,
    source,
    metadata: {
      fetch_start_time: new Date().toISOString(),
    },
  });
}

export function createFetchCompleteEvent(
  runId: string,
  input: { url: string },
  output: {
    status_code: number;
    content_length: number;
    content_type: string;
    duration_ms: number;
  },
  artifacts?: { urls?: string[]; document_ids?: string[] }
): ResearchEvent {
  return createEvent(runId, 'fetch', 'fetch.complete', {
    input,
    output,
    artifacts,
  });
}

export function createFetchErrorEvent(
  runId: string,
  input: { url: string },
  error: { message: string; code?: string; stack?: string }
): ResearchEvent {
  return createEvent(runId, 'fetch', 'fetch.error', {
    input,
    error,
  });
}

export function createFetchCachedEvent(
  runId: string,
  input: { url: string },
  output: {
    cache_hit: boolean;
    cache_age_ms?: number;
  }
): ResearchEvent {
  return createEvent(runId, 'fetch', 'fetch.cached', {
    input,
    output,
  });
}

// ==================== EXTRACTION EVENTS ====================

export function createExtractStartEvent(
  runId: string,
  input: { url: string; html_size: number },
  source: { type: 'url'; value: string }
): ResearchEvent {
  return createEvent(runId, 'extract', 'extract.start', {
    input,
    source,
  });
}

export function createExtractCompleteEvent(
  runId: string,
  input: { url: string },
  output: {
    text_length: number;
    markdown_length: number;
    extraction_method: string;
    duration_ms: number;
  },
  artifacts?: { document_ids?: string[]; file_paths?: string[] }
): ResearchEvent {
  return createEvent(runId, 'extract', 'extract.complete', {
    input,
    output,
    artifacts,
  });
}

export function createExtractErrorEvent(
  runId: string,
  input: { url: string },
  error: { message: string; code?: string }
): ResearchEvent {
  return createEvent(runId, 'extract', 'extract.error', {
    input,
    error,
  });
}

// ==================== INDEXING EVENTS ====================

export function createIndexWriteEvent(
  runId: string,
  input: { document_id: string; content_length: number },
  output: {
    indexed: boolean;
    chunks: number;
    duration_ms: number;
  },
  artifacts?: { document_ids?: string[] }
): ResearchEvent {
  return createEvent(runId, 'index', 'index.write', {
    input,
    output,
    artifacts,
  });
}

export function createIndexQueryEvent(
  runId: string,
  input: { query: string; limit?: number },
  output: {
    results: number;
    top_score: number;
    duration_ms: number;
  },
  computeMs?: number
): ResearchEvent {
  return createEvent(runId, 'index', 'index.query', {
    input,
    output,
    cost: computeMs ? { usd: 0, compute_ms: computeMs } : undefined,
  });
}

export function createIndexUpdateEvent(
  runId: string,
  input: { document_id: string; updates: Record<string, unknown> },
  output: {
    updated: boolean;
    duration_ms: number;
  }
): ResearchEvent {
  return createEvent(runId, 'index', 'index.update', {
    input,
    output,
  });
}

// ==================== GRAPH EVENTS ====================

export function createGraphMergeEvent(
  runId: string,
  input: {
    source_id: string;
    entities: number;
    relations: number;
  },
  output: {
    nodes_created: number;
    edges_created: number;
    nodes_updated: number;
    edges_updated: number;
    duration_ms: number;
  },
  artifacts?: { node_ids?: string[]; edge_ids?: string[] }
): ResearchEvent {
  return createEvent(runId, 'graph', 'graph.merge', {
    input,
    output,
    artifacts,
  });
}

export function createGraphQueryEvent(
  runId: string,
  input: { query: string; params?: Record<string, unknown> },
  output: {
    nodes: number;
    edges: number;
    duration_ms: number;
  }
): ResearchEvent {
  return createEvent(runId, 'graph', 'graph.query', {
    input,
    output,
  });
}

export function createGraphUpdateEvent(
  runId: string,
  input: { node_id?: string; edge_id?: string; updates: Record<string, unknown> },
  output: {
    updated: boolean;
    duration_ms: number;
  }
): ResearchEvent {
  return createEvent(runId, 'graph', 'graph.update', {
    input,
    output,
  });
}

// ==================== SYNTHESIS EVENTS ====================

export function createSynthesisStartEvent(
  runId: string,
  input: {
    query: string;
    document_count: number;
    synthesis_type: string;
  }
): ResearchEvent {
  return createEvent(runId, 'synthesis', 'synthesis.start', {
    input,
  });
}

export function createSynthesisCompleteEvent(
  runId: string,
  input: { query: string },
  output: {
    result_length: number;
    sources_cited: number;
    duration_ms: number;
  },
  cost?: {
    usd: number;
    tokens?: { input: number; output: number };
  },
  artifacts?: { file_paths?: string[] }
): ResearchEvent {
  return createEvent(runId, 'synthesis', 'synthesis.complete', {
    input,
    output,
    cost,
    artifacts,
  });
}

export function createSynthesisErrorEvent(
  runId: string,
  input: { query: string },
  error: { message: string; code?: string }
): ResearchEvent {
  return createEvent(runId, 'synthesis', 'synthesis.error', {
    input,
    error,
  });
}

// ==================== SYSTEM EVENTS ====================

export function createSystemHealthEvent(
  runId: string,
  output: {
    status: string;
    components: Record<string, { healthy: boolean; latency_ms?: number }>;
  }
): ResearchEvent {
  return createEvent(runId, 'system', 'system.health', {
    output,
  });
}

export function createSystemErrorEvent(
  runId: string,
  error: { message: string; code?: string; stack?: string },
  metadata?: Record<string, unknown>
): ResearchEvent {
  return createEvent(runId, 'system', 'system.error', {
    error,
    metadata,
  });
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Reset run context (start a new run)
 */
export function resetRun(runId: string): void {
  runContext.resetRun(runId);
}

/**
 * Get current step for a run
 */
export function getCurrentStep(runId: string): number {
  return runContext.getCurrentStep(runId);
}

/**
 * Helper to publish an event immediately
 */
export function emitEvent(event: ResearchEvent): void {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  eventBus.publish(event);
}
