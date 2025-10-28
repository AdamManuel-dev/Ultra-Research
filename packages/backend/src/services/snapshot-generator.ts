/**
 * @fileoverview Snapshot generator for event replay and state reconstruction
 * @lastmodified 2025-10-28
 *
 * Features: Generate snapshots at specific points, replay events to rebuild state
 * Main APIs: generateSnapshot(), replayToSnapshot(), listSnapshots()
 * Constraints: Snapshots stored in object storage, indexed by run_id and timestamp
 * Patterns: Event sourcing, point-in-time recovery, state machine reconstruction
 */

import { ResearchEvent } from '@deep-research/shared';

import { logger } from '../utils/logger';

import { opensearchEventIndexer } from './opensearch-event-indexer';

/**
 * Snapshot of system state at a point in time
 */
export interface EventSnapshot {
  snapshot_id: string;
  run_id: string;
  timestamp: string;
  step_id: number;
  events: ResearchEvent[];
  metadata: {
    event_count: number;
    agents: string[];
    actions: string[];
    total_cost_usd: number;
    duration_ms: number;
  };
}

/**
 * Snapshot query parameters
 */
export interface SnapshotQuery {
  run_id: string;
  timestamp?: string; // ISO timestamp - get snapshot at or before this time
  step_id?: number; // Get snapshot at or before this step
}

/**
 * Snapshot generator for event replay
 */
export class SnapshotGenerator {
  /**
   * Generate a snapshot for a run at a specific point
   */
  async generateSnapshot(query: SnapshotQuery): Promise<EventSnapshot> {
    const startTime = Date.now();

    try {
      // Query all events up to the specified point
      const searchResult = await opensearchEventIndexer.searchEvents({
        run_id: query.run_id,
        to: query.timestamp,
        limit: 10000, // Large limit to get all events
      });

      let { events } = searchResult;

      // Filter by step_id if specified
      if (query.step_id !== undefined) {
        const maxStepId = query.step_id;
        events = events.filter((e) => e.step_id <= maxStepId);
      }

      // Sort by step_id to ensure chronological order
      events.sort((a, b) => a.step_id - b.step_id);

      // Calculate metadata
      const agents = new Set(events.map((e) => e.agent));
      const actions = new Set(events.map((e) => e.action));
      const totalCost = events.reduce((sum, e) => sum + (e.cost?.usd || 0), 0);

      const lastEvent = events.length > 0 ? events[events.length - 1] : undefined;

      const snapshot: EventSnapshot = {
        snapshot_id: `${query.run_id}-${Date.now()}`,
        run_id: query.run_id,
        timestamp: query.timestamp || new Date().toISOString(),
        step_id: lastEvent ? lastEvent.step_id : 0,
        events,
        metadata: {
          event_count: events.length,
          agents: Array.from(agents),
          actions: Array.from(actions),
          total_cost_usd: totalCost,
          duration_ms: Date.now() - startTime,
        },
      };

      logger.info('Snapshot generated', {
        metadata: {
          snapshot_id: snapshot.snapshot_id,
          run_id: query.run_id,
          event_count: events.length,
          duration_ms: snapshot.metadata.duration_ms,
        },
      });

      return snapshot;
    } catch (error) {
      logger.error('Failed to generate snapshot', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          query,
        },
      });
      throw error;
    }
  }

  /**
   * Replay events from a snapshot to reconstruct state
   */
  async replayToSnapshot(
    snapshotId: string,
    stateReducer: (state: unknown, event: ResearchEvent) => unknown,
    initialState: unknown = {}
  ): Promise<{ state: unknown; events: ResearchEvent[] }> {
    try {
      // For now, we'll extract run_id from snapshot_id
      // In production, snapshots would be stored in object storage
      const runId = snapshotId.split('-')[0] || 'unknown';

      const snapshot = await this.generateSnapshot({ run_id: runId });

      // Replay events through the reducer
      let state = initialState;
      for (const event of snapshot.events) {
        state = stateReducer(state, event);
      }

      logger.info('Snapshot replayed', {
        metadata: {
          snapshot_id: snapshotId,
          event_count: snapshot.events.length,
        },
      });

      return {
        state,
        events: snapshot.events,
      };
    } catch (error) {
      logger.error('Failed to replay snapshot', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          snapshot_id: snapshotId,
        },
      });
      throw error;
    }
  }

  /**
   * Get snapshot at specific step
   */
  async getSnapshotAtStep(runId: string, stepId: number): Promise<EventSnapshot> {
    return this.generateSnapshot({
      run_id: runId,
      step_id: stepId,
    });
  }

  /**
   * Get latest snapshot for a run
   */
  async getLatestSnapshot(runId: string): Promise<EventSnapshot> {
    return this.generateSnapshot({
      run_id: runId,
    });
  }

  /**
   * Get snapshot diff between two points
   */
  async getSnapshotDiff(
    runId: string,
    fromStepId: number,
    toStepId: number
  ): Promise<{
    from_step: number;
    to_step: number;
    added_events: ResearchEvent[];
    metadata: {
      event_count: number;
      cost_delta_usd: number;
    };
  }> {
    try {
      // Get events between the two steps
      const searchResult = await opensearchEventIndexer.searchEvents({
        run_id: runId,
        limit: 10000,
      });

      const diffEvents = searchResult.events.filter(
        (e) => e.step_id > fromStepId && e.step_id <= toStepId
      );

      const costDelta = diffEvents.reduce((sum, e) => sum + (e.cost?.usd || 0), 0);

      logger.info('Snapshot diff calculated', {
        metadata: {
          run_id: runId,
          from_step: fromStepId,
          to_step: toStepId,
          event_count: diffEvents.length,
        },
      });

      return {
        from_step: fromStepId,
        to_step: toStepId,
        added_events: diffEvents,
        metadata: {
          event_count: diffEvents.length,
          cost_delta_usd: costDelta,
        },
      };
    } catch (error) {
      logger.error('Failed to calculate snapshot diff', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          run_id: runId,
          from_step: fromStepId,
          to_step: toStepId,
        },
      });
      throw error;
    }
  }

  /**
   * Build state summary from events
   */
  buildStateSummary(events: ResearchEvent[]): {
    agents: Record<string, number>;
    actions: Record<string, number>;
    timeline: { step: number; action: string; agent: string; timestamp: string }[];
    costs: { total: number; by_agent: Record<string, number> };
  } {
    const agentCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    const timeline: { step: number; action: string; agent: string; timestamp: string }[] = [];
    const agentCosts: Record<string, number> = {};
    let totalCost = 0;

    for (const event of events) {
      // Count agents
      agentCounts[event.agent] = (agentCounts[event.agent] || 0) + 1;

      // Count actions
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;

      // Build timeline
      timeline.push({
        step: event.step_id,
        action: event.action,
        agent: event.agent,
        timestamp: event.ts,
      });

      // Track costs
      if (event.cost?.usd) {
        totalCost += event.cost.usd;
        agentCosts[event.agent] = (agentCosts[event.agent] || 0) + event.cost.usd;
      }
    }

    return {
      agents: agentCounts,
      actions: actionCounts,
      timeline,
      costs: {
        total: totalCost,
        by_agent: agentCosts,
      },
    };
  }
}

// Singleton instance
export const snapshotGenerator = new SnapshotGenerator();
