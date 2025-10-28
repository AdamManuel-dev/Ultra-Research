# @deep-research/backend API Reference

Complete API reference for all public exports from the `@deep-research/backend` package.

## Table of Contents

- [Application](#application)
- [Services](#services)
  - [Event Bus](#event-bus)
  - [Event Storage](#event-storage)
  - [OpenSearch Event Indexer](#opensearch-event-indexer)
  - [HTTP Client](#http-client)
  - [Rate Limiter](#rate-limiter)
  - [Robots Parser](#robots-parser)
  - [Snapshot Generator](#snapshot-generator)
- [Utilities](#utilities)
  - [Logger](#logger)
  - [Event Producers](#event-producers)
- [Configuration](#configuration)
- [Middleware](#middleware)

---

## Application

### `createApp(): Application`

Creates and configures the Express application.

**Returns:** Configured Express Application instance

**Features:**
- Security middleware (Helmet, CORS)
- Body parsing (JSON, URL-encoded)
- Request logging
- Route registration
- Error handling

**Example:**
```typescript
import { createApp } from '@deep-research/backend';

const app = createApp();
const server = app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

**Exports:** `/src/app.ts`

### `start(): void`

Starts the HTTP server with graceful shutdown handlers.

**Features:**
- Server initialization
- Graceful shutdown on SIGTERM/SIGINT
- Uncaught exception handling
- Unhandled rejection handling
- Configuration validation

**Example:**
```typescript
import { start } from '@deep-research/backend';

start(); // Starts server on configured port
```

**Exports:** `/src/index.ts`

---

## Services

### Event Bus

**Export:** `eventBus` (singleton instance)
**Class:** `EventBus`

#### Methods

##### `publish(event: ResearchEvent): void`

Publishes an event to all subscribers and SSE clients.

**Parameters:**
- `event: ResearchEvent` - Event to publish

**Side Effects:**
- Validates event against schema
- Adds to in-memory history
- Emits to subscribers
- Broadcasts to SSE clients
- Indexes in OpenSearch (async)

**Throws:** Validation error if event is invalid

**Example:**
```typescript
import { eventBus } from '@deep-research/backend';

eventBus.publish({
  ts: new Date().toISOString(),
  run_id: 'run-123',
  step_id: 1,
  agent: 'orchestrator',
  action: 'orchestrator.start',
  input: { query: 'AI research' }
});
```

##### `subscribe(id: string, callback: (event: ResearchEvent) => void, runId?: string): () => void`

Subscribes to events with optional run_id filter.

**Parameters:**
- `id: string` - Unique subscriber identifier
- `callback: (event: ResearchEvent) => void` - Called for each matching event
- `runId?: string` - Optional filter by run_id

**Returns:** Unsubscribe function

**Example:**
```typescript
const unsubscribe = eventBus.subscribe('my-subscriber', (event) => {
  console.log('Event:', event.action);
}, 'run-123');

// Later: unsubscribe
unsubscribe();
```

##### `streamSSE(req: Request, res: Response, runId?: string): void`

Creates Server-Sent Events stream for real-time delivery.

**Parameters:**
- `req: Request` - Express request
- `res: Response` - Express response
- `runId?: string` - Optional filter by run_id

**Example:**
```typescript
import express from 'express';
import { eventBus } from '@deep-research/backend';

const app = express();
app.get('/events/stream', (req, res) => {
  const runId = req.query.run_id as string | undefined;
  eventBus.streamSSE(req, res, runId);
});
```

##### `getHistory(runId?: string, limit?: number): ResearchEvent[]`

Retrieves recent events from in-memory history.

**Parameters:**
- `runId?: string` - Filter by run_id
- `limit?: number` - Max events to return

**Returns:** Array of recent events

##### `getStats(): { subscribers: number; sseClients: number; historySize: number }`

Returns event bus statistics.

**Exports:** `/src/services/event-bus.ts`

---

### Event Storage

**Export:** `eventStorage` (singleton instance)
**Class:** `EventStorage`

#### Methods

##### `store(event: ResearchEvent): void`

Adds event to buffer for batched write to object storage.

##### `flush(partition?: string): Promise<void>`

Flushes buffered events to object storage.

##### `retrieve(runId: string, fromDate?: Date, toDate?: Date): ResearchEvent[]`

Retrieves events from object storage (TODO: implementation pending).

##### `getStats(): { partitions: number; bufferedEvents: number }`

Returns buffer statistics.

**Exports:** `/src/services/event-storage.ts`

---

### OpenSearch Event Indexer

**Export:** `opensearchEventIndexer` (singleton instance)
**Class:** `OpenSearchEventIndexer`

#### Methods

##### `initializeTemplates(): Promise<void>`

Creates index templates for consistent mappings.

##### `indexEvent(event: ResearchEvent): Promise<void>`

Indexes a single event (buffered for bulk operations).

##### `searchEvents(query: EventQuery): Promise<EventSearchResult>`

Searches events with filters.

**Parameters:**
```typescript
interface EventQuery {
  run_id?: string;
  agent?: AgentType;
  action?: EventAction;
  from?: string;  // ISO timestamp
  to?: string;    // ISO timestamp
  limit?: number;
  offset?: number;
}
```

**Returns:**
```typescript
interface EventSearchResult {
  events: ResearchEvent[];
  total: number;
  took_ms: number;
  aggregations?: Record<string, any>;
}
```

##### `aggregateEvents(query: EventQuery, aggregations: Record<string, any>): Promise<EventSearchResult>`

Performs OpenSearch aggregations.

##### `getTimeline(runId: string, interval?: string): Promise<EventSearchResult>`

Gets time-series histogram of events.

**Parameters:**
- `runId: string` - Run identifier
- `interval?: string` - Histogram interval (default: '1h')

##### `getAgentActivity(runId?: string): Promise<EventSearchResult>`

Gets agent activity summary.

##### `healthCheck(): Promise<{ healthy: boolean; cluster?: string; version?: string }>`

Checks OpenSearch cluster health.

**Exports:** `/src/services/opensearch-event-indexer.ts`

---

### HTTP Client

**Export:** `httpClient` (singleton instance)
**Class:** `HttpClient`

#### Methods

##### `fetch(url: string, options?: FetchOptions): Promise<FetchResponse>`

Fetches a URL with full response details.

**Parameters:**
```typescript
interface FetchOptions {
  method?: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
}
```

**Returns:**
```typescript
interface FetchResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  contentLength: number;
  finalUrl: string;
  redirectChain: string[];
  duration_ms: number;
}
```

##### `get(url: string, headers?: Record<string, string>): Promise<FetchResponse>`

Simple GET request.

##### `head(url: string, headers?: Record<string, string>): Promise<FetchResponse>`

HEAD request to check metadata without downloading body.

##### `post(url: string, body: any, headers?: Record<string, string>): Promise<FetchResponse>`

POST request with body.

##### `isAccessible(url: string): Promise<boolean>`

Quick check if URL returns 2xx or 3xx status.

**Exports:** `/src/services/http-client.ts`

---

### Rate Limiter

**Export:** `rateLimiter` (singleton instance)
**Class:** `RateLimiter`

#### Methods

##### `setDomainLimit(url: string, requestsPerSecond: number): void`

Sets custom rate limit for a domain.

##### `canMakeRequest(url: string): boolean`

Checks if request can be made immediately.

##### `recordRequest(url: string): void`

Records a request timestamp.

##### `waitForSlot(url: string): Promise<void>`

Waits until a request slot is available.

##### `acquire(url: string): Promise<void>`

Waits for slot and records request (recommended).

##### `applyRobotsCrawlDelay(url: string, crawlDelaySeconds: number): void`

Applies crawl delay from robots.txt.

##### `getStats(url: string): DomainStats`

Gets current stats for a domain.

**Returns:**
```typescript
{
  domain: string;
  limit: number;
  current_requests: number;
  last_request_ms_ago: number;
}
```

##### `getAllStats(): DomainStats[]`

Gets stats for all tracked domains.

##### `reset(url?: string): void`

Resets rate limit state.

**Exports:** `/src/services/rate-limiter.ts`

---

### Robots Parser

**Export:** `robotsParser` (singleton instance)
**Class:** `RobotsParser`

#### Methods

##### `fetchAndParse(url: string): Promise<RobotsTxt>`

Fetches and parses robots.txt for a domain.

**Returns:**
```typescript
interface RobotsTxt {
  rules: RobotRule[];
  sitemaps: string[];
  parsed_at: string;
  url: string;
}
```

##### `isAllowed(url: string, userAgent?: string): Promise<boolean>`

Checks if URL is allowed to be crawled.

**Parameters:**
- `url: string` - Full URL to check
- `userAgent?: string` - Bot user agent (default: 'DeepResearchBot')

**Returns:** `true` if allowed, `false` if disallowed

##### `getCrawlDelay(url: string, userAgent?: string): Promise<number | null>`

Gets crawl delay in seconds for a domain.

##### `getSitemaps(url: string): Promise<string[]>`

Gets sitemap URLs from robots.txt.

##### `parse(content: string, url: string): RobotsTxt`

Parses robots.txt content.

##### `clearCache(url?: string): void`

Clears cached robots.txt.

**Exports:** `/src/services/robots-parser.ts`

---

### Snapshot Generator

**Export:** `snapshotGenerator` (singleton instance)
**Class:** `SnapshotGenerator`

#### Methods

##### `generateSnapshot(query: SnapshotQuery): Promise<EventSnapshot>`

Generates a snapshot at a specific point.

**Parameters:**
```typescript
interface SnapshotQuery {
  run_id: string;
  timestamp?: string;
  step_id?: number;
}
```

**Returns:**
```typescript
interface EventSnapshot {
  snapshot_id: string;
  run_id: string;
  timestamp: string;
  step_id: number;
  events: ResearchEvent[];
  metadata: {
    event_count: number;
    agents: string[];
    actions: string[];
    total_cost_usd: number;
    duration_ms: number;
  };
}
```

##### `getLatestSnapshot(runId: string): Promise<EventSnapshot>`

Gets the most recent snapshot for a run.

##### `getSnapshotAtStep(runId: string, stepId: number): Promise<EventSnapshot>`

Gets snapshot at a specific step.

##### `getSnapshotDiff(runId: string, fromStepId: number, toStepId: number): Promise<SnapshotDiff>`

Gets diff between two snapshots.

**Returns:**
```typescript
{
  from_step: number;
  to_step: number;
  added_events: ResearchEvent[];
  metadata: {
    event_count: number;
    cost_delta_usd: number;
  };
}
```

##### `replayToSnapshot(snapshotId: string, stateReducer: Function, initialState: any): Promise<{ state: any; events: ResearchEvent[] }>`

Replays events through a reducer to reconstruct state.

##### `buildStateSummary(events: ResearchEvent[]): StateSummary`

Builds a summary from events.

**Exports:** `/src/services/snapshot-generator.ts`

---

## Utilities

### Logger

**Export:** `logger` (Winston Logger instance)

#### Methods

##### `logger.info(message: string, metadata?: object): void`

Logs informational messages.

##### `logger.error(message: string, metadata?: object): void`

Logs error messages.

##### `logger.warn(message: string, metadata?: object): void`

Logs warning messages.

##### `logger.debug(message: string, metadata?: object): void`

Logs debug messages.

#### Functions

##### `logRequest(method: string, path: string, statusCode: number, durationMs: number, meta?: LogMetadata): void`

Logs HTTP request/response with timing.

##### `logError(message: string, error: Error, meta?: LogMetadata): void`

Logs errors with full stack trace.

##### `createChildLogger(defaultMeta: LogMetadata): winston.Logger`

Creates child logger with default metadata.

**Exports:** `/src/utils/logger.ts`

---

### Event Producers

Factory functions for creating type-safe events.

#### Orchestrator Events

- `createOrchestratorStartEvent(runId, input)`
- `createOrchestratorPlanEvent(runId, output, decision?)`
- `createOrchestratorCommandEvent(runId, input)`
- `createFrontierUpdateEvent(runId, output)`
- `createTaskScheduledEvent(runId, output)`
- `createOrchestratorCompleteEvent(runId, output, cost?)`

#### Fetch Events

- `createFetchStartEvent(runId, input, source)`
- `createFetchCompleteEvent(runId, input, output, artifacts?)`
- `createFetchErrorEvent(runId, input, error)`
- `createFetchCachedEvent(runId, input, output)`

#### Extraction Events

- `createExtractStartEvent(runId, input, source)`
- `createExtractCompleteEvent(runId, input, output, artifacts?)`
- `createExtractErrorEvent(runId, input, error)`

#### Indexing Events

- `createIndexWriteEvent(runId, input, output, artifacts?)`
- `createIndexQueryEvent(runId, input, output, computeMs?)`
- `createIndexUpdateEvent(runId, input, output)`

#### Graph Events

- `createGraphMergeEvent(runId, input, output, artifacts?)`
- `createGraphQueryEvent(runId, input, output)`
- `createGraphUpdateEvent(runId, input, output)`

#### Synthesis Events

- `createSynthesisStartEvent(runId, input)`
- `createSynthesisCompleteEvent(runId, input, output, cost?, artifacts?)`
- `createSynthesisErrorEvent(runId, input, error)`

#### System Events

- `createSystemHealthEvent(runId, output)`
- `createSystemErrorEvent(runId, error, metadata?)`

#### Utility Functions

##### `publishEvent(event: ResearchEvent): void`

Publishes an event to the event bus.

##### `emitEvent(event: ResearchEvent): void`

Alias for `publishEvent()`.

##### `resetRun(runId: string): void`

Resets step counter for a run.

##### `getCurrentStep(runId: string): number`

Gets current step number for a run.

**Exports:** `/src/utils/event-producers.ts`

---

## Configuration

### `config: AppConfig`

Singleton configuration object loaded from environment variables.

**Interface:**
```typescript
interface AppConfig {
  // Application
  nodeEnv: string;
  port: number;
  logLevel: string;

  // OpenAI
  openai: {
    apiKey: string;
    model: string;
    embeddingModel: string;
  };

  // Neo4j
  neo4j: {
    uri: string;
    user: string;
    password: string;
  };

  // OpenSearch
  opensearch: {
    node: string;
    username: string;
    password: string;
    indexPrefix: string;
  };

  // Redis
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };

  // S3/MinIO
  s3: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    region: string;
  };

  // Browserbase (optional)
  browserbase?: {
    apiKey: string;
    projectId: string;
  };

  // Fetch Pipeline
  fetch: {
    userAgent: string;
    rateLimitDefault: number;
    timeoutMs: number;
    maxRetries: number;
  };

  // Security
  security: {
    jwtSecret: string;
    sessionSecret: string;
    corsOrigin: string;
  };

  // Observability
  telemetry: {
    enabled: boolean;
    endpoint?: string;
  };
}
```

**Example:**
```typescript
import { config } from '@deep-research/backend';

console.log('Port:', config.port);
console.log('OpenSearch node:', config.opensearch.node);
console.log('Environment:', config.nodeEnv);
```

### `loadConfig(): AppConfig`

Loads and validates configuration from environment.

**Throws:** `ConfigError` if required variables are missing

**Exports:** `/src/config/index.ts`

---

## Middleware

### `errorHandler(err: Error, req: Request, res: Response, next: NextFunction)`

Global error handling middleware.

**Features:**
- Handles AppError (operational errors)
- Handles unexpected errors (programming errors)
- Logs errors with request context
- Formats consistent error responses
- Hides details in production

**Must be registered last** in middleware chain.

### `notFound(req: Request, res: Response)`

404 Not Found handler for undefined routes.

**Must be registered before error handler** but after all routes.

### `asyncHandler(fn: AsyncRouteHandler): RouteHandler`

Wrapper for async route handlers that catches promise rejections.

**Example:**
```typescript
import { asyncHandler } from '@deep-research/backend';

router.get('/events', asyncHandler(async (req, res) => {
  const events = await getEvents();
  res.json(events);
}));
```

**Exports:** `/src/middleware/errorHandler.ts`

---

## Type Definitions

All type definitions are imported from `@deep-research/shared`:

- `ResearchEvent` - Core event type
- `EventQuery` - Event search query parameters
- `AgentType` - Agent type union
- `EventAction` - Event action union
- `AppError` - Operational error class
- `ConfigError` - Configuration error class

---

## Package Exports

### Main Entry Point

```typescript
// src/index.ts
export { start } from './index';
export { createApp } from './app';
```

### Services

```typescript
// Services are singleton instances
export { eventBus } from './services/event-bus';
export { eventStorage } from './services/event-storage';
export { opensearchEventIndexer } from './services/opensearch-event-indexer';
export { httpClient } from './services/http-client';
export { rateLimiter } from './services/rate-limiter';
export { robotsParser } from './services/robots-parser';
export { snapshotGenerator } from './services/snapshot-generator';
```

### Utilities

```typescript
export { logger, logRequest, logError, createChildLogger } from './utils/logger';
export * from './utils/event-producers';
```

### Configuration

```typescript
export { config, loadConfig } from './config';
```

### Middleware

```typescript
export { errorHandler, notFound, asyncHandler } from './middleware/errorHandler';
```

---

## Usage Example

Complete example of using the backend package:

```typescript
import {
  createApp,
  eventBus,
  logger,
  createOrchestratorStartEvent,
  publishEvent,
  resetRun,
  config
} from '@deep-research/backend';

// 1. Create Express app
const app = createApp();

// 2. Subscribe to events
eventBus.subscribe('my-app', (event) => {
  logger.info('Received event', {
    metadata: {
      run_id: event.run_id,
      action: event.action
    }
  });
});

// 3. Start a research run
const runId = 'run-123';
resetRun(runId);

const event = createOrchestratorStartEvent(runId, {
  query: 'AI research',
  options: { depth: 3 }
});

publishEvent(event);

// 4. Start server
app.listen(config.port, () => {
  logger.info('Server started', {
    metadata: {
      port: config.port,
      env: config.nodeEnv
    }
  });
});
```

---

## Related Documentation

- [REST API Endpoints](./modules/api.md) - HTTP API documentation
- [Services](./modules/services.md) - Detailed service documentation
- [Middleware](./modules/middleware.md) - Middleware components
- [Utilities](./modules/utils.md) - Logger and event producers
- [README](./README.md) - Getting started guide
