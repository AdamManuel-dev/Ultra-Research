/**
 * @fileoverview Express application setup with middleware and routes
 * @lastmodified 2025-10-28
 *
 * Features: Express server with CORS, helmet, logging, error handling
 * Main APIs: createApp() - returns configured Express app
 * Constraints: Apply security middleware, enable CORS for frontend
 * Patterns: Middleware order matters - error handler must be last
 */

import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';

import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import { eventsRouter } from './routes/events';
import { eventsAdvancedRouter } from './routes/events-advanced';
import { fetchRouter } from './routes/fetch';
import { healthRouter } from './routes/health';
import searchRouter from './routes/search';
import { logger } from './utils/logger';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.security.corsOrigin,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, _res, next) => {
    logger.info('Incoming request', {
      metadata: {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
      },
    });
    next();
  });

  // Routes
  app.use('/health', healthRouter);
  app.use('/events', eventsRouter);
  app.use('/events', eventsAdvancedRouter);
  app.use('/fetch', fetchRouter);
  app.use('/search', searchRouter);

  // 404 handler
  app.use(notFound);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
