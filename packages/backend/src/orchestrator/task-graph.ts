/**
 * @fileoverview Task graph (DAG) data structure for orchestration
 * @lastmodified 2025-11-05
 *
 * Features: DAG representation, task nodes, dependency management, cycle detection
 * Main APIs: TaskGraph, TaskNode, addTask, addDependency, topologicalSort
 * Constraints: Must be acyclic, supports task types: search/fetch/extract/index/retrieve/synthesize/graph.merge
 * Patterns: Directed Acyclic Graph (DAG), topological sort, dependency resolution
 */

import { nanoid } from 'nanoid';

import { logger } from '../utils/logger';

/**
 * Task types supported by the orchestrator
 */
export type TaskType =
  | 'search' // Search for relevant documents
  | 'fetch' // Fetch web pages
  | 'extract' // Extract content from fetched pages
  | 'index' // Index extracted content
  | 'retrieve' // Retrieve documents from index
  | 'synthesize' // Synthesize answer from retrieved docs
  | 'graph.merge'; // Merge concepts into knowledge graph

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Task node in the task graph
 */
export interface TaskNode {
  id: string;
  type: TaskType;
  status: TaskStatus;
  params: Record<string, unknown>;
  dependencies: string[]; // IDs of tasks this depends on
  dependents: string[]; // IDs of tasks that depend on this
  result?: unknown;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Task graph execution statistics
 */
export interface GraphStats {
  totalTasks: number;
  pendingTasks: number;
  readyTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  depth: number; // Longest path from root to leaf
}

/**
 * Task graph - represents a DAG of research tasks
 */
export class TaskGraph {
  private tasks: Map<string, TaskNode>;

  private readonly runId: string;

  private readonly createdAt: string;

  constructor(runId: string) {
    this.tasks = new Map();
    this.runId = runId;
    this.createdAt = new Date().toISOString();
  }

  /**
   * Add a task to the graph
   */
  addTask(type: TaskType, params: Record<string, unknown> = {}, maxRetries: number = 3): string {
    const id = nanoid();

    const task: TaskNode = {
      id,
      type,
      status: 'pending',
      params,
      dependencies: [],
      dependents: [],
      retryCount: 0,
      maxRetries,
      createdAt: new Date().toISOString(),
    };

    this.tasks.set(id, task);

    logger.debug('Task added to graph', {
      metadata: {
        run_id: this.runId,
        task_id: id,
        type,
      },
    });

    return id;
  }

  /**
   * Add a dependency between tasks
   */
  addDependency(taskId: string, dependsOnId: string): void {
    const task = this.tasks.get(taskId);
    const dependsOn = this.tasks.get(dependsOnId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (!dependsOn) {
      throw new Error(`Dependency task not found: ${dependsOnId}`);
    }

    // Check if adding this dependency would create a cycle
    if (this.wouldCreateCycle(taskId, dependsOnId)) {
      throw new Error(`Adding dependency ${dependsOnId} → ${taskId} would create a cycle`);
    }

    // Add dependency
    if (!task.dependencies.includes(dependsOnId)) {
      task.dependencies.push(dependsOnId);
    }

    // Add dependent
    if (!dependsOn.dependents.includes(taskId)) {
      dependsOn.dependents.push(taskId);
    }

    logger.debug('Dependency added', {
      metadata: {
        run_id: this.runId,
        task_id: taskId,
        depends_on: dependsOnId,
      },
    });
  }

  /**
   * Check if adding a dependency would create a cycle
   */
  private wouldCreateCycle(fromId: string, toId: string): boolean {
    // If toId can reach fromId, then adding fromId → toId would create a cycle
    return this.canReach(toId, fromId);
  }

  /**
   * Check if one task can reach another via dependencies
   */
  private canReach(fromId: string, toId: string): boolean {
    if (fromId === toId) {
      return true;
    }

    const visited = new Set<string>();
    const queue: string[] = [fromId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const current = this.tasks.get(currentId);
      if (!current) continue;

      // Check dependencies
      for (const depId of current.dependencies) {
        if (depId === toId) {
          return true;
        }
        queue.push(depId);
      }
    }

    return false;
  }

  /**
   * Get a task by ID
   */
  getTask(id: string): TaskNode | undefined {
    return this.tasks.get(id);
  }

  /**
   * Update task status
   */
  updateTaskStatus(id: string, status: TaskStatus, result?: unknown, error?: string): void {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    task.status = status;

    if (status === 'running' && !task.startedAt) {
      task.startedAt = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      task.completedAt = new Date().toISOString();
    }

    if (result !== undefined) {
      task.result = result;
    }

    if (error) {
      task.error = error;
    }

    logger.debug('Task status updated', {
      metadata: {
        run_id: this.runId,
        task_id: id,
        status,
        has_error: !!error,
      },
    });
  }

  /**
   * Get all tasks ready to execute (dependencies satisfied)
   */
  getReadyTasks(): TaskNode[] {
    const readyTasks: TaskNode[] = [];

    for (const task of this.tasks.values()) {
      if (task.status !== 'pending') {
        continue;
      }

      // Check if all dependencies are completed
      const allDependenciesCompleted = task.dependencies.every((depId) => {
        const dep = this.tasks.get(depId);
        return dep?.status === 'completed';
      });

      if (allDependenciesCompleted) {
        task.status = 'ready';
        readyTasks.push(task);
      }
    }

    return readyTasks;
  }

  /**
   * Get all tasks (useful for debugging)
   */
  getAllTasks(): TaskNode[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): TaskNode[] {
    return Array.from(this.tasks.values()).filter((task) => task.status === status);
  }

  /**
   * Get tasks by type
   */
  getTasksByType(type: TaskType): TaskNode[] {
    return Array.from(this.tasks.values()).filter((task) => task.type === type);
  }

  /**
   * Topological sort of tasks (returns execution order)
   */
  topologicalSort(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) {
        return;
      }

      if (visiting.has(id)) {
        throw new Error('Graph contains a cycle');
      }

      visiting.add(id);

      const task = this.tasks.get(id);
      if (task) {
        // Visit dependencies first
        for (const depId of task.dependencies) {
          visit(depId);
        }
      }

      visiting.delete(id);
      visited.add(id);
      sorted.push(id);
    };

    // Visit all tasks
    for (const id of this.tasks.keys()) {
      visit(id);
    }

    return sorted;
  }

  /**
   * Validate the graph (check for cycles, orphans, missing dependencies)
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for cycles
    try {
      this.topologicalSort();
    } catch (error) {
      errors.push('Graph contains cycles');
    }

    // Check for missing dependencies
    for (const task of this.tasks.values()) {
      for (const depId of task.dependencies) {
        if (!this.tasks.has(depId)) {
          errors.push(`Task ${task.id} depends on missing task ${depId}`);
        }
      }
    }

    // Check for orphaned nodes (tasks with no path to a root)
    const roots = this.getRootTasks();
    if (roots.length === 0 && this.tasks.size > 0) {
      errors.push('No root tasks found (all tasks have dependencies)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get root tasks (tasks with no dependencies)
   */
  getRootTasks(): TaskNode[] {
    return Array.from(this.tasks.values()).filter((task) => task.dependencies.length === 0);
  }

  /**
   * Get leaf tasks (tasks with no dependents)
   */
  getLeafTasks(): TaskNode[] {
    return Array.from(this.tasks.values()).filter((task) => task.dependents.length === 0);
  }

  /**
   * Calculate graph depth (longest path from root to leaf)
   */
  calculateDepth(): number {
    const depths = new Map<string, number>();

    const calculateTaskDepth = (id: string): number => {
      if (depths.has(id)) {
        return depths.get(id)!;
      }

      const task = this.tasks.get(id);
      if (!task) {
        return 0;
      }

      if (task.dependencies.length === 0) {
        depths.set(id, 0);
        return 0;
      }

      const maxDepDep = Math.max(...task.dependencies.map((depId) => calculateTaskDepth(depId)));
      const depth = maxDepDep + 1;
      depths.set(id, depth);
      return depth;
    };

    let maxDepth = 0;
    for (const id of this.tasks.keys()) {
      maxDepth = Math.max(maxDepth, calculateTaskDepth(id));
    }

    return maxDepth;
  }

  /**
   * Get graph statistics
   */
  getStats(): GraphStats {
    const stats: GraphStats = {
      totalTasks: this.tasks.size,
      pendingTasks: 0,
      readyTasks: 0,
      runningTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      depth: this.calculateDepth(),
    };

    for (const task of this.tasks.values()) {
      switch (task.status) {
        case 'pending':
          stats.pendingTasks++;
          break;
        case 'ready':
          stats.readyTasks++;
          break;
        case 'running':
          stats.runningTasks++;
          break;
        case 'completed':
          stats.completedTasks++;
          break;
        case 'failed':
          stats.failedTasks++;
          break;
        case 'cancelled':
          stats.cancelledTasks++;
          break;
      }
    }

    return stats;
  }

  /**
   * Export graph to JSON for persistence/debugging
   */
  toJSON(): {
    runId: string;
    createdAt: string;
    tasks: TaskNode[];
  } {
    return {
      runId: this.runId,
      createdAt: this.createdAt,
      tasks: Array.from(this.tasks.values()),
    };
  }

  /**
   * Import graph from JSON
   */
  static fromJSON(data: { runId: string; createdAt: string; tasks: TaskNode[] }): TaskGraph {
    const graph = new TaskGraph(data.runId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (graph as any).createdAt = data.createdAt;

    for (const task of data.tasks) {
      graph.tasks.set(task.id, task);
    }

    return graph;
  }
}
