/**
 * @fileoverview Advanced event query API with OpenSearch integration
 * @lastmodified 2025-10-28
 *
 * Features: Advanced filtering, aggregations, snapshots, analytics
 * Main APIs: GET /events/search, GET /events/aggregate, GET /events/snapshot
 * Constraints: ≤500ms query latency target
 * Patterns: RESTful API with query parameter validation
 */

import { EventQuery } from '@deep-research/shared';
import { Router, Request, Response } from 'express';

import { asyncHandler } from '../middleware/errorHandler';
import { opensearchEventIndexer } from '../services/opensearch-event-indexer';
import { snapshotGenerator } from '../services/snapshot-generator';
import { logger } from '../utils/logger';

export const eventsAdvancedRouter = Router();

/**
 * GET /events/search
 * Advanced event search with filters
 */
eventsAdvancedRouter.get(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    const query: EventQuery = {
      run_id: req.query['run_id'] as string | undefined,
      agent: req.query['agent'] as EventQuery['agent'],
      action: req.query['action'] as EventQuery['action'],
      from: req.query['from'] as string | undefined,
      to: req.query['to'] as string | undefined,
      limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 100,
      offset: req.query['offset'] ? parseInt(req.query['offset'] as string, 10) : 0,
    };

    const result = await opensearchEventIndexer.searchEvents(query);

    logger.info('Advanced event search completed', {
      metadata: {
        query,
        result_count: result.events.length,
        took_ms: result.took_ms,
      },
    });

    res.json({
      success: true,
      data: {
        events: result.events,
        total: result.total,
        took_ms: result.took_ms,
      },
      query,
    });
  })
);

/**
 * GET /events/aggregate
 * Event aggregations for analytics
 */
eventsAdvancedRouter.get(
  '/aggregate',
  asyncHandler(async (req: Request, res: Response) => {
    const aggregationType = req.query['type'] as string;
    const runId = req.query['run_id'] as string | undefined;

    let result;

    switch (aggregationType) {
      case 'timeline':
        result = await opensearchEventIndexer.getTimeline(
          runId!,
          (req.query['interval'] as string) || '1h'
        );
        break;

      case 'agent_activity':
        result = await opensearchEventIndexer.getAgentActivity(runId);
        break;

      case 'custom':
        const customAggs = req.body.aggregations || {};
        result = await opensearchEventIndexer.aggregateEvents({ run_id: runId }, customAggs);
        break;

      default:
        res.status(400).json({
          success: false,
          error: 'Invalid aggregation type. Use: timeline, agent_activity, or custom',
        });
        return;
    }

    res.json({
      success: true,
      data: {
        aggregations: result.aggregations,
        total: result.total,
        took_ms: result.took_ms,
      },
      query: {
        type: aggregationType,
        run_id: runId,
      },
    });
  })
);

/**
 * GET /events/snapshot
 * Generate snapshot at a specific point
 */
eventsAdvancedRouter.get(
  '/snapshot',
  asyncHandler(async (req: Request, res: Response) => {
    const runId = req.query['run_id'] as string;
    const timestamp = req.query['timestamp'] as string | undefined;
    const stepId = req.query['step_id'] ? parseInt(req.query['step_id'] as string, 10) : undefined;

    if (!runId) {
      res.status(400).json({
        success: false,
        error: 'run_id is required',
      });
      return;
    }

    const snapshot = await snapshotGenerator.generateSnapshot({
      run_id: runId,
      timestamp,
      step_id: stepId,
    });

    res.json({
      success: true,
      data: snapshot,
    });
  })
);

/**
 * GET /events/snapshot/latest
 * Get latest snapshot for a run
 */
eventsAdvancedRouter.get(
  '/snapshot/latest',
  asyncHandler(async (req: Request, res: Response) => {
    const runId = req.query['run_id'] as string;

    if (!runId) {
      res.status(400).json({
        success: false,
        error: 'run_id is required',
      });
      return;
    }

    const snapshot = await snapshotGenerator.getLatestSnapshot(runId);

    res.json({
      success: true,
      data: snapshot,
    });
  })
);

/**
 * GET /events/snapshot/diff
 * Get diff between two snapshots
 */
eventsAdvancedRouter.get(
  '/snapshot/diff',
  asyncHandler(async (req: Request, res: Response) => {
    const runId = req.query['run_id'] as string;
    const fromStep = req.query['from_step']
      ? parseInt(req.query['from_step'] as string, 10)
      : undefined;
    const toStep = req.query['to_step'] ? parseInt(req.query['to_step'] as string, 10) : undefined;

    if (!runId || fromStep === undefined || toStep === undefined) {
      res.status(400).json({
        success: false,
        error: 'run_id, from_step, and to_step are required',
      });
      return;
    }

    const diff = await snapshotGenerator.getSnapshotDiff(runId, fromStep, toStep);

    res.json({
      success: true,
      data: diff,
    });
  })
);

/**
 * GET /events/analytics/costs
 * Cost analytics across runs or agents
 */
eventsAdvancedRouter.get(
  '/analytics/costs',
  asyncHandler(async (req: Request, res: Response) => {
    const runId = req.query['run_id'] as string | undefined;
    const from = req.query['from'] as string | undefined;
    const to = req.query['to'] as string | undefined;

    const result = await opensearchEventIndexer.aggregateEvents(
      { run_id: runId, from, to },
      {
        total_cost: {
          sum: {
            field: 'cost.usd',
          },
        },
        cost_by_agent: {
          terms: {
            field: 'agent',
            size: 20,
          },
          aggs: {
            total_cost: {
              sum: {
                field: 'cost.usd',
              },
            },
            total_tokens: {
              sum: {
                field: 'cost.tokens.input',
              },
            },
          },
        },
        cost_by_action: {
          terms: {
            field: 'action',
            size: 50,
          },
          aggs: {
            total_cost: {
              sum: {
                field: 'cost.usd',
              },
            },
          },
        },
      }
    );

    res.json({
      success: true,
      data: {
        aggregations: result.aggregations,
        total: result.total,
        took_ms: result.took_ms,
      },
      query: {
        run_id: runId,
        from,
        to,
      },
    });
  })
);

/**
 * GET /events/analytics/performance
 * Performance analytics (durations, latencies)
 */
eventsAdvancedRouter.get(
  '/analytics/performance',
  asyncHandler(async (req: Request, res: Response) => {
    const runId = req.query['run_id'] as string | undefined;
    const agent = req.query['agent'] as string | undefined;

    const result = await opensearchEventIndexer.aggregateEvents(
      { run_id: runId, agent: agent as EventQuery['agent'] },
      {
        avg_compute: {
          avg: {
            field: 'cost.compute_ms',
          },
        },
        max_compute: {
          max: {
            field: 'cost.compute_ms',
          },
        },
        compute_percentiles: {
          percentiles: {
            field: 'cost.compute_ms',
            percents: [50, 90, 95, 99],
          },
        },
        by_action: {
          terms: {
            field: 'action',
            size: 50,
          },
          aggs: {
            avg_duration: {
              avg: {
                field: 'cost.compute_ms',
              },
            },
          },
        },
      }
    );

    res.json({
      success: true,
      data: {
        aggregations: result.aggregations,
        total: result.total,
        took_ms: result.took_ms,
      },
      query: {
        run_id: runId,
        agent,
      },
    });
  })
);

/**
 * GET /events/analytics/errors
 * Error analytics and trends
 */
eventsAdvancedRouter.get(
  '/analytics/errors',
  asyncHandler(async (req: Request, res: Response) => {
    const runId = req.query['run_id'] as string | undefined;
    const from = req.query['from'] as string | undefined;
    const to = req.query['to'] as string | undefined;

    // Search for events with errors
    const result = await opensearchEventIndexer.aggregateEvents(
      { run_id: runId, from, to },
      {
        errors_by_agent: {
          terms: {
            field: 'agent',
            size: 20,
          },
        },
        errors_by_code: {
          terms: {
            field: 'error.code',
            size: 50,
          },
        },
        error_timeline: {
          date_histogram: {
            field: 'ts',
            fixed_interval: '1h',
          },
        },
      }
    );

    res.json({
      success: true,
      data: {
        aggregations: result.aggregations,
        total: result.total,
        took_ms: result.took_ms,
      },
      query: {
        run_id: runId,
        from,
        to,
      },
    });
  })
);
