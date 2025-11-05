/**
 * @fileoverview Run context store for orchestrator state management
 * @lastmodified 2025-11-05
 *
 * Features: Run state storage, configuration management, Redis-backed persistence
 * Main APIs: RunContext, createRun, getRunContext, updateRunState
 * Constraints: Fast lookups by run_id, proper isolation between runs
 * Patterns: Repository pattern, Redis for state store
 */

import { Redis } from 'ioredis';

import { config } from '../config';
import { logger } from '../utils/logger';

import { TaskGraph } from './task-graph';

/**
 * Run status
 */
export type RunStatus = 'planning' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * Strategy weights for frontier scoring
 */
export interface StrategyWeights {
  novelty: number; // Weight for novelty score (0-1)
  centrality: number; // Weight for centrality score (0-1)
  disagreement: number; // Weight for disagreement score (0-1)
  recency: number; // Weight for recency score (0-1)
}

/**
 * Run configuration
 */
export interface RunConfig {
  maxConcurrentTasks: number;
  maxDepth: number; // Maximum task graph depth
  maxTotalTasks: number;
  strategyWeights: StrategyWeights;
  timeoutMs: number; // Overall run timeout
  taskTimeoutMs: number; // Per-task timeout
  retryStrategy: 'exponential' | 'linear' | 'none';
  maxRetries: number;
}

/**
 * Run context - complete state for a research run
 */
export interface RunContext {
  runId: string;
  userId?: string;
  query: string;
  status: RunStatus;
  config: RunConfig;
  graph: TaskGraph;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

/**
 * Default run configuration
 */
export const DEFAULT_RUN_CONFIG: RunConfig = {
  maxConcurrentTasks: 5,
  maxDepth: 10,
  maxTotalTasks: 100,
  strategyWeights: {
    novelty: 0.3,
    centrality: 0.3,
    disagreement: 0.25,
    recency: 0.15,
  },
  timeoutMs: 30 * 60 * 1000, // 30 minutes
  taskTimeoutMs: 5 * 60 * 1000, // 5 minutes
  retryStrategy: 'exponential',
  maxRetries: 3,
};

/**
 * Run context store - manages research run state
 */
export class RunContextStore {
  private redis: Redis;

  private readonly keyPrefix = 'run:';

  private readonly ttl = 7 * 24 * 60 * 60; // 7 days

  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (error: Error) => {
      logger.error('Redis connection error in run context store', {
        metadata: {
          error: error.message,
        },
      });
    });

    this.redis.on('connect', () => {
      logger.info('Run context store connected to Redis');
    });
  }

  /**
   * Create a new run context
   */
  async createRun(
    runId: string,
    query: string,
    config: Partial<RunConfig> = {},
    userId?: string
  ): Promise<RunContext> {
    const context: RunContext = {
      runId,
      userId,
      query,
      status: 'planning',
      config: {
        ...DEFAULT_RUN_CONFIG,
        ...config,
      },
      graph: new TaskGraph(runId),
      createdAt: new Date().toISOString(),
      metadata: {},
    };

    await this.saveContext(context);

    logger.info('Run context created', {
      metadata: {
        run_id: runId,
        query,
        user_id: userId,
      },
    });

    return context;
  }

  /**
   * Get run context by ID
   */
  async getContext(runId: string): Promise<RunContext | null> {
    try {
      const key = this.getKey(runId);
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);

      // Restore task graph
      parsed.graph = TaskGraph.fromJSON(parsed.graph);

      return parsed as RunContext;
    } catch (error) {
      logger.error('Failed to get run context', {
        metadata: {
          run_id: runId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return null;
    }
  }

  /**
   * Save run context
   */
  async saveContext(context: RunContext): Promise<void> {
    try {
      const key = this.getKey(context.runId);

      // Serialize graph for storage
      const serializable = {
        ...context,
        graph: context.graph.toJSON(),
      };

      await this.redis.setex(key, this.ttl, JSON.stringify(serializable));

      logger.debug('Run context saved', {
        metadata: {
          run_id: context.runId,
        },
      });
    } catch (error) {
      logger.error('Failed to save run context', {
        metadata: {
          run_id: context.runId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Update run status
   */
  async updateStatus(runId: string, status: RunStatus, error?: string): Promise<void> {
    const context = await this.getContext(runId);
    if (!context) {
      throw new Error(`Run not found: ${runId}`);
    }

    context.status = status;

    if (status === 'running' && !context.startedAt) {
      context.startedAt = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      context.completedAt = new Date().toISOString();
    }

    if (error) {
      context.error = error;
    }

    await this.saveContext(context);

    logger.info('Run status updated', {
      metadata: {
        run_id: runId,
        status,
        has_error: !!error,
      },
    });
  }

  /**
   * Update strategy weights
   */
  async updateWeights(runId: string, weights: Partial<StrategyWeights>): Promise<void> {
    const context = await this.getContext(runId);
    if (!context) {
      throw new Error(`Run not found: ${runId}`);
    }

    context.config.strategyWeights = {
      ...context.config.strategyWeights,
      ...weights,
    };

    await this.saveContext(context);

    logger.info('Strategy weights updated', {
      metadata: {
        run_id: runId,
        weights: context.config.strategyWeights,
      },
    });
  }

  /**
   * Update run metadata
   */
  async updateMetadata(runId: string, metadata: Record<string, unknown>): Promise<void> {
    const context = await this.getContext(runId);
    if (!context) {
      throw new Error(`Run not found: ${runId}`);
    }

    context.metadata = {
      ...context.metadata,
      ...metadata,
    };

    await this.saveContext(context);
  }

  /**
   * Delete run context
   */
  async deleteContext(runId: string): Promise<boolean> {
    try {
      const key = this.getKey(runId);
      const deleted = await this.redis.del(key);

      logger.info('Run context deleted', {
        metadata: {
          run_id: runId,
          deleted: deleted > 0,
        },
      });

      return deleted > 0;
    } catch (error) {
      logger.error('Failed to delete run context', {
        metadata: {
          run_id: runId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return false;
    }
  }

  /**
   * List all run IDs (for admin/debugging)
   */
  async listRuns(): Promise<string[]> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);

      return keys.map((key) => key.replace(this.keyPrefix, ''));
    } catch (error) {
      logger.error('Failed to list runs', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return [];
    }
  }

  /**
   * Get runs by user ID
   */
  async getRunsByUser(userId: string): Promise<RunContext[]> {
    try {
      const allRunIds = await this.listRuns();
      const contexts: RunContext[] = [];

      for (const runId of allRunIds) {
        const context = await this.getContext(runId);
        if (context && context.userId === userId) {
          contexts.push(context);
        }
      }

      return contexts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      logger.error('Failed to get runs by user', {
        metadata: {
          user_id: userId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return [];
    }
  }

  /**
   * Get run statistics
   */
  async getStats(runId: string): Promise<{
    status: RunStatus;
    duration?: number;
    taskStats: ReturnType<TaskGraph['getStats']>;
  } | null> {
    const context = await this.getContext(runId);
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
      status: context.status,
      duration,
      taskStats: context.graph.getStats(),
    };
  }

  /**
   * Get Redis key for a run
   */
  private getKey(runId: string): string {
    return `${this.keyPrefix}${runId}`;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
    logger.info('Run context store connection closed');
  }
}

// Singleton instance
export const runContextStore = new RunContextStore();
