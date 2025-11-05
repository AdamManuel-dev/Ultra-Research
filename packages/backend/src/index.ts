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
import { opensearchEventIndexer } from './services/opensearch-event-indexer';
import { logger } from './utils/logger';

/**
 * Start the server
 */
async function start() {
  try {
    logger.info('Starting Deep Research Cockpit backend', {
      metadata: {
        nodeEnv: config.nodeEnv,
        port: config.port,
        logLevel: config.logLevel,
      },
    });

    // Initialize OpenSearch templates
    logger.info('Initializing OpenSearch event index templates');
    try {
      await opensearchEventIndexer.initializeTemplates();
      logger.info('OpenSearch templates initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize OpenSearch templates', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          note: 'Server will continue, but event indexing may not work',
        },
      });
    }

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
    const shutdown = async () => {
      logger.info('Received shutdown signal, closing server gracefully');

      // Close OpenSearch indexer (flush remaining events)
      try {
        await opensearchEventIndexer.close();
        logger.info('OpenSearch indexer closed');
      } catch (error) {
        logger.error('Error closing OpenSearch indexer', {
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }

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
      void shutdown();
    });
    process.on('SIGINT', () => {
      void shutdown();
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
  void start();
}

export { start };
