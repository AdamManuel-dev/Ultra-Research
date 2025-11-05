/**
 * @fileoverview Tests for task graph
 * @lastmodified 2025-11-05
 */

import { TaskGraph, TaskType, TaskStatus } from './task-graph';

describe('TaskGraph', () => {
  let graph: TaskGraph;

  beforeEach(() => {
    graph = new TaskGraph('test-run-123');
  });

  describe('addTask', () => {
    it('should add a task to the graph', () => {
      const id = graph.addTask('search', { query: 'test' });

      expect(id).toBeTruthy();

      const task = graph.getTask(id);
      expect(task).toBeDefined();
      expect(task?.type).toBe('search');
      expect(task?.status).toBe('pending');
      expect(task?.params).toEqual({ query: 'test' });
    });

    it('should generate unique IDs for tasks', () => {
      const id1 = graph.addTask('search');
      const id2 = graph.addTask('fetch');

      expect(id1).not.toBe(id2);
    });

    it('should set default maxRetries to 3', () => {
      const id = graph.addTask('search');
      const task = graph.getTask(id);

      expect(task?.maxRetries).toBe(3);
    });

    it('should allow custom maxRetries', () => {
      const id = graph.addTask('search', {}, 5);
      const task = graph.getTask(id);

      expect(task?.maxRetries).toBe(5);
    });
  });

  describe('addDependency', () => {
    it('should add a dependency between tasks', () => {
      const searchId = graph.addTask('search');
      const fetchId = graph.addTask('fetch');

      graph.addDependency(fetchId, searchId);

      const fetch = graph.getTask(fetchId);
      const search = graph.getTask(searchId);

      expect(fetch?.dependencies).toContain(searchId);
      expect(search?.dependents).toContain(fetchId);
    });

    it('should throw error for non-existent task', () => {
      const searchId = graph.addTask('search');

      expect(() => {
        graph.addDependency(searchId, 'non-existent');
      }).toThrow('Dependency task not found');
    });

    it('should throw error for non-existent dependent', () => {
      const searchId = graph.addTask('search');

      expect(() => {
        graph.addDependency('non-existent', searchId);
      }).toThrow('Task not found');
    });

    it('should detect cycles', () => {
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');
      const task3 = graph.addTask('extract');

      graph.addDependency(task2, task1);
      graph.addDependency(task3, task2);

      // Adding task1 → task3 would create a cycle
      expect(() => {
        graph.addDependency(task1, task3);
      }).toThrow('would create a cycle');
    });

    it('should detect simple self-cycle', () => {
      const task1 = graph.addTask('search');

      expect(() => {
        graph.addDependency(task1, task1);
      }).toThrow('would create a cycle');
    });
  });

  describe('getReadyTasks', () => {
    it('should return tasks with no dependencies', () => {
      const searchId = graph.addTask('search');
      graph.addTask('fetch');

      const ready = graph.getReadyTasks();

      expect(ready).toHaveLength(2);
      expect(ready.map((t) => t.id)).toContain(searchId);
    });

    it('should return tasks whose dependencies are completed', () => {
      const searchId = graph.addTask('search');
      const fetchId = graph.addTask('fetch');

      graph.addDependency(fetchId, searchId);

      // Initially, only search is ready
      let ready = graph.getReadyTasks();
      expect(ready).toHaveLength(1);
      expect(ready[0]?.id).toBe(searchId);

      // Complete search
      graph.updateTaskStatus(searchId, 'completed');

      // Now fetch should be ready
      ready = graph.getReadyTasks();
      expect(ready).toHaveLength(1);
      expect(ready[0]?.id).toBe(fetchId);
    });

    it('should not return completed tasks', () => {
      const searchId = graph.addTask('search');
      graph.updateTaskStatus(searchId, 'completed');

      const ready = graph.getReadyTasks();

      expect(ready).toHaveLength(0);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', () => {
      const id = graph.addTask('search');

      graph.updateTaskStatus(id, 'running');

      const task = graph.getTask(id);
      expect(task?.status).toBe('running');
    });

    it('should set startedAt when status becomes running', () => {
      const id = graph.addTask('search');

      graph.updateTaskStatus(id, 'running');

      const task = graph.getTask(id);
      expect(task?.startedAt).toBeTruthy();
    });

    it('should set completedAt when status becomes completed', () => {
      const id = graph.addTask('search');

      graph.updateTaskStatus(id, 'completed');

      const task = graph.getTask(id);
      expect(task?.completedAt).toBeTruthy();
    });

    it('should store result', () => {
      const id = graph.addTask('search');

      graph.updateTaskStatus(id, 'completed', { data: 'test' });

      const task = graph.getTask(id);
      expect(task?.result).toEqual({ data: 'test' });
    });

    it('should store error', () => {
      const id = graph.addTask('search');

      graph.updateTaskStatus(id, 'failed', undefined, 'Test error');

      const task = graph.getTask(id);
      expect(task?.error).toBe('Test error');
    });
  });

  describe('getTasksByStatus', () => {
    it('should filter tasks by status', () => {
      const id1 = graph.addTask('search');
      const id2 = graph.addTask('fetch');
      const id3 = graph.addTask('extract');

      graph.updateTaskStatus(id1, 'completed');
      graph.updateTaskStatus(id2, 'running');

      const pending = graph.getTasksByStatus('pending');
      const completed = graph.getTasksByStatus('completed');
      const running = graph.getTasksByStatus('running');

      expect(pending).toHaveLength(1);
      expect(pending[0]?.id).toBe(id3);
      expect(completed).toHaveLength(1);
      expect(completed[0]?.id).toBe(id1);
      expect(running).toHaveLength(1);
      expect(running[0]?.id).toBe(id2);
    });
  });

  describe('getTasksByType', () => {
    it('should filter tasks by type', () => {
      const searchId = graph.addTask('search');
      graph.addTask('fetch');
      graph.addTask('fetch');

      const searchTasks = graph.getTasksByType('search');
      const fetchTasks = graph.getTasksByType('fetch');

      expect(searchTasks).toHaveLength(1);
      expect(searchTasks[0]?.id).toBe(searchId);
      expect(fetchTasks).toHaveLength(2);
    });
  });

  describe('topologicalSort', () => {
    it('should return tasks in dependency order', () => {
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');
      const task3 = graph.addTask('extract');

      graph.addDependency(task2, task1);
      graph.addDependency(task3, task2);

      const sorted = graph.topologicalSort();

      expect(sorted.indexOf(task1)).toBeLessThan(sorted.indexOf(task2));
      expect(sorted.indexOf(task2)).toBeLessThan(sorted.indexOf(task3));
    });

    it('should handle parallel branches', () => {
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');
      const task3 = graph.addTask('fetch');
      const task4 = graph.addTask('synthesize');

      graph.addDependency(task2, task1);
      graph.addDependency(task3, task1);
      graph.addDependency(task4, task2);
      graph.addDependency(task4, task3);

      const sorted = graph.topologicalSort();

      // task1 should be before task2 and task3
      expect(sorted.indexOf(task1)).toBeLessThan(sorted.indexOf(task2));
      expect(sorted.indexOf(task1)).toBeLessThan(sorted.indexOf(task3));

      // task2 and task3 should be before task4
      expect(sorted.indexOf(task2)).toBeLessThan(sorted.indexOf(task4));
      expect(sorted.indexOf(task3)).toBeLessThan(sorted.indexOf(task4));
    });
  });

  describe('validate', () => {
    it('should return valid for acyclic graph', () => {
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');

      graph.addDependency(task2, task1);

      const result = graph.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing dependencies', () => {
      const task1 = graph.addTask('search');

      // Manually add a missing dependency (simulate corruption)
      const graphTask = graph.getTask(task1);
      if (graphTask) {
        graphTask.dependencies.push('missing-task-id');
      }

      const result = graph.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('depends on missing task')
      );
    });

    it('should detect no root tasks', () => {
      // Create a graph where all tasks have dependencies (impossible to start)
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');

      // Manually create circular dependencies
      const t1 = graph.getTask(task1);
      const t2 = graph.getTask(task2);
      if (t1 && t2) {
        t1.dependencies = [task2];
        t2.dependencies = [task1];
        t1.dependents = [task2];
        t2.dependents = [task1];
      }

      const result = graph.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('cycle'));
    });
  });

  describe('getRootTasks', () => {
    it('should return tasks with no dependencies', () => {
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');
      const task3 = graph.addTask('extract');

      graph.addDependency(task3, task2);

      const roots = graph.getRootTasks();

      expect(roots).toHaveLength(2);
      expect(roots.map((t) => t.id)).toContain(task1);
      expect(roots.map((t) => t.id)).toContain(task2);
    });
  });

  describe('getLeafTasks', () => {
    it('should return tasks with no dependents', () => {
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');
      const task3 = graph.addTask('extract');

      graph.addDependency(task2, task1);
      graph.addDependency(task3, task1);

      const leaves = graph.getLeafTasks();

      expect(leaves).toHaveLength(2);
      expect(leaves.map((t) => t.id)).toContain(task2);
      expect(leaves.map((t) => t.id)).toContain(task3);
    });
  });

  describe('calculateDepth', () => {
    it('should calculate depth for linear chain', () => {
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');
      const task3 = graph.addTask('extract');

      graph.addDependency(task2, task1);
      graph.addDependency(task3, task2);

      const depth = graph.calculateDepth();

      expect(depth).toBe(2); // 0 → 1 → 2
    });

    it('should calculate depth for branched graph', () => {
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');
      const task3 = graph.addTask('fetch');
      const task4 = graph.addTask('extract');
      const task5 = graph.addTask('synthesize');

      graph.addDependency(task2, task1);
      graph.addDependency(task3, task1);
      graph.addDependency(task4, task3);
      graph.addDependency(task5, task4);

      const depth = graph.calculateDepth();

      expect(depth).toBe(3); // 0 → 1 → 2 → 3 (longest path)
    });

    it('should return 0 for single task', () => {
      graph.addTask('search');

      const depth = graph.calculateDepth();

      expect(depth).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const task1 = graph.addTask('search');
      const task2 = graph.addTask('fetch');
      const task3 = graph.addTask('extract');

      graph.updateTaskStatus(task1, 'completed');
      graph.updateTaskStatus(task2, 'running');

      const stats = graph.getStats();

      expect(stats.totalTasks).toBe(3);
      expect(stats.completedTasks).toBe(1);
      expect(stats.runningTasks).toBe(1);
      expect(stats.pendingTasks).toBe(1);
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize and deserialize graph', () => {
      const task1 = graph.addTask('search', { query: 'test' });
      const task2 = graph.addTask('fetch');

      graph.addDependency(task2, task1);
      graph.updateTaskStatus(task1, 'completed', { data: 'result' });

      const json = graph.toJSON();
      const restored = TaskGraph.fromJSON(json);

      expect(restored.getAllTasks()).toHaveLength(2);

      const restoredTask1 = restored.getTask(task1);
      expect(restoredTask1?.status).toBe('completed');
      expect(restoredTask1?.result).toEqual({ data: 'result' });
      expect(restoredTask1?.params).toEqual({ query: 'test' });

      const restoredTask2 = restored.getTask(task2);
      expect(restoredTask2?.dependencies).toContain(task1);
    });
  });
});
