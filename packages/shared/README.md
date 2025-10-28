# @deep-research/shared

Shared types, utilities, and constants for the Deep Research Cockpit platform.

## Overview

This package provides core TypeScript types, error classes, and validation utilities used across the Deep Research Cockpit monorepo. It ensures type safety, consistent error handling, and standardized event schemas throughout the system.

## Features

- **Type-Safe Events**: Comprehensive event schema for observability across all components
- **Structured Errors**: Hierarchical error classes with context and HTTP status codes
- **Validation**: JSON Schema-based event validation with Ajv
- **Zero Configuration**: Works out of the box with sensible defaults
- **TypeScript First**: Written in TypeScript with full type definitions

## Installation

```bash
# In the monorepo root
npm install

# Or specifically for this package
npm install @deep-research/shared
```

## Quick Start

### Event Creation

```typescript
import { ResearchEvent } from '@deep-research/shared';

const event: ResearchEvent = {
  ts: new Date().toISOString(),
  run_id: 'run_abc123',
  step_id: 1,
  agent: 'fetch',
  action: 'fetch.start',
  input: { url: 'https://example.com' }
};
```

### Event Validation

```typescript
import { eventValidator, ValidationError } from '@deep-research/shared';

try {
  eventValidator.validate(unknownData);
  // Data is now typed as ResearchEvent
  await processEvent(unknownData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid event:', error.message);
  }
}
```

### Error Handling

```typescript
import { FetchError, AuthError, ValidationError } from '@deep-research/shared';

// Throw specific errors
throw new FetchError('Page not found', 404, 'https://example.com');

throw new AuthError('Invalid token', { userId: '12345' });

throw new ValidationError('Invalid input', ['email', 'password']);

// Catch and handle
try {
  await operation();
} catch (error) {
  if (error instanceof FetchError) {
    console.error('Fetch failed:', error.url, error.statusCode);
  }
}
```

## Documentation

- **[API Reference](./docs/API.md)** - Complete API documentation
- **[Types](./docs/types.md)** - Detailed type definitions and examples
- **[Validation](./docs/validation.md)** - Validation utilities and patterns

## Package Structure

```
packages/shared/
├── src/
│   ├── index.ts                  # Main entry point
│   ├── types/
│   │   ├── events.ts            # Event type definitions
│   │   └── errors/              # Error class hierarchy
│   │       ├── index.ts         # Error exports
│   │       ├── base.ts          # Base AppError class
│   │       ├── auth.ts          # Authentication errors
│   │       ├── config.ts        # Configuration errors
│   │       ├── fetch.ts         # Fetch pipeline errors
│   │       ├── graph.ts         # Graph database errors
│   │       ├── service.ts       # External service errors
│   │       └── validation.ts    # Validation errors
│   └── validation/
│       ├── index.ts             # Validation exports
│       ├── event-schema.ts      # JSON Schema definition
│       └── event-validator.ts   # Validator class
├── docs/                         # Documentation
│   ├── API.md                   # API reference
│   ├── types.md                 # Type documentation
│   └── validation.md            # Validation guide
├── dist/                         # Compiled output
├── package.json
└── tsconfig.json
```

## Exports

### Types

```typescript
import {
  // Event types
  ResearchEvent,
  EventAction,
  AgentType,
  EventStreamMessage,
  EventQuery,

  // Error types
  ErrorContext,
  AppError,
  AuthError,
  ConfigError,
  FetchError,
  GraphError,
  ServiceError,
  ValidationError
} from '@deep-research/shared';
```

### Validation

```typescript
import {
  eventValidator,    // Singleton validator instance
  EventValidator,    // Validator class
  eventSchema       // JSON Schema definition
} from '@deep-research/shared';
```

## Event System

### Event Types

The package defines a unified event schema for observability:

- **ResearchEvent**: Core event interface with required and optional fields
- **AgentType**: Component that emitted the event (orchestrator, fetch, extract, etc.)
- **EventAction**: Specific action taken (fetch.start, graph.merge, etc.)
- **EventStreamMessage**: SSE/WebSocket streaming format

### Event Structure

```typescript
interface ResearchEvent {
  // Required fields
  ts: string;              // ISO 8601 timestamp
  run_id: string;          // Research run ID
  step_id: number;         // Sequential step number
  agent: AgentType;        // Component name
  action: EventAction;     // Action type

  // Optional fields
  input?: Record<string, unknown>;        // Input data
  output?: Record<string, unknown>;       // Output data
  artifacts?: { /* URLs, IDs, paths */ }; // Generated artifacts
  source?: { type, value };               // Action source
  cost?: { usd, tokens, compute_ms };     // Cost tracking
  decision?: { reason, score };           // Decision metadata
  error?: { message, code, stack };       // Error info
  metadata?: Record<string, unknown>;     // Additional data
}
```

## Error Hierarchy

### Base Error

All errors extend `AppError`:

```typescript
class AppError extends Error {
  statusCode: number;
  context?: ErrorContext;
  isOperational: boolean;
  timestamp: string;

  toJSON(): object;
}
```

### Specialized Errors

| Error Class | HTTP Status | Use Case |
|------------|-------------|----------|
| `AuthError` | 401 | Authentication/authorization failures |
| `ConfigError` | 500 | Configuration errors (non-operational) |
| `FetchError` | varies | HTTP errors, rate limiting, timeouts |
| `GraphError` | 500 | Neo4j query/connection errors |
| `ServiceError` | 503 | External service failures |
| `ValidationError` | 400 | Input validation failures |

## Validation

### EventValidator

The `EventValidator` class validates events against JSON Schema:

```typescript
import { eventValidator } from '@deep-research/shared';

// Validate (throws on error)
eventValidator.validate(event);

// Check validity (returns boolean)
if (eventValidator.isValid(event)) {
  processEvent(event);
}
```

### Validation Features

- **Comprehensive Schema**: Validates all event fields and constraints
- **Type Guards**: TypeScript type narrowing with `asserts` and `is`
- **Detailed Errors**: Structured validation error messages
- **Performance**: Cached compiled schema for fast validation
- **Standards Compliant**: JSON Schema Draft 07 with ajv-formats

## Usage Examples

### Express Middleware

```typescript
import { eventValidator, AppError } from '@deep-research/shared';
import { Request, Response, NextFunction } from 'express';

// Validation middleware
export const validateEvent = (req: Request, res: Response, next: NextFunction) => {
  try {
    eventValidator.validate(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

// Error handler
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      timestamp: error.timestamp,
      context: error.context
    });
  }

  res.status(500).json({ error: 'Internal server error' });
};

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

### Event Stream Processing

```typescript
import { eventValidator, ResearchEvent } from '@deep-research/shared';

async function* processEventStream(
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

// Usage
for await (const event of processEventStream(rawStream)) {
  await handleEvent(event);
}
```

### Custom Error Classes

```typescript
import { AppError, ErrorContext } from '@deep-research/shared';

class RateLimitError extends AppError {
  constructor(limit: number, context?: ErrorContext) {
    super(
      `Rate limit exceeded: ${limit} requests`,
      429,
      { ...context, limit },
      true
    );
  }
}

// Usage
throw new RateLimitError(100, { userId: '12345', period: '1m' });
```

## TypeScript Configuration

The package is built with strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist"
  }
}
```

## Development

### Build

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode
```

### Testing

```bash
npm test             # Run tests
npm run test:coverage # With coverage
```

### Linting

```bash
npm run lint         # Check code
npm run lint:fix     # Auto-fix issues
```

### Type Checking

```bash
npm run type-check   # Check types without emit
```

## Best Practices

### Events

1. **Always include required fields**: `ts`, `run_id`, `step_id`, `agent`, `action`
2. **Validate external input**: Use `eventValidator` for all external data
3. **Track costs**: Include cost information for billing and optimization
4. **Structure data**: Use `input`, `output`, `artifacts` for searchable data
5. **Handle errors**: Populate `error` field when actions fail

### Errors

1. **Use specific error types**: Choose the most appropriate error class
2. **Include context**: Provide helpful debugging information
3. **Don't expose secrets**: Sanitize sensitive data before adding to context
4. **Check isOperational**: Distinguish operational vs programming errors
5. **Log appropriately**: Use error severity based on `isOperational`

### Validation

1. **Validate early**: Check input at entry points
2. **Use type guards**: Leverage TypeScript type narrowing
3. **Handle errors gracefully**: Catch and handle `ValidationError`
4. **Use singleton**: Reuse `eventValidator` for performance
5. **Test edge cases**: Validate behavior with invalid data

## Performance

### Validation Performance

- **Simple event**: ~0.01ms (100,000 ops/sec)
- **Complex event**: ~0.05ms (20,000 ops/sec)
- **Batch of 1000**: ~10-50ms total

### Memory Usage

- **Singleton validator**: ~50KB (compiled schema cached)
- **Per-instance**: ~50KB per validator (avoid creating multiple)

## Dependencies

### Runtime

- `ajv` (^8.12.0) - JSON Schema validator
- `ajv-formats` (^2.1.1) - Additional format validators
- `zod` (^3.22.4) - Alternative validation library

### Development

- `typescript` (^5.3.3)
- `jest` (^29.7.0)
- `@types/node` (^20.11.5)

## Contributing

This package is part of the Deep Research Cockpit monorepo. See the root README for contribution guidelines.

### Adding New Error Types

1. Create new error class in `src/types/errors/`
2. Extend `AppError` with appropriate status code
3. Export from `src/types/errors/index.ts`
4. Add JSDoc documentation with examples
5. Update documentation in `docs/types.md`

### Modifying Event Schema

1. Update TypeScript interface in `src/types/events.ts`
2. Update JSON Schema in `src/validation/event-schema.ts`
3. Ensure schema matches interface exactly
4. Add tests for new fields
5. Update documentation

## License

See the root LICENSE file in the monorepo.

## Support

For issues, questions, or contributions:
- GitHub: [UltraResearch Repository](https://github.com/adammanuel/UltraResearch)
- Package: `@deep-research/shared`
- Version: 0.1.0

## Changelog

### 0.1.0 (Current)

- Initial release
- Event type system with comprehensive schema
- Error class hierarchy with 6 specialized types
- JSON Schema validation with Ajv
- Complete TypeScript type definitions
- Comprehensive documentation

---

Built with TypeScript and designed for type safety across the Deep Research Cockpit platform.
