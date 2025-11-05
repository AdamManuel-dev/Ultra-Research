/**
 * @fileoverview Task executor with concurrency control
 * @lastmodified 2025-11-05
 *
 * Features: Task execution, concurrency control, retry logic, timeout handling
 * Main APIs: TaskExecutor, executeTask, executePlan
 * Constraints: Configurable parallelism, respects task dependencies
 * Patterns: Worker pool, promise-based concurrency control
 */

import { eventBus } from '../services/event-bus';
import { logger } from '../utils/logger';
import { createTaskScheduledEvent } from '../utils/event-producers';

import { RunContext } from './run-context';
import { TaskGraph, TaskNode } from './task-graph';

/**
 * Task execution result
 */
export interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
}

/**
 * Task executor - executes tasks from a task graph
 */
export class TaskExecutor {
  private runningTasks: Set<string> = new Set();

  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * Execute a complete plan
   */
  async executePlan(context: RunContext): Promise<void> {
    const { runId, graph, config } = context;

    logger.info('Starting plan execution', {
      metadata: {
        run_id: runId,
        total_tasks: graph.getStats().totalTasks,
        max_concurrent: config.maxConcurrentTasks,
      },
    });

    const startTime = Date.now();
    let completedTasks = 0;

    try {
      while (true) {
        // Check for timeout
        if (Date.now() - startTime > config.timeoutMs) {
          throw new Error('Plan execution timeout');
        }

        // Get tasks that are ready to execute
        const readyTasks = graph.getReadyTasks();

        if (readyTasks.length === 0 && this.runningTasks.size === 0) {
          // No more tasks to execute
          break;
        }

        // Execute tasks up to concurrency limit
        const availableSlots = config.maxConcurrentTasks - this.runningTasks.size;
        const tasksToExecute = readyTasks.slice(0, availableSlots);

        // Start executing tasks
        for (const task of tasksToExecute) {
          void this.executeTaskWithRetry(runId, task, graph, config.maxRetries, config.taskTimeoutMs);
          completedTasks++;

          // Emit task scheduled event
          await eventBus.publish(
            createTaskScheduledEvent(runId, {
              task_id: task.id,
              task_type: task.type,
              scheduled_at: new Date().toISOString(),
            })
          );
        }

        // Wait a bit before checking again
        if (readyTasks.length === 0 || this.runningTasks.size >= config.maxConcurrentTasks) {
          await this.sleep(100);
        }
      }

      const stats = graph.getStats();

      logger.info('Plan execution completed', {
        metadata: {
          run_id: runId,
          completed: stats.completedTasks,
          failed: stats.failedTasks,
          duration: Date.now() - startTime,
        },
      });
    } catch (error) {
      logger.error('Plan execution failed', {
        metadata: {
          run_id: runId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Execute a single task with retry logic
   */
  private async executeTaskWithRetry(
    runId: string,
    task: TaskNode,
    graph: TaskGraph,
    maxRetries: number,
    timeoutMs: number
  ): Promise<TaskExecutionResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeTask(runId, task, graph, timeoutMs);

        if (result.success) {
          return result;
        }

        lastError = result.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await this.sleep(delay);

        logger.info('Retrying task', {
          metadata: {
            run_id: runId,
            task_id: task.id,
            attempt: attempt + 1,
            max_retries: maxRetries,
          },
        });
      }
    }

    // All retries exhausted
    graph.updateTaskStatus(task.id, 'failed', undefined, lastError);

    return {
      taskId: task.id,
      success: false,
      error: lastError,
      duration: 0,
    };
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    runId: string,
    task: TaskNode,
    graph: TaskGraph,
    timeoutMs: number
  ): Promise<TaskExecutionResult> {
    const startTime = Date.now();

    this.runningTasks.add(task.id);
    graph.updateTaskStatus(task.id, 'running');

    logger.info('Executing task', {
      metadata: {
        run_id: runId,
        task_id: task.id,
        type: task.type,
      },
    });

    try {
      // Create abort controller for timeout
      const abortController = new AbortController();
      this.abortControllers.set(task.id, abortController);

      // Set timeout
      const timeout = setTimeout(() => {
        abortController.abort();
      }, timeoutMs);

      // Execute task based on type
      const result = await this.executeTaskType(runId, task, abortController.signal);

      clearTimeout(timeout);
      this.abortControllers.delete(task.id);

      // Update task status
      graph.updateTaskStatus(task.id, 'completed', result);

      const duration = Date.now() - startTime;

      logger.info('Task completed', {
        metadata: {
          run_id: runId,
          task_id: task.id,
          type: task.type,
          duration,
        },
      });

      this.runningTasks.delete(task.id);

      return {
        taskId: task.id,
        success: true,
        result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('Task failed', {
        metadata: {
          run_id: runId,
          task_id: task.id,
          type: task.type,
          error: errorMessage,
          duration,
        },
      });

      graph.updateTaskStatus(task.id, 'failed', undefined, errorMessage);
      this.runningTasks.delete(task.id);
      this.abortControllers.delete(task.id);

      return {
        taskId: task.id,
        success: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Execute task based on type
   * (Placeholder - would integrate with actual services)
   */
  private async executeTaskType(_runId: string, task: TaskNode, signal: AbortSignal): Promise<unknown> {
    // Check for abort
    if (signal.aborted) {
      throw new Error('Task aborted');
    }

    // TODO: Integrate with actual services
    // This is a placeholder that simulates task execution

    switch (task.type) {
      case 'search':
        return this.executeSearch(task, signal);

      case 'fetch':
        return this.executeFetch(task, signal);

      case 'extract':
        return this.executeExtract(task, signal);

      case 'index':
        return this.executeIndex(task, signal);

      case 'retrieve':
        return this.executeRetrieve(task, signal);

      case 'synthesize':
        return this.executeSynthesize(task, signal);

      case 'graph.merge':
        return this.executeGraphMerge(task, signal);

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Execute search task (placeholder)
   */
  private async executeSearch(task: TaskNode, signal: AbortSignal): Promise<unknown> {
    // TODO: Integrate with actual search service
    logger.debug('Executing search task', { metadata: { params: task.params } });
    await this.sleep(100);

    if (signal.aborted) {
      throw new Error('Search aborted');
    }

    return {
      query: task.params['query'],
      results: [],
      count: 0,
    };
  }

  /**
   * Execute fetch task (placeholder)
   */
  private async executeFetch(task: TaskNode, signal: AbortSignal): Promise<unknown> {
    // TODO: Integrate with fetch orchestrator
    logger.debug('Executing fetch task', { metadata: { params: task.params } });
    await this.sleep(100);

    if (signal.aborted) {
      throw new Error('Fetch aborted');
    }

    return {
      fetched: [],
      count: 0,
    };
  }

  /**
   * Execute extract task (placeholder)
   */
  private async executeExtract(task: TaskNode, signal: AbortSignal): Promise<unknown> {
    // TODO: Integrate with content extractor
    logger.debug('Executing extract task', { metadata: { params: task.params } });
    await this.sleep(100);

    if (signal.aborted) {
      throw new Error('Extract aborted');
    }

    return {
      extracted: [],
      count: 0,
    };
  }

  /**
   * Execute index task (placeholder)
   */
  private async executeIndex(task: TaskNode, signal: AbortSignal): Promise<unknown> {
    // TODO: Integrate with document indexer
    logger.debug('Executing index task', { metadata: { params: task.params } });
    await this.sleep(100);

    if (signal.aborted) {
      throw new Error('Index aborted');
    }

    return {
      indexed: [],
      count: 0,
    };
  }

  /**
   * Execute retrieve task (placeholder)
   */
  private async executeRetrieve(task: TaskNode, signal: AbortSignal): Promise<unknown> {
    // TODO: Integrate with hybrid retriever
    logger.debug('Executing retrieve task', { metadata: { params: task.params } });
    await this.sleep(100);

    if (signal.aborted) {
      throw new Error('Retrieve aborted');
    }

    return {
      results: [],
      count: 0,
    };
  }

  /**
   * Execute synthesize task (placeholder)
   */
  private async executeSynthesize(task: TaskNode, signal: AbortSignal): Promise<unknown> {
    // TODO: Integrate with LLM synthesis
    logger.debug('Executing synthesize task', { metadata: { params: task.params } });
    await this.sleep(100);

    if (signal.aborted) {
      throw new Error('Synthesize aborted');
    }

    return {
      answer: '',
      tokens: 0,
    };
  }

  /**
   * Execute graph merge task (placeholder)
   */
  private async executeGraphMerge(task: TaskNode, signal: AbortSignal): Promise<unknown> {
    // TODO: Integrate with knowledge graph
    logger.debug('Executing graph merge task', { metadata: { params: task.params } });
    await this.sleep(100);

    if (signal.aborted) {
      throw new Error('Graph merge aborted');
    }

    return {
      entities: [],
      relations: [],
    };
  }

  /**
   * Cancel a running task
   */
  cancelTask(taskId: string): void {
    const abortController = this.abortControllers.get(taskId);
    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(taskId);
    }

    this.runningTasks.delete(taskId);
  }

  /**
   * Cancel all running tasks
   */
  cancelAll(): void {
    for (const taskId of this.runningTasks) {
      this.cancelTask(taskId);
    }
  }

  /**
   * Get currently running task IDs
   */
  getRunningTasks(): string[] {
    return Array.from(this.runningTasks);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

// Singleton instance
export const taskExecutor = new TaskExecutor();
