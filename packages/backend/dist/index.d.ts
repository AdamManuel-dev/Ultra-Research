/**
 * @fileoverview Backend server entry point
 * @lastmodified 2025-10-28
 *
 * Features: Server initialization, graceful shutdown, error handling
 * Main APIs: Server startup and lifecycle management
 * Constraints: Validates configuration before starting
 * Patterns: Graceful shutdown on SIGTERM/SIGINT
 */
/**
 * Start the server
 */
declare function start(): Promise<void>;
export { start };
//# sourceMappingURL=index.d.ts.map