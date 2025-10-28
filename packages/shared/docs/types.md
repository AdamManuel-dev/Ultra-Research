# Type Definitions

This document provides comprehensive documentation for all TypeScript types and interfaces exported by the `@deep-research/shared` package.

## Table of Contents

- [Event Types](#event-types)
- [Error Types](#error-types)

---

## Event Types

The shared package provides a unified event schema for observability across all system components.

### `ResearchEvent`

Core event interface for all system events. All events must conform to this interface to ensure consistent logging, streaming, and analytics.

```typescript
interface ResearchEvent {
  ts: string;
  run_id: string;
  step_id: number;
  agent: AgentType;
  action: EventAction;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  artifacts?: EventArtifacts;
  source?: EventSource;
  cost?: EventCost;
  decision?: EventDecision;
  error?: EventError;
  metadata?: Record<string, unknown>;
}
```

**Required Fields:**
- `ts` - ISO 8601 timestamp when event occurred
- `run_id` - Unique identifier for the research run
- `step_id` - Sequential step number within the run
- `agent` - Component that emitted the event
- `action` - Specific action taken

**Optional Fields:**
- `input` - Input data for the action
- `output` - Output data from the action
- `artifacts` - Generated artifacts (URLs, IDs, file paths)
- `source` - Source of the action (URL, query, document, etc.)
- `cost` - Cost tracking information
- `decision` - Decision metadata (for orchestrator)
- `error` - Error information if action failed
- `metadata` - Additional custom metadata

**Example:**
```typescript
const event: ResearchEvent = {
  ts: '2025-10-28T13:21:12Z',
  run_id: 'run_abc123',
  step_id: 1,
  agent: 'fetch',
  action: 'fetch.complete',
  input: { url: 'https://example.com' },
  output: { content: '...' },
  artifacts: {
    document_ids: ['doc_123']
  },
  cost: {
    usd: 0.001,
    compute_ms: 250
  }
};
```

### `AgentType`

Type representing the component that emitted an event.

```typescript
type AgentType =
  | 'orchestrator'
  | 'fetch'
  | 'extract'
  | 'index'
  | 'graph'
  | 'synthesis'
  | 'system';
```

### `EventAction`

Union type of all possible event actions across the system.

**Orchestrator Actions:**
- `orchestrator.start` - Research run started
- `orchestrator.command` - Command received
- `orchestrator.plan` - Plan generated
- `orchestrator.frontier.update` - Exploration frontier updated
- `orchestrator.task.scheduled` - Task scheduled for execution
- `orchestrator.complete` - Research run completed

**Fetch Actions:**
- `fetch.start` - Fetch operation started
- `fetch.complete` - Fetch completed successfully
- `fetch.error` - Fetch failed
- `fetch.cached` - Content served from cache

**Extraction Actions:**
- `extract.start` - Extraction started
- `extract.complete` - Extraction completed
- `extract.error` - Extraction failed

**Indexing Actions:**
- `index.write` - Document written to index
- `index.query` - Index queried
- `index.update` - Index updated

**Graph Actions:**
- `graph.merge` - Nodes/edges merged into graph
- `graph.query` - Graph queried
- `graph.update` - Graph updated

**Synthesis Actions:**
- `synthesis.start` - Synthesis started
- `synthesis.complete` - Synthesis completed
- `synthesis.error` - Synthesis failed

**System Actions:**
- `system.health` - Health check
- `system.error` - System error

### `EventStreamMessage`

Message format for Server-Sent Events (SSE) or WebSocket streaming.

```typescript
interface EventStreamMessage {
  event: 'research_event' | 'error' | 'heartbeat' | 'complete';
  data: ResearchEvent | { message: string };
  id?: string;
}
```

**Example:**
```typescript
const message: EventStreamMessage = {
  event: 'research_event',
  data: researchEvent,
  id: 'msg_123'
};
```

### `EventQuery`

Parameters for querying events from storage or stream.

```typescript
interface EventQuery {
  run_id?: string;
  agent?: AgentType;
  action?: EventAction;
  from?: string; // ISO timestamp
  to?: string; // ISO timestamp
  limit?: number;
  offset?: number;
}
```

**Example:**
```typescript
const query: EventQuery = {
  run_id: 'run_abc123',
  agent: 'fetch',
  from: '2025-10-28T00:00:00Z',
  limit: 100
};
```

### Nested Types

#### `EventArtifacts`

Artifacts generated during the action.

```typescript
interface EventArtifacts {
  urls?: string[];
  document_ids?: string[];
  node_ids?: string[];
  edge_ids?: string[];
  file_paths?: string[];
}
```

#### `EventSource`

Source that triggered the action.

```typescript
interface EventSource {
  type: 'url' | 'query' | 'document' | 'node' | 'command';
  value: string;
}
```

#### `EventCost`

Cost tracking information.

```typescript
interface EventCost {
  usd: number;
  tokens?: {
    input: number;
    output: number;
  };
  compute_ms?: number;
}
```

#### `EventDecision`

Decision metadata (primarily for orchestrator).

```typescript
interface EventDecision {
  reason: string;
  score?: number;
  alternatives?: Array<{
    option: string;
    score: number;
  }>;
}
```

#### `EventError`

Error information if action failed.

```typescript
interface EventError {
  message: string;
  code?: string;
  stack?: string;
}
```

---

## Error Types

The shared package provides a comprehensive error hierarchy for consistent error handling across the system.

### Base Error

#### `ErrorContext`

Additional context information for errors.

```typescript
interface ErrorContext {
  [key: string]: unknown;
}
```

**Example:**
```typescript
const context: ErrorContext = {
  userId: '12345',
  operation: 'fetch',
  url: 'https://example.com'
};
```

#### `AppError`

Base error class that all application errors extend. Provides consistent error handling, logging, and HTTP status code mapping.

**Properties:**
- `message: string` - Human-readable error message
- `statusCode: number` - HTTP status code
- `context?: ErrorContext` - Additional error context
- `isOperational: boolean` - Whether error is operational (expected) or programming error
- `timestamp: string` - ISO 8601 timestamp when error occurred
- `stack?: string` - Stack trace

**Methods:**
- `toJSON()` - Convert error to JSON for logging and API responses

**Example:**
```typescript
try {
  // risky operation
} catch (error) {
  throw new AppError('Operation failed', 500, {
    originalError: error,
    operation: 'processData'
  });
}
```

### Specialized Errors

#### `AuthError`

Authentication and authorization errors. HTTP status code: 401.

**Use for:**
- Invalid credentials
- Missing or expired tokens
- Insufficient permissions
- Failed authentication/authorization

**Example:**
```typescript
throw new AuthError('Invalid JWT token', {
  token: redactedToken,
  reason: 'Token expired'
});

throw new AuthError('Insufficient permissions', {
  userId: user.id,
  requiredRole: 'admin',
  actualRole: user.role
});
```

#### `ConfigError`

Configuration errors. HTTP status code: 500. Non-operational - requires restart.

**Use for:**
- Missing required environment variables
- Invalid configuration values
- Configuration file parsing errors
- Incompatible configuration combinations

**Example:**
```typescript
throw new ConfigError('Missing required environment variable', {
  variable: 'DATABASE_URL',
  required: true
});

throw new ConfigError('Invalid port configuration', {
  port: -1,
  validRange: '1-65535'
});
```

#### `FetchError`

Fetch pipeline errors. HTTP status code: varies (defaults to 500).

**Additional Properties:**
- `url?: string` - URL that caused the error

**Use for:**
- HTTP errors (404, 500, etc.)
- robots.txt violations
- Rate limiting
- Network timeouts
- Invalid URLs

**Example:**
```typescript
throw new FetchError('Page not found', 404, 'https://example.com/missing');

throw new FetchError('Rate limit exceeded', 429, 'https://api.example.com', {
  retryAfter: 60,
  requestCount: 100
});
```

#### `GraphError`

Graph database operation errors. HTTP status code: 500.

**Additional Properties:**
- `query?: string` - Cypher query that caused the error

**Use for:**
- Neo4j query execution failures
- Connection errors
- Transaction errors
- Constraint violations
- Invalid Cypher syntax

**Example:**
```typescript
throw new GraphError(
  'Failed to create node',
  'CREATE (n:Person {name: $name}) RETURN n',
  { params: { name: 'John' } }
);

throw new GraphError('Neo4j connection failed', undefined, {
  host: 'localhost',
  port: 7687
});
```

#### `ServiceError`

External service errors. HTTP status code: 503.

**Additional Properties:**
- `service: string` - Name of the service that failed

**Use for:**
- OpenSearch connection/query errors
- Redis connection errors
- AWS service errors
- Third-party API failures
- Service timeouts

**Example:**
```typescript
throw new ServiceError(
  'OpenSearch query failed',
  'opensearch',
  {
    cluster: 'research-cluster',
    index: 'documents',
    operation: 'search'
  }
);

throw new ServiceError('Redis connection timeout', 'redis', {
  host: 'localhost',
  port: 6379,
  timeout: 5000
});
```

#### `ValidationError`

Input validation errors. HTTP status code: 400.

**Additional Properties:**
- `fields?: string[]` - List of field names that failed validation

**Use for:**
- Schema validation failures (JSON Schema, Zod)
- Type validation errors
- Business rule violations
- Required fields missing
- Invalid formats (email, URL, etc.)

**Example:**
```typescript
throw new ValidationError(
  'Invalid user input',
  ['email', 'age'],
  {
    errors: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'age', message: 'Must be positive' }
    ]
  }
);

throw new ValidationError('Missing required field', ['username']);
```

### Error Handling Patterns

#### Basic Error Handling

```typescript
import { AppError, FetchError } from '@deep-research/shared';

try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new FetchError(`HTTP ${response.status}`, response.status, url);
  }
} catch (error) {
  if (error instanceof FetchError) {
    // Handle fetch-specific error
    console.error('Fetch failed:', error.url, error.message);
  } else if (error instanceof AppError) {
    // Handle other operational errors
    console.error('Operational error:', error.toJSON());
  } else {
    // Handle unexpected errors
    throw error;
  }
}
```

#### Error Propagation

```typescript
import { ValidationError, GraphError } from '@deep-research/shared';

async function createUser(data: unknown) {
  // Validate input
  if (!isValidUserData(data)) {
    throw new ValidationError('Invalid user data', ['email', 'name']);
  }

  try {
    // Create user in graph
    return await createUserNode(data);
  } catch (error) {
    // Wrap lower-level error
    throw new GraphError('Failed to create user', undefined, {
      originalError: error,
      userData: data
    });
  }
}
```

#### Middleware Error Handling

```typescript
import { AppError } from '@deep-research/shared';

app.use((error, req, res, next) => {
  if (error instanceof AppError) {
    // Send structured error response
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.name,
        context: error.context,
        timestamp: error.timestamp
      }
    });
  } else {
    // Handle unexpected errors
    res.status(500).json({
      error: {
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    });
  }
});
```

---

## Best Practices

### Event Design

1. **Always include required fields**: `ts`, `run_id`, `step_id`, `agent`, `action`
2. **Use structured data**: Leverage `input`, `output`, and `artifacts` for searchable data
3. **Track costs**: Include cost information for billing and optimization
4. **Include context**: Use `metadata` for additional context
5. **Handle errors**: Always populate `error` field when action fails

### Error Handling

1. **Use specific error types**: Choose the most appropriate error class
2. **Include context**: Provide helpful debugging information
3. **Don't expose secrets**: Sanitize sensitive data before adding to context
4. **Preserve stack traces**: Let base class handle stack capture
5. **Log appropriately**: Log non-operational errors at ERROR level
6. **Handle gracefully**: Catch and handle errors at appropriate boundaries
7. **Use isOperational**: Distinguish between operational and programming errors

### TypeScript Integration

```typescript
import { ResearchEvent, EventAction, AppError } from '@deep-research/shared';

// Type-safe event creation
function createEvent(
  runId: string,
  stepId: number,
  action: EventAction,
  data?: Record<string, unknown>
): ResearchEvent {
  return {
    ts: new Date().toISOString(),
    run_id: runId,
    step_id: stepId,
    agent: 'fetch',
    action,
    output: data
  };
}

// Type-safe error handling
function handleError(error: unknown): never {
  if (error instanceof AppError) {
    // Safely access AppError properties
    console.error(error.toJSON());
    throw error;
  }
  throw new AppError('Unexpected error', 500, { originalError: error });
}
```
