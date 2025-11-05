/**
 * @fileoverview Orchestrator API routes
 * @lastmodified 2025-11-05
 */

import express, { Request, Response } from 'express';

import { orchestrator } from '../orchestrator/orchestrator';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /orchestrator/runs
 * Start a new research run
 */
router.post('/runs', async (req: Request, res: Response) => {
  try {
    const { query, strategy, config, userId } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: 'Query is required and must be a string',
      });
      return;
    }

    const runId = await orchestrator.startRun(query, {
      strategy,
      config,
      userId,
    });

    res.status(201).json({
      runId,
      query,
      status: 'running',
    });
  } catch (error) {
    logger.error('Start run request failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to start run',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /orchestrator/runs/:runId
 * Get run status
 */
router.get('/runs/:runId', async (req: Request, res: Response) => {
  try {
    const runId = req.params['runId'];
    if (!runId) {
      res.status(400).json({ error: 'Missing run ID' });
      return;
    }

    const status = await orchestrator.getRunStatus(runId);

    if (!status) {
      res.status(404).json({
        error: 'Run not found',
      });
      return;
    }

    res.json(status);
  } catch (error) {
    logger.error('Get run status request failed', {
      metadata: {
        run_id: req.params['runId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to get run status',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /orchestrator/runs/:runId/full
 * Get full run context
 */
router.get('/runs/:runId/full', async (req: Request, res: Response) => {
  try {
    const runId = req.params['runId'];
    if (!runId) {
      res.status(400).json({ error: 'Missing run ID' });
      return;
    }

    const context = await orchestrator.getRunContext(runId);

    if (!context) {
      res.status(404).json({
        error: 'Run not found',
      });
      return;
    }

    res.json({
      runId: context.runId,
      query: context.query,
      status: context.status,
      config: context.config,
      graph: context.graph.toJSON(),
      createdAt: context.createdAt,
      startedAt: context.startedAt,
      completedAt: context.completedAt,
      error: context.error,
      metadata: context.metadata,
    });
  } catch (error) {
    logger.error('Get run context request failed', {
      metadata: {
        run_id: req.params['runId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to get run context',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /orchestrator/runs/:runId/pause
 * Pause a running run
 */
router.post('/runs/:runId/pause', async (req: Request, res: Response) => {
  try {
    const runId = req.params['runId'];
    if (!runId) {
      res.status(400).json({ error: 'Missing run ID' });
      return;
    }

    await orchestrator.pauseRun(runId);

    res.json({
      runId,
      status: 'paused',
    });
  } catch (error) {
    logger.error('Pause run request failed', {
      metadata: {
        run_id: req.params['runId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to pause run',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /orchestrator/runs/:runId/resume
 * Resume a paused run
 */
router.post('/runs/:runId/resume', async (req: Request, res: Response) => {
  try {
    const runId = req.params['runId'];
    if (!runId) {
      res.status(400).json({ error: 'Missing run ID' });
      return;
    }

    await orchestrator.resumeRun(runId);

    res.json({
      runId,
      status: 'running',
    });
  } catch (error) {
    logger.error('Resume run request failed', {
      metadata: {
        run_id: req.params['runId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to resume run',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /orchestrator/runs/:runId/cancel
 * Cancel a run
 */
router.post('/runs/:runId/cancel', async (req: Request, res: Response) => {
  try {
    const runId = req.params['runId'];
    if (!runId) {
      res.status(400).json({ error: 'Missing run ID' });
      return;
    }

    await orchestrator.cancelRun(runId);

    res.json({
      runId,
      status: 'cancelled',
    });
  } catch (error) {
    logger.error('Cancel run request failed', {
      metadata: {
        run_id: req.params['runId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to cancel run',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /orchestrator/runs/:runId
 * Delete a run
 */
router.delete('/runs/:runId', async (req: Request, res: Response) => {
  try {
    const runId = req.params['runId'];
    if (!runId) {
      res.status(400).json({ error: 'Missing run ID' });
      return;
    }

    const deleted = await orchestrator.deleteRun(runId);

    if (deleted) {
      res.json({
        runId,
        deleted: true,
      });
    } else {
      res.status(404).json({
        error: 'Run not found',
      });
    }
  } catch (error) {
    logger.error('Delete run request failed', {
      metadata: {
        run_id: req.params['runId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to delete run',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /orchestrator/runs/:runId/weights
 * Update strategy weights
 */
router.post('/runs/:runId/weights', async (req: Request, res: Response) => {
  try {
    const runId = req.params['runId'];
    if (!runId) {
      res.status(400).json({ error: 'Missing run ID' });
      return;
    }

    const { novelty, centrality, disagreement, recency } = req.body;

    const weights: Record<string, number> = {};
    if (typeof novelty === 'number') weights['novelty'] = novelty;
    if (typeof centrality === 'number') weights['centrality'] = centrality;
    if (typeof disagreement === 'number') weights['disagreement'] = disagreement;
    if (typeof recency === 'number') weights['recency'] = recency;

    await orchestrator.updateWeights(runId, weights);

    res.json({
      runId,
      weights,
    });
  } catch (error) {
    logger.error('Update weights request failed', {
      metadata: {
        run_id: req.params['runId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to update weights',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /orchestrator/users/:userId/runs
 * List runs for a user
 */
router.get('/users/:userId/runs', async (req: Request, res: Response) => {
  try {
    const userId = req.params['userId'];
    if (!userId) {
      res.status(400).json({ error: 'Missing user ID' });
      return;
    }

    const runs = await orchestrator.listUserRuns(userId);

    res.json({
      userId,
      runs: runs.map((run) => ({
        runId: run.runId,
        query: run.query,
        status: run.status,
        createdAt: run.createdAt,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
      })),
      count: runs.length,
    });
  } catch (error) {
    logger.error('List user runs request failed', {
      metadata: {
        user_id: req.params['userId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to list user runs',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
