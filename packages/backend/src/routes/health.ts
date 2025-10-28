/**
 * @fileoverview Health check endpoint for service monitoring
 * @lastmodified 2025-10-28
 *
 * Features: Service health checks, dependency status, uptime tracking
 * Main APIs: GET /health - returns service status and dependencies
 * Constraints: Should be accessible without authentication
 * Patterns: Returns 200 OK if healthy, 503 if dependencies unavailable
 */

import { Router, Request, Response } from 'express';

import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const healthRouter = Router();

/**
 * Health check response interface
 */
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  dependencies: {
    [key: string]: {
      status: 'up' | 'down';
      latency_ms?: number;
      error?: string;
    };
  };
}

/**
 * Check dependency health
 */
async function checkDependencies() {
  const dependencies: HealthResponse['dependencies'] = {};

  // TODO: Implement actual health checks for each service
  // For now, return mock status

  dependencies['neo4j'] = { status: 'up', latency_ms: 5 };
  dependencies['opensearch'] = { status: 'up', latency_ms: 10 };
  dependencies['redis'] = { status: 'up', latency_ms: 2 };

  return dependencies;
}

/**
 * GET /health
 * Returns service health status
 */
healthRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const startTime = Date.now();
    const dependencies = await checkDependencies();

    // Determine overall status
    const hasDownDependency = Object.values(dependencies).some((dep) => dep.status === 'down');
    const status: HealthResponse['status'] = hasDownDependency ? 'degraded' : 'healthy';

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '0.1.0',
      dependencies,
    };

    const latency = Date.now() - startTime;

    logger.info('Health check', {
      metadata: {
        status,
        latency_ms: latency,
      },
    });

    const statusCode = status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  })
);
