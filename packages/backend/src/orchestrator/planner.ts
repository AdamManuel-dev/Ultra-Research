/**
 * @fileoverview Planner for task decomposition and graph generation
 * @lastmodified 2025-11-05
 *
 * Features: Query decomposition, task graph generation, plan creation
 * Main APIs: Planner, createPlan, decompose
 * Constraints: Generates DAG with search/fetch/extract/index/retrieve/synthesize/graph.merge tasks
 * Patterns: Strategy pattern for different planning strategies
 */

import { eventBus } from '../services/event-bus';
import { logger } from '../utils/logger';
import {
  createOrchestratorStartEvent,
  createOrchestratorPlanEvent,
} from '../utils/event-producers';

import { TaskGraph } from './task-graph';

/**
 * Plan result
 */
export interface Plan {
  runId: string;
  query: string;
  graph: TaskGraph;
  strategy: PlanningStrategy;
  createdAt: string;
}

/**
 * Planning strategy
 */
export type PlanningStrategy = 'simple' | 'breadth-first' | 'depth-first' | 'adaptive';

/**
 * Planner - creates task graphs from queries
 */
export class Planner {
  /**
   * Create a research plan from a query
   */
  async createPlan(runId: string, query: string, strategy: PlanningStrategy = 'simple'): Promise<Plan> {
    logger.info('Creating plan', {
      metadata: {
        run_id: runId,
        query,
        strategy,
      },
    });

    // Emit orchestrator start event
    await eventBus.publish(createOrchestratorStartEvent(runId, { query }));

    const graph = new TaskGraph(runId);

    // Decompose query into tasks based on strategy
    switch (strategy) {
      case 'simple':
        this.createSimplePlan(graph, query);
        break;
      case 'breadth-first':
        this.createBreadthFirstPlan(graph, query);
        break;
      case 'depth-first':
        this.createDepthFirstPlan(graph, query);
        break;
      case 'adaptive':
        this.createAdaptivePlan(graph, query);
        break;
      default:
        throw new Error(`Unknown planning strategy: ${strategy}`);
    }

    // Validate the generated graph
    const validation = graph.validate();
    if (!validation.valid) {
      logger.error('Generated invalid task graph', {
        metadata: {
          run_id: runId,
          errors: validation.errors,
        },
      });
      throw new Error(`Invalid task graph: ${validation.errors.join(', ')}`);
    }

    const plan: Plan = {
      runId,
      query,
      graph,
      strategy,
      createdAt: new Date().toISOString(),
    };

    // Emit plan created event
    const stats = graph.getStats();
    await eventBus.publish(
      createOrchestratorPlanEvent(runId, {
        tasks: [],
        strategy,
      })
    );

    logger.info('Plan created', {
      metadata: {
        run_id: runId,
        total_tasks: stats.totalTasks,
        depth: stats.depth,
        strategy,
      },
    });

    return plan;
  }

  /**
   * Simple planning strategy: Linear pipeline
   * search → fetch → extract → index → retrieve → synthesize
   */
  private createSimplePlan(graph: TaskGraph, query: string): void {
    // 1. Search for relevant documents
    const searchTask = graph.addTask('search', {
      query,
      maxResults: 10,
    });

    // 2. Fetch the top results
    const fetchTask = graph.addTask('fetch', {
      sources: 'search_results',
      maxConcurrent: 5,
    });
    graph.addDependency(fetchTask, searchTask);

    // 3. Extract content from fetched pages
    const extractTask = graph.addTask('extract', {
      extractType: 'article',
      convertMarkdown: true,
    });
    graph.addDependency(extractTask, fetchTask);

    // 4. Index the extracted content
    const indexTask = graph.addTask('index', {
      chunkSize: 500,
      chunkOverlap: 50,
    });
    graph.addDependency(indexTask, extractTask);

    // 5. Retrieve relevant chunks for the query
    const retrieveTask = graph.addTask('retrieve', {
      query,
      topK: 10,
      hybridWeight: 0.5,
    });
    graph.addDependency(retrieveTask, indexTask);

    // 6. Synthesize answer from retrieved chunks
    const synthesizeTask = graph.addTask('synthesize', {
      query,
      maxTokens: 2000,
      temperature: 0.7,
    });
    graph.addDependency(synthesizeTask, retrieveTask);

    // 7. Merge concepts into knowledge graph
    const graphMergeTask = graph.addTask('graph.merge', {
      extractEntities: true,
      extractRelations: true,
    });
    graph.addDependency(graphMergeTask, synthesizeTask);
  }

  /**
   * Breadth-first planning strategy: Parallel exploration
   * Explores multiple search directions in parallel
   */
  private createBreadthFirstPlan(graph: TaskGraph, query: string): void {
    // Multiple parallel search strategies
    const searchTasks: string[] = [];

    // General web search
    searchTasks.push(
      graph.addTask('search', {
        query,
        source: 'web',
        maxResults: 5,
      })
    );

    // Academic search
    searchTasks.push(
      graph.addTask('search', {
        query,
        source: 'academic',
        maxResults: 5,
      })
    );

    // News search
    searchTasks.push(
      graph.addTask('search', {
        query,
        source: 'news',
        maxResults: 5,
      })
    );

    // Parallel fetch for each search result set
    const fetchTasks: string[] = [];
    for (const searchTask of searchTasks) {
      const fetchTask = graph.addTask('fetch', {
        sources: 'search_results',
        maxConcurrent: 3,
      });
      graph.addDependency(fetchTask, searchTask);
      fetchTasks.push(fetchTask);
    }

    // Extract and index in parallel
    const indexTasks: string[] = [];
    for (const fetchTask of fetchTasks) {
      const extractTask = graph.addTask('extract', {
        extractType: 'article',
      });
      graph.addDependency(extractTask, fetchTask);

      const indexTask = graph.addTask('index', {});
      graph.addDependency(indexTask, extractTask);
      indexTasks.push(indexTask);
    }

    // Single retrieve after all indexing
    const retrieveTask = graph.addTask('retrieve', {
      query,
      topK: 20,
    });
    for (const indexTask of indexTasks) {
      graph.addDependency(retrieveTask, indexTask);
    }

    // Synthesize and merge
    const synthesizeTask = graph.addTask('synthesize', { query });
    graph.addDependency(synthesizeTask, retrieveTask);

    const graphMergeTask = graph.addTask('graph.merge', {});
    graph.addDependency(graphMergeTask, synthesizeTask);
  }

  /**
   * Depth-first planning strategy: Deep dive on single thread
   * Follows citations and related concepts deeply
   */
  private createDepthFirstPlan(graph: TaskGraph, query: string): void {
    // Start with initial search
    const searchTask = graph.addTask('search', {
      query,
      maxResults: 3,
    });

    let previousTask = searchTask;

    // Iterative deepening: 3 levels
    for (let depth = 0; depth < 3; depth++) {
      const fetchTask = graph.addTask('fetch', {
        sources: 'search_results',
      });
      graph.addDependency(fetchTask, previousTask);

      const extractTask = graph.addTask('extract', {
        extractCitations: true,
      });
      graph.addDependency(extractTask, fetchTask);

      const indexTask = graph.addTask('index', {});
      graph.addDependency(indexTask, extractTask);

      // Search for citations at next depth
      if (depth < 2) {
        const nextSearchTask = graph.addTask('search', {
          query: 'from_citations',
          maxResults: 3,
        });
        graph.addDependency(nextSearchTask, indexTask);
        previousTask = nextSearchTask;
      } else {
        previousTask = indexTask;
      }
    }

    // Final retrieval and synthesis
    const retrieveTask = graph.addTask('retrieve', {
      query,
      topK: 15,
    });
    graph.addDependency(retrieveTask, previousTask);

    const synthesizeTask = graph.addTask('synthesize', { query });
    graph.addDependency(synthesizeTask, retrieveTask);

    const graphMergeTask = graph.addTask('graph.merge', {});
    graph.addDependency(graphMergeTask, synthesizeTask);
  }

  /**
   * Adaptive planning strategy: Dynamically adjust based on results
   * (Simplified version - full implementation would use feedback loops)
   */
  private createAdaptivePlan(graph: TaskGraph, query: string): void {
    // Start with balanced approach
    const searchTask = graph.addTask('search', {
      query,
      maxResults: 10,
      adaptive: true,
    });

    const fetchTask = graph.addTask('fetch', {
      sources: 'search_results',
      maxConcurrent: 5,
    });
    graph.addDependency(fetchTask, searchTask);

    const extractTask = graph.addTask('extract', {
      extractType: 'auto',
    });
    graph.addDependency(extractTask, fetchTask);

    const indexTask = graph.addTask('index', {
      chunkSize: 500,
    });
    graph.addDependency(indexTask, extractTask);

    // Conditional branching based on initial results
    // Branch 1: Deep dive
    const deepSearchTask = graph.addTask('search', {
      query: 'follow_citations',
      maxResults: 5,
    });
    graph.addDependency(deepSearchTask, indexTask);

    const deepFetchTask = graph.addTask('fetch', {
      sources: 'search_results',
    });
    graph.addDependency(deepFetchTask, deepSearchTask);

    const deepIndexTask = graph.addTask('index', {});
    graph.addDependency(deepIndexTask, deepFetchTask);

    // Branch 2: Broad exploration
    const broadSearchTask = graph.addTask('search', {
      query: 'expand_concepts',
      maxResults: 5,
    });
    graph.addDependency(broadSearchTask, indexTask);

    const broadFetchTask = graph.addTask('fetch', {
      sources: 'search_results',
    });
    graph.addDependency(broadFetchTask, broadSearchTask);

    const broadIndexTask = graph.addTask('index', {});
    graph.addDependency(broadIndexTask, broadFetchTask);

    // Merge both branches
    const retrieveTask = graph.addTask('retrieve', {
      query,
      topK: 20,
    });
    graph.addDependency(retrieveTask, deepIndexTask);
    graph.addDependency(retrieveTask, broadIndexTask);

    const synthesizeTask = graph.addTask('synthesize', { query });
    graph.addDependency(synthesizeTask, retrieveTask);

    const graphMergeTask = graph.addTask('graph.merge', {});
    graph.addDependency(graphMergeTask, synthesizeTask);
  }

  /**
   * Analyze query complexity to suggest strategy
   */
  suggestStrategy(query: string): PlanningStrategy {
    // Simple heuristics for strategy selection
    const wordCount = query.split(/\s+/).length;

    if (wordCount <= 5) {
      return 'simple';
    }

    if (query.toLowerCase().includes('compare') || query.toLowerCase().includes('versus')) {
      return 'breadth-first';
    }

    if (query.toLowerCase().includes('deep') || query.toLowerCase().includes('detailed')) {
      return 'depth-first';
    }

    return 'adaptive';
  }
}

// Singleton instance
export const planner = new Planner();
