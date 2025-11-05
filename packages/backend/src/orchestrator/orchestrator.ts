/**
 * @fileoverview Main orchestrator controller
 * @lastmodified 2025-11-05
 *
 * Features: Orchestrates entire research process, manages runs, controls execution
 * Main APIs: startRun, pauseRun, resumeRun, cancelRun, getRunStatus
 * Constraints: One active run per run_id, proper state management
 * Patterns: Facade pattern, state machine
 */

import { nanoid } from 'nanoid';

import { eventBus } from '../services/event-bus';
import { logger } from '../utils/logger';
import { createOrchestratorCompleteEvent } from '../utils/event-producers';

import { planner, PlanningStrategy } from './planner';
import { RunContext, runContextStore, StrategyWeights } from './run-context';
import { taskExecutor } from './task-executor';

/**
 * Start run options
 */
export interface StartRunOptions {
  strategy?: PlanningStrategy;
  config?: Partial<RunContext['config']>;
  userId?: string;
}

/**
 * Main orchestrator - manages research runs
 */
export class Orchestrator {
  /**
   * Start a new research run
   */
  async startRun(query: string, options: StartRunOptions = {}): Promise<string> {
    const runId = nanoid();
    const { strategy = 'simple', config = {}, userId } = options;

    logger.info('Starting new run', {
      metadata: {
        run_id: runId,
        query,
        strategy,
        user_id: userId,
      },
    });

    try {
      // Create run context
      const context = await runContextStore.createRun(runId, query, config, userId);

      // Update status to planning
      await runContextStore.updateStatus(runId, 'planning');

      // Create plan
      const plan = await planner.createPlan(runId, query, strategy);

      // Update context with plan
      context.graph = plan.graph;
      await runContextStore.saveContext(context);

      // Update status to running
      await runContextStore.updateStatus(runId, 'running');

      // Execute plan (async)
      void this.executePlan(runId);

      return runId;
    } catch (error) {
      logger.error('Failed to start run', {
        metadata: {
          run_id: runId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      await runContextStore.updateStatus(runId, 'failed', error instanceof Error ? error.message : String(error));

      throw error;
    }
  }

  /**
   * Execute a plan (internal)
   */
  private async executePlan(runId: string): Promise<void> {
    try {
      const context = await runContextStore.getContext(runId);
      if (!context) {
        throw new Error(`Run not found: ${runId}`);
      }

      await taskExecutor.executePlan(context);

      // Save final state
      await runContextStore.saveContext(context);

      // Check if run completed successfully
      const stats = context.graph.getStats();
      if (stats.failedTasks > 0) {
        await runContextStore.updateStatus(runId, 'failed', 'Some tasks failed');
      } else {
        await runContextStore.updateStatus(runId, 'completed');

        // Emit completion event
        await eventBus.publish(
          createOrchestratorCompleteEvent(runId, {
            status: 'completed',
            total_steps: stats.totalTasks,
            duration_ms: Date.now() - new Date(context.startedAt || context.createdAt).getTime(),
          })
        );
      }
    } catch (error) {
      logger.error('Plan execution error', {
        metadata: {
          run_id: runId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      await runContextStore.updateStatus(runId, 'failed', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Pause a running research run
   */
  async pauseRun(runId: string): Promise<void> {
    const context = await runContextStore.getContext(runId);
    if (!context) {
      throw new Error(`Run not found: ${runId}`);
    }

    if (context.status !== 'running') {
      throw new Error(`Run is not running: ${runId}`);
    }

    // Cancel all running tasks
    taskExecutor.cancelAll();

    await runContextStore.updateStatus(runId, 'paused');

    logger.info('Run paused', {
      metadata: {
        run_id: runId,
      },
    });
  }

  /**
   * Resume a paused research run
   */
  async resumeRun(runId: string): Promise<void> {
    const context = await runContextStore.getContext(runId);
    if (!context) {
      throw new Error(`Run not found: ${runId}`);
    }

    if (context.status !== 'paused') {
      throw new Error(`Run is not paused: ${runId}`);
    }

    await runContextStore.updateStatus(runId, 'running');

    // Resume execution
    void this.executePlan(runId);

    logger.info('Run resumed', {
      metadata: {
        run_id: runId,
      },
    });
  }

  /**
   * Cancel a research run
   */
  async cancelRun(runId: string): Promise<void> {
    const context = await runContextStore.getContext(runId);
    if (!context) {
      throw new Error(`Run not found: ${runId}`);
    }

    // Cancel all running tasks
    taskExecutor.cancelAll();

    await runContextStore.updateStatus(runId, 'cancelled');

    logger.info('Run cancelled', {
      metadata: {
        run_id: runId,
      },
    });
  }

  /**
   * Get run status
   */
  async getRunStatus(runId: string): Promise<{
    runId: string;
    query: string;
    status: RunContext['status'];
    stats: ReturnType<RunContext['graph']['getStats']>;
    duration?: number;
  } | null> {
    const context = await runContextStore.getContext(runId);
    if (!context) {
      return null;
    }

    let duration: number | undefined;
    if (context.startedAt && context.completedAt) {
      duration = new Date(context.completedAt).getTime() - new Date(context.startedAt).getTime();
    } else if (context.startedAt) {
      duration = Date.now() - new Date(context.startedAt).getTime();
    }

    return {
      runId: context.runId,
      query: context.query,
      status: context.status,
      stats: context.graph.getStats(),
      duration,
    };
  }

  /**
   * Update strategy weights
   */
  async updateWeights(runId: string, weights: Partial<StrategyWeights>): Promise<void> {
    await runContextStore.updateWeights(runId, weights);

    logger.info('Strategy weights updated', {
      metadata: {
        run_id: runId,
        weights,
      },
    });
  }

  /**
   * Get run context (full details)
   */
  async getRunContext(runId: string): Promise<RunContext | null> {
    return runContextStore.getContext(runId);
  }

  /**
   * List runs for a user
   */
  async listUserRuns(userId: string): Promise<RunContext[]> {
    return runContextStore.getRunsByUser(userId);
  }

  /**
   * Delete a run
   */
  async deleteRun(runId: string): Promise<boolean> {
    // Cancel if running
    const context = await runContextStore.getContext(runId);
    if (context?.status === 'running') {
      await this.cancelRun(runId);
    }

    return runContextStore.deleteContext(runId);
  }
}

// Singleton instance
export const orchestrator = new Orchestrator();
