/**
 * @fileoverview Event streaming and query API endpoints
 * @lastmodified 2025-10-28
 *
 * Features: SSE event streaming, event query API, event history
 * Main APIs: GET /events/stream (SSE), GET /events (query), POST /events (publish)
 * Constraints: Authentication required for publishing, public streaming
 * Patterns: RESTful API, Server-Sent Events for real-time updates
 */

import { ResearchEvent } from '@deep-research/shared';
import { Router, Request, Response } from 'express';

import { asyncHandler } from '../middleware/errorHandler';
import { eventBus } from '../services/event-bus';
import { logger } from '../utils/logger';

export const eventsRouter = Router();

/**
 * GET /events/stream
 * Server-Sent Events stream for real-time events
 */
eventsRouter.get('/stream', (req: Request, res: Response) => {
  const runId = req.query['run_id'] as string | undefined;

  logger.info('Starting SSE stream', {
    metadata: {
      run_id: runId,
      ip: req.ip,
    },
  });

  eventBus.streamSSE(req, res, runId);
});

/**
 * GET /events
 * Query event history
 */
eventsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const runId = req.query['run_id'] as string | undefined;
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 100;

    const events = eventBus.getHistory(runId, limit);

    res.json({
      events,
      count: events.length,
      filters: {
        run_id: runId,
        limit,
      },
    });
  })
);

/**
 * POST /events
 * Publish a new event
 */
eventsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const event = req.body as ResearchEvent;

    // Publish to event bus
    await eventBus.publish(event);

    res.status(201).json({
      success: true,
      event: {
        run_id: event.run_id,
        step_id: event.step_id,
        action: event.action,
      },
    });
  })
);

/**
 * GET /events/stats
 * Get event bus statistics
 */
eventsRouter.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = eventBus.getStats();
    res.json(stats);
  })
);
