/**
 * @fileoverview Backend server entry point
 * @lastmodified 2025-10-28
 *
 * Features: Server initialization, graceful shutdown, error handling
 * Main APIs: Server startup and lifecycle management
 * Constraints: Validates configuration before starting
 * Patterns: Graceful shutdown on SIGTERM/SIGINT
 */

import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

/**
 * Start the server
 */
function start() {
  try {
    logger.info('Starting Deep Research Cockpit backend', {
      metadata: {
        nodeEnv: config.nodeEnv,
        port: config.port,
        logLevel: config.logLevel,
      },
    });

    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`, {
        metadata: {
          port: config.port,
          nodeEnv: config.nodeEnv,
        },
      });
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Received shutdown signal, closing server gracefully');

      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => {
      shutdown();
    });
    process.on('SIGINT', () => {
      shutdown();
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', {
        metadata: {
          error: {
            message: error.message,
            stack: error.stack,
          },
        },
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled rejection', {
        metadata: {
          reason,
        },
      });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    process.exit(1);
  }
}

// Start server if this is the main module
if (require.main === module) {
  start();
}

export { start };
