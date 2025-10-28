# Utilities Documentation

Documentation for utility modules in the `@deep-research/backend` package.

## Table of Contents

- [Logger](#logger)
- [Event Producers](#event-producers)

---

## Logger

**File:** `/src/utils/logger.ts`

Structured logging with Winston for development and production environments.

### Features

- Winston-based structured logging
- Environment-aware formatting (pretty-print dev, JSON production)
- Correlation ID support via child loggers
- Multiple transports (console, file)
- Configurable log levels
- Error stack trace logging

### Log Levels

```
error: 0
warn: 1
info: 2
http: 3
verbose: 4
debug: 5
silly: 6
```

**Configuration:** Set via `LOG_LEVEL` environment variable (default: `info`)

### Core Logger API

#### `logger.info(message: string, metadata?: object)`

Logs informational messages.

**Example:**
```typescript
import { logger } from './utils/logger';

logger.info('Server started', {
  metadata: {
    port: 3000,
    env: 'development'
  }
});
```

**Output (Development):**
```
10:30:00.123 [info] Server started {"port":3000,"env":"development"}
```

**Output (Production):**
```json
{
  "level": "info",
  "message": "Server started",
  "metadata": {
    "port": 3000,
    "env": "development"
  },
  "timestamp": "2025-10-28T10:30:00.123Z"
}
```

#### `logger.error(message: string, metadata?: object)`

Logs error messages with stack traces.

**Example:**
```typescript
logger.error('Failed to connect to database', {
  metadata: {
    error: {
      message: 'Connection refused',
      code: 'ECONNREFUSED'
    }
  }
});
```

#### `logger.warn(message: string, metadata?: object)`

Logs warning messages.

**Example:**
```typescript
logger.warn('Rate limit approaching', {
  metadata: {
    current: 95,
    limit: 100
  }
});
```

#### `logger.debug(message: string, metadata?: object)`

Logs debug messages (only visible when `LOG_LEVEL=debug`).

**Example:**
```typescript
logger.debug('Cache hit', {
  metadata: {
    key: 'user:123',
    ttl: 3600
  }
});
```

### Specialized Logging Functions

#### `logRequest(method: string, path: string, statusCode: number, durationMs: number, meta?: LogMetadata)`

Logs HTTP request/response with timing.

**Example:**
```typescript
import { logRequest } from './utils/logger';

const startTime = Date.now();
// ... handle request ...
const duration = Date.now() - startTime;

logRequest('GET', '/events', 200, duration, {
  run_id: 'run-123',
  result_count: 42
});
```

**Output:**
```json
{
  "level": "info",
  "message": "HTTP request",
  "metadata": {
    "method": "GET",
    "path": "/events",
    "statusCode": 200,
    "duration_ms": 125,
    "run_id": "run-123",
    "result_count": 42
  },
  "timestamp": "2025-10-28T10:30:00.123Z"
}
```

#### `logError(message: string, error: Error, meta?: LogMetadata)`

Logs errors with full stack trace.

**Example:**
```typescript
import { logError } from './utils/logger';

try {
  await riskyOperation();
} catch (error) {
  logError('Operation failed', error as Error, {
    operation: 'fetchUrl',
    url: 'https://example.com'
  });
}
```

**Output:**
```json
{
  "level": "error",
  "message": "Operation failed",
  "metadata": {
    "error": {
      "message": "Network timeout",
      "name": "TimeoutError",
      "stack": "TimeoutError: Network timeout\n    at ..."
    },
    "operation": "fetchUrl",
    "url": "https://example.com"
  },
  "timestamp": "2025-10-28T10:30:00.123Z"
}
```

### Child Loggers (Correlation IDs)

Create child loggers with default metadata for correlation tracking.

#### `createChildLogger(defaultMeta: LogMetadata): winston.Logger`

**Example:**
```typescript
import { createChildLogger } from './utils/logger';

// Create logger with run_id context
const runLogger = createChildLogger({
  run_id: 'run-123',
  step_id: 1
});

// All logs from this logger include run_id and step_id
runLogger.info('Starting orchestrator', {
  metadata: { query: 'AI research' }
});
```

**Output:**
```json
{
  "level": "info",
  "message": "Starting orchestrator",
  "metadata": {
    "run_id": "run-123",
    "step_id": 1,
    "query": "AI research"
  },
  "timestamp": "2025-10-28T10:30:00.123Z"
}
```

### Log Metadata Interface

```typescript
interface LogMetadata {
  run_id?: string;
  step_id?: number;
  agent?: string;
  action?: string;
  duration_ms?: number;
  error?: Error;
  [key: string]: any;
}
```

### Environment Configurations

#### Development

**Format:** Pretty-printed with colors
```
10:30:00.123 [info] Server started {"port":3000}
```

**Transports:**
- Console (colorized)

#### Production

**Format:** JSON (parseable by log aggregators)
```json
{
  "level": "info",
  "message": "Server started",
  "metadata": {"port": 3000},
  "timestamp": "2025-10-28T10:30:00.123Z"
}
```

**Transports:**
- Console (JSON)
- File: `logs/combined.log` (all logs)
- File: `logs/error.log` (errors only)

### Best Practices

**1. Include Relevant Metadata**

```typescript
// ✅ Good - includes context
logger.info('Event published', {
  metadata: {
    run_id: event.run_id,
    step_id: event.step_id,
    action: event.action,
    latency_ms: latency
  }
});

// ❌ Bad - missing context
logger.info('Event published');
```

**2. Use Child Loggers for Correlation**

```typescript
// ✅ Good - automatic correlation
const runLogger = createChildLogger({ run_id: 'run-123' });
runLogger.info('Step 1 complete');
runLogger.info('Step 2 complete');

// ❌ Bad - manual run_id in every call
logger.info('Step 1 complete', { metadata: { run_id: 'run-123' } });
logger.info('Step 2 complete', { metadata: { run_id: 'run-123' } });
```

**3. Log Errors with Context**

```typescript
// ✅ Good - includes error and context
logError('Failed to index event', error, {
  event_id: `${event.run_id}-${event.step_id}`,
  index: indexName
});

// ❌ Bad - just the error message
logger.error(error.message);
```

**4. Use Appropriate Log Levels**

```typescript
logger.error('Database connection failed');     // System can't function
logger.warn('Rate limit at 90%');               // Potential issue
logger.info('Request completed');                // Normal operation
logger.debug('Cache hit for key user:123');     // Debug info
```

---

## Event Producers

**File:** `/src/utils/event-producers.ts`

Factory functions for creating consistent, type-safe research events.

### Features

- Typed event creation for all agents and actions
- Auto-incrementing step IDs per run
- Consistent event structure
- Run context tracking
- Direct publishing to event bus

### Core Concepts

#### Run Context

Tracks step counters for each run_id:

```typescript
class RunContext {
  private stepCounters: Map<string, number>;

  getNextStepId(runId: string): number;
  resetRun(runId: string): void;
  getCurrentStep(runId: string): number;
}
```

**Step IDs:** Auto-increment starting from 1 for each run.

#### Base Event Creator

```typescript
function createEvent(
  runId: string,
  agent: AgentType,
  action: EventAction,
  data?: Partial<ResearchEvent>
): ResearchEvent
```

**Auto-populates:**
- `ts` - Current timestamp (ISO 8601)
- `run_id` - From parameter
- `step_id` - Auto-incremented
- `agent` - From parameter
- `action` - From parameter

### Event Publishing

#### `publishEvent(event: ResearchEvent): void`

Publishes an event to the event bus.

**Example:**
```typescript
import { createOrchestratorStartEvent, publishEvent } from './utils/event-producers';

const event = createOrchestratorStartEvent('run-123', {
  query: 'AI research',
  options: { depth: 3 }
});

publishEvent(event);
```

#### `emitEvent(event: ResearchEvent): void`

Alias for `publishEvent()`.

### Orchestrator Events

#### `createOrchestratorStartEvent(runId: string, input: { query: string; options?: object }): ResearchEvent`

Creates orchestrator start event.

**Example:**
```typescript
const event = createOrchestratorStartEvent('run-123', {
  query: 'Deep learning architectures',
  options: { maxDepth: 5, budget: 10.0 }
});
publishEvent(event);
```

#### `createOrchestratorPlanEvent(runId: string, output: { tasks: Task[]; strategy: string }, decision?: { reason: string; score?: number }): ResearchEvent`

Creates orchestrator plan event.

**Example:**
```typescript
const event = createOrchestratorPlanEvent('run-123', {
  tasks: [
    { task_id: 't1', type: 'fetch', priority: 1 },
    { task_id: 't2', type: 'extract', priority: 2 }
  ],
  strategy: 'breadth-first'
}, {
  reason: 'Prioritize breadth to discover more sources',
  score: 0.85
});
publishEvent(event);
```

#### `createOrchestratorCommandEvent(runId: string, input: { command: string; params?: object }): ResearchEvent`

#### `createFrontierUpdateEvent(runId: string, output: { added: Item[]; removed: Item[]; total_items: number }): ResearchEvent`

#### `createTaskScheduledEvent(runId: string, output: { task_id: string; task_type: string; scheduled_at: string }): ResearchEvent`

#### `createOrchestratorCompleteEvent(runId: string, output: { status: string; total_steps: number; duration_ms: number }, cost?: Cost): ResearchEvent`

### Fetch Events

#### `createFetchStartEvent(runId: string, input: { url: string; method?: string }, source: { type: 'url' | 'query'; value: string }): ResearchEvent`

**Example:**
```typescript
const event = createFetchStartEvent('run-123', {
  url: 'https://example.com',
  method: 'GET'
}, {
  type: 'url',
  value: 'https://example.com'
});
publishEvent(event);
```

#### `createFetchCompleteEvent(runId: string, input: { url: string }, output: { status_code: number; content_length: number; content_type: string; duration_ms: number }, artifacts?: { urls?: string[]; document_ids?: string[] }): ResearchEvent`

**Example:**
```typescript
const event = createFetchCompleteEvent('run-123', {
  url: 'https://example.com'
}, {
  status_code: 200,
  content_length: 15234,
  content_type: 'text/html',
  duration_ms: 523
}, {
  document_ids: ['doc-abc123']
});
publishEvent(event);
```

#### `createFetchErrorEvent(runId: string, input: { url: string }, error: { message: string; code?: string; stack?: string }): ResearchEvent`

#### `createFetchCachedEvent(runId: string, input: { url: string }, output: { cache_hit: boolean; cache_age_ms?: number }): ResearchEvent`

### Extraction Events

#### `createExtractStartEvent(runId: string, input: { url: string; html_size: number }, source: { type: 'url'; value: string }): ResearchEvent`

#### `createExtractCompleteEvent(runId: string, input: { url: string }, output: { text_length: number; markdown_length: number; extraction_method: string; duration_ms: number }, artifacts?: { document_ids?: string[]; file_paths?: string[] }): ResearchEvent`

**Example:**
```typescript
const event = createExtractCompleteEvent('run-123', {
  url: 'https://example.com'
}, {
  text_length: 5234,
  markdown_length: 6123,
  extraction_method: 'readability',
  duration_ms: 234
}, {
  document_ids: ['doc-abc123'],
  file_paths: ['/data/run-123/doc-abc123.md']
});
publishEvent(event);
```

#### `createExtractErrorEvent(runId: string, input: { url: string }, error: { message: string; code?: string }): ResearchEvent`

### Indexing Events

#### `createIndexWriteEvent(runId: string, input: { document_id: string; content_length: number }, output: { indexed: boolean; chunks: number; duration_ms: number }, artifacts?: { document_ids?: string[] }): ResearchEvent`

**Example:**
```typescript
const event = createIndexWriteEvent('run-123', {
  document_id: 'doc-abc123',
  content_length: 5234
}, {
  indexed: true,
  chunks: 12,
  duration_ms: 156
}, {
  document_ids: ['doc-abc123']
});
publishEvent(event);
```

#### `createIndexQueryEvent(runId: string, input: { query: string; limit?: number }, output: { results: number; top_score: number; duration_ms: number }, computeMs?: number): ResearchEvent`

#### `createIndexUpdateEvent(runId: string, input: { document_id: string; updates: object }, output: { updated: boolean; duration_ms: number }): ResearchEvent`

### Graph Events

#### `createGraphMergeEvent(runId: string, input: { source_id: string; entities: number; relations: number }, output: { nodes_created: number; edges_created: number; nodes_updated: number; edges_updated: number; duration_ms: number }, artifacts?: { node_ids?: string[]; edge_ids?: string[] }): ResearchEvent`

**Example:**
```typescript
const event = createGraphMergeEvent('run-123', {
  source_id: 'doc-abc123',
  entities: 15,
  relations: 23
}, {
  nodes_created: 12,
  edges_created: 20,
  nodes_updated: 3,
  edges_updated: 3,
  duration_ms: 342
}, {
  node_ids: ['n1', 'n2', 'n3'],
  edge_ids: ['e1', 'e2', 'e3']
});
publishEvent(event);
```

#### `createGraphQueryEvent(runId: string, input: { query: string; params?: object }, output: { nodes: number; edges: number; duration_ms: number }): ResearchEvent`

#### `createGraphUpdateEvent(runId: string, input: { node_id?: string; edge_id?: string; updates: object }, output: { updated: boolean; duration_ms: number }): ResearchEvent`

### Synthesis Events

#### `createSynthesisStartEvent(runId: string, input: { query: string; document_count: number; synthesis_type: string }): ResearchEvent`

#### `createSynthesisCompleteEvent(runId: string, input: { query: string }, output: { result_length: number; sources_cited: number; duration_ms: number }, cost?: Cost, artifacts?: { file_paths?: string[] }): ResearchEvent`

**Example:**
```typescript
const event = createSynthesisCompleteEvent('run-123', {
  query: 'What are the latest trends in AI?'
}, {
  result_length: 2340,
  sources_cited: 12,
  duration_ms: 5234
}, {
  usd: 0.25,
  tokens: { input: 15000, output: 800 }
}, {
  file_paths: ['/data/run-123/synthesis.md']
});
publishEvent(event);
```

#### `createSynthesisErrorEvent(runId: string, input: { query: string }, error: { message: string; code?: string }): ResearchEvent`

### System Events

#### `createSystemHealthEvent(runId: string, output: { status: string; components: object }): ResearchEvent`

**Example:**
```typescript
const event = createSystemHealthEvent('run-123', {
  status: 'healthy',
  components: {
    neo4j: { healthy: true, latency_ms: 5 },
    opensearch: { healthy: true, latency_ms: 10 },
    redis: { healthy: true, latency_ms: 2 }
  }
});
publishEvent(event);
```

#### `createSystemErrorEvent(runId: string, error: { message: string; code?: string; stack?: string }, metadata?: object): ResearchEvent`

### Utility Functions

#### `resetRun(runId: string): void`

Resets step counter for a run (starts from 1 again).

**Example:**
```typescript
import { resetRun } from './utils/event-producers';

// Start a new run
resetRun('run-123');

// First event will be step_id: 1
const event = createOrchestratorStartEvent('run-123', { query: 'AI' });
console.log(event.step_id); // 1
```

#### `getCurrentStep(runId: string): number`

Gets current step number for a run.

**Example:**
```typescript
import { getCurrentStep } from './utils/event-producers';

const currentStep = getCurrentStep('run-123');
console.log(`Currently at step ${currentStep}`);
```

### Complete Workflow Example

```typescript
import {
  resetRun,
  createOrchestratorStartEvent,
  createFetchStartEvent,
  createFetchCompleteEvent,
  createExtractCompleteEvent,
  createOrchestratorCompleteEvent,
  publishEvent
} from './utils/event-producers';

const runId = 'run-123';

// Reset run (step counter starts at 1)
resetRun(runId);

// 1. Start orchestrator (step 1)
publishEvent(createOrchestratorStartEvent(runId, {
  query: 'AI research',
  options: { depth: 3 }
}));

// 2. Fetch URL (step 2)
publishEvent(createFetchStartEvent(runId, {
  url: 'https://example.com'
}, {
  type: 'url',
  value: 'https://example.com'
}));

// 3. Fetch complete (step 3)
publishEvent(createFetchCompleteEvent(runId, {
  url: 'https://example.com'
}, {
  status_code: 200,
  content_length: 15234,
  content_type: 'text/html',
  duration_ms: 523
}));

// 4. Extract complete (step 4)
publishEvent(createExtractCompleteEvent(runId, {
  url: 'https://example.com'
}, {
  text_length: 5234,
  markdown_length: 6123,
  extraction_method: 'readability',
  duration_ms: 234
}));

// 5. Orchestrator complete (step 5)
publishEvent(createOrchestratorCompleteEvent(runId, {
  status: 'success',
  total_steps: 5,
  duration_ms: 12345
}, {
  usd: 0.05,
  tokens: { input: 1000, output: 200 }
}));
```

### Best Practices

**1. Always Use Event Producers**

```typescript
// ✅ Good - type-safe, consistent structure
const event = createFetchCompleteEvent(runId, input, output);
publishEvent(event);

// ❌ Bad - manual construction, error-prone
const event = {
  ts: new Date().toISOString(),
  run_id: runId,
  step_id: getCurrentStep(runId) + 1, // Manually tracking
  agent: 'fetch',
  action: 'fetch.complete',
  // Easy to forget fields or get types wrong
};
eventBus.publish(event);
```

**2. Reset Run at Start**

```typescript
// ✅ Good - ensures step_id starts at 1
resetRun(runId);
const event = createOrchestratorStartEvent(runId, input);

// ❌ Bad - step_id might continue from previous run
const event = createOrchestratorStartEvent(runId, input);
```

**3. Include Costs for Expensive Operations**

```typescript
// ✅ Good - tracks costs
const event = createSynthesisCompleteEvent(runId, input, output, {
  usd: 0.25,
  tokens: { input: 15000, output: 800 },
  compute_ms: 5234
});

// ❌ Bad - missing cost tracking
const event = createSynthesisCompleteEvent(runId, input, output);
```

**4. Publish Immediately After Creation**

```typescript
// ✅ Good - immediate publishing
const event = createFetchStartEvent(runId, input, source);
publishEvent(event);

// ❌ Bad - creating without publishing (event lost)
const event = createFetchStartEvent(runId, input, source);
// Event never published!
```

---

## Related Documentation

- [Services](./services.md) - Event bus that receives events
- [API Endpoints](./api.md) - REST endpoints that use logger
- [Middleware](./middleware.md) - Error handler that uses logger
- [Configuration](../../src/config/index.ts) - Logger configuration
