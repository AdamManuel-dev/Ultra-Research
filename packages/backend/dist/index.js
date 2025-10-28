"use strict";
/**
 * @fileoverview Backend server entry point
 * @lastmodified 2025-10-28
 *
 * Features: Server initialization, graceful shutdown, error handling
 * Main APIs: Server startup and lifecycle management
 * Constraints: Validates configuration before starting
 * Patterns: Graceful shutdown on SIGTERM/SIGINT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const app_1 = require("./app");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
/**
 * Start the server
 */
async function start() {
    try {
        logger_1.logger.info('Starting Deep Research Cockpit backend', {
            metadata: {
                nodeEnv: config_1.config.nodeEnv,
                port: config_1.config.port,
                logLevel: config_1.config.logLevel,
            },
        });
        const app = (0, app_1.createApp)();
        const server = app.listen(config_1.config.port, () => {
            logger_1.logger.info(`Server listening on port ${config_1.config.port}`, {
                metadata: {
                    port: config_1.config.port,
                    nodeEnv: config_1.config.nodeEnv,
                },
            });
        });
        // Graceful shutdown
        const shutdown = async () => {
            logger_1.logger.info('Received shutdown signal, closing server gracefully');
            server.close(() => {
                logger_1.logger.info('Server closed');
                process.exit(0);
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught exception', {
                metadata: {
                    error: {
                        message: error.message,
                        stack: error.stack,
                    },
                },
            });
            process.exit(1);
        });
        process.on('unhandledRejection', (reason) => {
            logger_1.logger.error('Unhandled rejection', {
                metadata: {
                    reason,
                },
            });
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', {
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
//# sourceMappingURL=index.js.map