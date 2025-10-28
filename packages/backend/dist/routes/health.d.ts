/**
 * @fileoverview Health check endpoint for service monitoring
 * @lastmodified 2025-10-28
 *
 * Features: Service health checks, dependency status, uptime tracking
 * Main APIs: GET /health - returns service status and dependencies
 * Constraints: Should be accessible without authentication
 * Patterns: Returns 200 OK if healthy, 503 if dependencies unavailable
 */
export declare const healthRouter: import("express-serve-static-core").Router;
//# sourceMappingURL=health.d.ts.map