/**
 * @fileoverview Express application setup with middleware and routes
 * @lastmodified 2025-10-28
 *
 * Features: Express server with CORS, helmet, logging, error handling
 * Main APIs: createApp() - returns configured Express app
 * Constraints: Apply security middleware, enable CORS for frontend
 * Patterns: Middleware order matters - error handler must be last
 */
import { Application } from 'express';
/**
 * Create and configure Express application
 */
export declare function createApp(): Application;
//# sourceMappingURL=app.d.ts.map