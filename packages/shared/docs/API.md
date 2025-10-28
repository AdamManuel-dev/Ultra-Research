# API Reference

Complete API reference for the `@deep-research/shared` package.

## Table of Contents

- [Installation](#installation)
- [Exports](#exports)
- [Types](#types)
- [Classes](#classes)
- [Constants](#constants)
- [Usage Examples](#usage-examples)

---

## Installation

```bash
# Using npm
npm install @deep-research/shared

# Using yarn
yarn add @deep-research/shared

# Using pnpm
pnpm add @deep-research/shared
```

---

## Exports

The package exports the following modules:

```typescript
// Error types
export * from './types/errors';
export {
  AppError,
  ErrorContext,
  AuthError,
  ConfigError,
  FetchError,
  GraphError,
  ServiceError,
  ValidationError
} from './types/errors';

// Event types
export * from './types/events';
export {
  ResearchEvent,
  EventAction,
  AgentType,
  EventStreamMessage,
  EventQuery
} from './types/events';

// Validation
export * from './validation';
export {
  eventSchema,
  EventValidator,
  eventValidator
} from './validation';
```

---

## Types

### Event Types

#### `ResearchEvent`

```typescript
interface ResearchEvent {
  /** ISO 8601 timestamp */
  ts: string;

  /** Research run identifier */
  run_id: string;

  /** Step within the run (sequential) */
  step_id: number;

  /** Component that emitted the event */
  agent: AgentType;

  /** Specific action taken */
  action: EventAction;

  /** Input data for the action */
  input?: Record<string, unknown>;

  /** Output data from the action */
  output?: Record<string, unknown>;

  /** Artifacts generated (URLs, IDs, etc.) */
  artifacts?: {
    urls?: string[];
    document_ids?: string[];
    node_ids?: string[];
    edge_ids?: string[];
    file_paths?: string[];
  };

  /** Source of the action (URL, query, etc.) */
  source?: {
    type: 'url' | 'query' | 'document' | 'node' | 'command';
    value: string;
  };

  /** Cost tracking */
  cost?: {
    usd: number;
    tokens?: {
      input: number;
      output: number;
    };
    compute_ms?: number;
  };

  /** Decision metadata (for orchestrator) */
  decision?: {
    reason: string;
    score?: number;
    alternatives?: Array<{ option: string; score: number }>;
  };

  /** Error information if action failed */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}
```

#### `AgentType`

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

#### `EventAction`

```typescript
type EventAction =
  // Orchestrator
  | 'orchestrator.start'
  | 'orchestrator.command'
  | 'orchestrator.plan'
  | 'orchestrator.frontier.update'
  | 'orchestrator.task.scheduled'
  | 'orchestrator.complete'
  // Fetch
  | 'fetch.start'
  | 'fetch.complete'
  | 'fetch.error'
  | 'fetch.cached'
  // Extraction
  | 'extract.start'
  | 'extract.complete'
  | 'extract.error'
  // Indexing
  | 'index.write'
  | 'index.query'
  | 'index.update'
  // Graph
  | 'graph.merge'
  | 'graph.query'
  | 'graph.update'
  // Synthesis
  | 'synthesis.start'
  | 'synthesis.complete'
  | 'synthesis.error'
  // System
  | 'system.health'
  | 'system.error';
```

#### `EventStreamMessage`

```typescript
interface EventStreamMessage {
  event: 'research_event' | 'error' | 'heartbeat' | 'complete';
  data: ResearchEvent | { message: string };
  id?: string;
}
```

#### `EventQuery`

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

### Error Types

#### `ErrorContext`

```typescript
interface ErrorContext {
  [key: string]: unknown;
}
```

---

## Classes

### Error Classes

#### `AppError`

Base error class for all application errors.

```typescript
class AppError extends Error {
  readonly statusCode: number;
  readonly context?: ErrorContext;
  readonly isOperational: boolean;
  readonly timestamp: string;

  constructor(
    message: string,
    statusCode = 500,
    context?: ErrorContext,
    isOperational = true
  );

  toJSON(): {
    name: string;
    message: string;
    statusCode: number;
    context?: ErrorContext;
    timestamp: string;
    stack?: string;
  };
}
```

**Example:**
```typescript
import { AppError } from '@deep-research/shared';

throw new AppError('Something went wrong', 500, {
  operation: 'processData',
  input: sanitizedInput
});
```

#### `AuthError`

Authentication and authorization errors (HTTP 401).

```typescript
class AuthError extends AppError {
  constructor(message: string, context?: ErrorContext);
}
```

**Example:**
```typescript
import { AuthError } from '@deep-research/shared';

throw new AuthError('Invalid credentials', {
  userId: user.id
});
```

#### `ConfigError`

Configuration errors (HTTP 500, non-operational).

```typescript
class ConfigError extends AppError {
  constructor(message: string, context?: ErrorContext);
}
```

**Example:**
```typescript
import { ConfigError } from '@deep-research/shared';

throw new ConfigError('Missing DATABASE_URL', {
  variable: 'DATABASE_URL'
});
```

#### `FetchError`

Fetch pipeline errors (HTTP status varies).

```typescript
class FetchError extends AppError {
  readonly url?: string;

  constructor(
    message: string,
    statusCode = 500,
    url?: string,
    context?: ErrorContext
  );
}
```

**Example:**
```typescript
import { FetchError } from '@deep-research/shared';

throw new FetchError(
  'Page not found',
  404,
  'https://example.com/missing'
);
```

#### `GraphError`

Graph database operation errors (HTTP 500).

```typescript
class GraphError extends AppError {
  readonly query?: string;

  constructor(
    message: string,
    query?: string,
    context?: ErrorContext
  );
}
```

**Example:**
```typescript
import { GraphError } from '@deep-research/shared';

throw new GraphError(
  'Query failed',
  'CREATE (n:Node) RETURN n',
  { params: { name: 'test' } }
);
```

#### `ServiceError`

External service errors (HTTP 503).

```typescript
class ServiceError extends AppError {
  readonly service: string;

  constructor(
    message: string,
    service: string,
    context?: ErrorContext
  );
}
```

**Example:**
```typescript
import { ServiceError } from '@deep-research/shared';

throw new ServiceError(
  'Connection timeout',
  'opensearch',
  { timeout: 5000 }
);
```

#### `ValidationError`

Input validation errors (HTTP 400).

```typescript
class ValidationError extends AppError {
  readonly fields?: string[];

  constructor(
    message: string,
    fields?: string[],
    context?: ErrorContext
  );
}
```

**Example:**
```typescript
import { ValidationError } from '@deep-research/shared';

throw new ValidationError(
  'Invalid input',
  ['email', 'password'],
  { errors: validationErrors }
);
```

### Validation Classes

#### `EventValidator`

Validates ResearchEvent objects against JSON Schema.

```typescript
class EventValidator {
  constructor();

  /**
   * Validate an event (throws ValidationError if invalid)
   */
  validate(event: unknown): asserts event is ResearchEvent;

  /**
   * Check if event is valid (returns boolean)
   */
  isValid(event: unknown): event is ResearchEvent;
}
```

**Example:**
```typescript
import { EventValidator } from '@deep-research/shared';

const validator = new EventValidator();

// Throws on invalid
validator.validate(event);

// Returns boolean
if (validator.isValid(event)) {
  processEvent(event);
}
```

---

## Constants

### `eventValidator`

Pre-instantiated singleton instance of `EventValidator`.

```typescript
const eventValidator: EventValidator;
```

**Example:**
```typescript
import { eventValidator } from '@deep-research/shared';

// Use directly without instantiation
eventValidator.validate(event);
```

### `eventSchema`

JSON Schema definition for ResearchEvent validation.

```typescript
const eventSchema: {
  $schema: string;
  type: 'object';
  required: string[];
  properties: Record<string, unknown>;
  additionalProperties: false;
};
```

**Example:**
```typescript
import { eventSchema } from '@deep-research/shared';

// Use with custom Ajv instance
import Ajv from 'ajv';
const ajv = new Ajv();
const validate = ajv.compile(eventSchema);
```

---

## Usage Examples

### Basic Event Creation

```typescript
import { ResearchEvent, AgentType } from '@deep-research/shared';

const event: ResearchEvent = {
  ts: new Date().toISOString(),
  run_id: 'run_abc123',
  step_id: 1,
  agent: 'fetch',
  action: 'fetch.start',
  input: {
    url: 'https://example.com'
  }
};
```

### Event with Cost Tracking

```typescript
import { ResearchEvent } from '@deep-research/shared';

const event: ResearchEvent = {
  ts: new Date().toISOString(),
  run_id: 'run_abc123',
  step_id: 2,
  agent: 'synthesis',
  action: 'synthesis.complete',
  output: {
    summary: 'Research findings...'
  },
  cost: {
    usd: 0.05,
    tokens: {
      input: 1000,
      output: 500
    },
    compute_ms: 2500
  }
};
```

### Event Validation

```typescript
import { eventValidator, ValidationError } from '@deep-research/shared';

try {
  eventValidator.validate(unknownData);
  // Data is now typed as ResearchEvent
  await saveEvent(unknownData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid event:', error.message);
    console.error('Fields:', error.fields);
  }
}
```

### Error Handling

```typescript
import {
  AppError,
  AuthError,
  FetchError,
  ValidationError
} from '@deep-research/shared';

try {
  await performOperation();
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth errors
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (error instanceof FetchError) {
    // Handle fetch errors
    console.error('Fetch failed:', error.url);
    return res.status(error.statusCode).json({
      error: error.message
    });
  }

  if (error instanceof ValidationError) {
    // Handle validation errors
    return res.status(400).json({
      error: error.message,
      fields: error.fields
    });
  }

  if (error instanceof AppError) {
    // Handle other operational errors
    return res.status(error.statusCode).json({
      error: error.message
    });
  }

  // Handle unexpected errors
  throw error;
}
```

### Express Middleware

```typescript
import { AppError, eventValidator } from '@deep-research/shared';
import { Request, Response, NextFunction } from 'express';

// Event validation middleware
export function validateEvent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    eventValidator.validate(req.body);
    next();
  } catch (error) {
    next(error);
  }
}

// Error handling middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.name,
        timestamp: error.timestamp,
        ...(error.context && { context: error.context })
      }
    });
  }

  // Handle unexpected errors
  console.error('Unexpected error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }
  });
}

// Usage
app.post('/api/events', validateEvent, async (req, res, next) => {
  try {
    await eventStore.save(req.body);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);
```

### Event Stream Handler

```typescript
import {
  ResearchEvent,
  EventStreamMessage,
  eventValidator
} from '@deep-research/shared';

class EventStream {
  async *process(
    source: AsyncIterable<unknown>
  ): AsyncGenerator<ResearchEvent> {
    for await (const item of source) {
      if (eventValidator.isValid(item)) {
        yield item;
      } else {
        console.warn('Invalid event in stream, skipping');
      }
    }
  }

  createMessage(event: ResearchEvent): EventStreamMessage {
    return {
      event: 'research_event',
      data: event,
      id: `${event.run_id}_${event.step_id}`
    };
  }
}
```

### Custom Error Handler

```typescript
import { AppError, ErrorContext } from '@deep-research/shared';

class DatabaseError extends AppError {
  constructor(
    message: string,
    operation: string,
    context?: ErrorContext
  ) {
    super(
      message,
      503,
      { ...context, operation, service: 'database' },
      true
    );
  }
}

// Usage
try {
  await db.query(sql);
} catch (error) {
  throw new DatabaseError(
    'Query failed',
    'SELECT',
    { sql, error: String(error) }
  );
}
```

### Type-Safe Event Builder

```typescript
import { ResearchEvent, EventAction, AgentType } from '@deep-research/shared';

class EventBuilder {
  private event: Partial<ResearchEvent> = {};

  constructor(runId: string, stepId: number) {
    this.event = {
      ts: new Date().toISOString(),
      run_id: runId,
      step_id: stepId
    };
  }

  agent(agent: AgentType): this {
    this.event.agent = agent;
    return this;
  }

  action(action: EventAction): this {
    this.event.action = action;
    return this;
  }

  input(data: Record<string, unknown>): this {
    this.event.input = data;
    return this;
  }

  output(data: Record<string, unknown>): this {
    this.event.output = data;
    return this;
  }

  cost(usd: number, tokens?: { input: number; output: number }): this {
    this.event.cost = { usd, tokens };
    return this;
  }

  build(): ResearchEvent {
    if (!this.event.agent || !this.event.action) {
      throw new Error('Agent and action are required');
    }
    return this.event as ResearchEvent;
  }
}

// Usage
const event = new EventBuilder('run_123', 1)
  .agent('fetch')
  .action('fetch.complete')
  .input({ url: 'https://example.com' })
  .cost(0.001)
  .build();
```

### Event Query Builder

```typescript
import { EventQuery, AgentType } from '@deep-research/shared';

class EventQueryBuilder {
  private query: EventQuery = {};

  runId(runId: string): this {
    this.query.run_id = runId;
    return this;
  }

  agent(agent: AgentType): this {
    this.query.agent = agent;
    return this;
  }

  dateRange(from: Date, to: Date): this {
    this.query.from = from.toISOString();
    this.query.to = to.toISOString();
    return this;
  }

  limit(limit: number): this {
    this.query.limit = limit;
    return this;
  }

  build(): EventQuery {
    return this.query;
  }
}

// Usage
const query = new EventQueryBuilder()
  .runId('run_123')
  .agent('fetch')
  .limit(100)
  .build();
```

---

## TypeScript Integration

### Strict Type Checking

```typescript
import { ResearchEvent, EventAction } from '@deep-research/shared';

// TypeScript ensures all required fields are present
const event: ResearchEvent = {
  ts: new Date().toISOString(),
  run_id: 'run_123',
  step_id: 1,
  agent: 'fetch',
  action: 'fetch.start'
  // TypeScript error if any required field is missing
};

// TypeScript validates action matches EventAction union
const action: EventAction = 'fetch.complete'; // OK
const invalid: EventAction = 'invalid.action'; // TypeScript error
```

### Type Guards

```typescript
import { eventValidator, ResearchEvent } from '@deep-research/shared';

function processData(data: unknown) {
  // Type guard narrows type
  if (eventValidator.isValid(data)) {
    // data is now typed as ResearchEvent
    console.log(data.run_id); // OK
    console.log(data.invalidField); // TypeScript error
  }
}
```

### Generic Error Handling

```typescript
import { AppError } from '@deep-research/shared';

function isOperationalError(error: Error): error is AppError {
  return error instanceof AppError && error.isOperational;
}

try {
  await operation();
} catch (error) {
  if (error instanceof Error && isOperationalError(error)) {
    // Handle operational error
    logger.warn(error.toJSON());
  } else {
    // Unexpected error - escalate
    logger.error('Critical error', error);
    throw error;
  }
}
```

---

## Testing

### Mock Events

```typescript
import { ResearchEvent } from '@deep-research/shared';

function createMockEvent(
  overrides?: Partial<ResearchEvent>
): ResearchEvent {
  return {
    ts: new Date().toISOString(),
    run_id: 'test_run',
    step_id: 1,
    agent: 'fetch',
    action: 'fetch.start',
    ...overrides
  };
}

// Usage in tests
describe('Event processing', () => {
  it('should process fetch events', () => {
    const event = createMockEvent({
      action: 'fetch.complete',
      output: { content: 'test' }
    });

    expect(processEvent(event)).toBe(true);
  });
});
```

### Mock Errors

```typescript
import { FetchError, ValidationError } from '@deep-research/shared';

describe('Error handling', () => {
  it('should handle fetch errors', () => {
    const error = new FetchError('Not found', 404, 'https://test.com');

    expect(error.statusCode).toBe(404);
    expect(error.url).toBe('https://test.com');
    expect(error.isOperational).toBe(true);
  });

  it('should handle validation errors', () => {
    const error = new ValidationError('Invalid', ['email'], {
      details: 'Invalid format'
    });

    expect(error.statusCode).toBe(400);
    expect(error.fields).toEqual(['email']);
  });
});
```

---

## Migration Guide

### From Custom Types

**Before:**
```typescript
interface MyEvent {
  timestamp: string;
  runId: string;
  // ...
}
```

**After:**
```typescript
import { ResearchEvent } from '@deep-research/shared';

// Use standardized ResearchEvent type
const event: ResearchEvent = { /* ... */ };
```

### From Generic Errors

**Before:**
```typescript
throw new Error('Fetch failed');
```

**After:**
```typescript
import { FetchError } from '@deep-research/shared';

throw new FetchError('Fetch failed', 500, url, { details });
```

### From Manual Validation

**Before:**
```typescript
if (!event.run_id || !event.agent) {
  throw new Error('Invalid event');
}
```

**After:**
```typescript
import { eventValidator } from '@deep-research/shared';

eventValidator.validate(event); // Comprehensive validation
```

---

## Support

For issues, questions, or contributions:
- GitHub: [UltraResearch Repository](https://github.com/adammanuel/UltraResearch)
- Package: `@deep-research/shared`
- Version: See `package.json`
