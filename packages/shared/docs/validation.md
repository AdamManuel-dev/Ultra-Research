# Validation

This document provides comprehensive documentation for the validation utilities in the `@deep-research/shared` package.

## Table of Contents

- [Overview](#overview)
- [EventValidator](#eventvalidator)
- [Event Schema](#event-schema)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The validation module provides JSON Schema-based validation for `ResearchEvent` objects. It uses [Ajv](https://ajv.js.org/) (Another JSON Schema Validator) for fast and standards-compliant validation.

**Key Features:**
- Validates events against comprehensive JSON Schema
- Provides detailed, structured error messages
- Singleton pattern for performance (cached compiled schema)
- Type-safe with TypeScript type guards
- Supports all standard JSON Schema formats

**Dependencies:**
- `ajv` - JSON Schema validator
- `ajv-formats` - Additional format validators (date-time, email, etc.)

---

## EventValidator

The `EventValidator` class provides methods to validate `ResearchEvent` objects.

### Class Definition

```typescript
class EventValidator {
  constructor();
  validate(event: unknown): asserts event is ResearchEvent;
  isValid(event: unknown): event is ResearchEvent;
}
```

### Methods

#### `validate(event: unknown)`

Validates an event against the schema and throws `ValidationError` if invalid.

**Type Signature:**
```typescript
validate(event: unknown): asserts event is ResearchEvent
```

**Parameters:**
- `event` - Event object to validate (can be any type)

**Throws:**
- `ValidationError` - If event doesn't match schema, includes detailed error information

**Example:**
```typescript
import { eventValidator, ValidationError } from '@deep-research/shared';

try {
  eventValidator.validate(unknownEvent);
  // TypeScript now knows unknownEvent is ResearchEvent
  console.log(unknownEvent.run_id);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Invalid fields:', error.fields);
    console.error('Details:', error.context);
  }
}
```

#### `isValid(event: unknown)`

Checks if an event is valid without throwing an error.

**Type Signature:**
```typescript
isValid(event: unknown): event is ResearchEvent
```

**Parameters:**
- `event` - Event object to check (can be any type)

**Returns:**
- `boolean` - `true` if event is valid, `false` otherwise

**Example:**
```typescript
import { eventValidator } from '@deep-research/shared';

if (eventValidator.isValid(unknownEvent)) {
  // TypeScript now knows unknownEvent is ResearchEvent
  processEvent(unknownEvent);
} else {
  console.warn('Invalid event, skipping');
}
```

### Singleton Instance

A pre-instantiated singleton is exported for convenience:

```typescript
import { eventValidator } from '@deep-research/shared';

// Use the singleton
eventValidator.validate(event);
```

You can also create your own instance if needed:

```typescript
import { EventValidator } from '@deep-research/shared';

const validator = new EventValidator();
validator.validate(event);
```

---

## Event Schema

The event schema is a comprehensive JSON Schema definition that matches the `ResearchEvent` TypeScript interface.

### Schema Definition

```typescript
export const eventSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['ts', 'run_id', 'step_id', 'agent', 'action'],
  properties: {
    // ... detailed schema definition
  },
  additionalProperties: false
};
```

### Required Fields

The schema enforces these required fields:
- `ts` - ISO 8601 date-time string
- `run_id` - Non-empty string
- `step_id` - Non-negative number
- `agent` - One of: orchestrator, fetch, extract, index, graph, synthesis, system
- `action` - String (specific action types validated at runtime)

### Optional Fields

All other fields are optional but validated if present:
- `input` - Object
- `output` - Object
- `artifacts` - Object with specific structure
- `source` - Object with required `type` and `value`
- `cost` - Object with required `usd` field
- `decision` - Object with required `reason` field
- `error` - Object with required `message` field
- `metadata` - Object (any structure)

### Field Constraints

The schema enforces these constraints:

**Timestamps:**
```json
{
  "ts": {
    "type": "string",
    "format": "date-time"
  }
}
```

**Run ID:**
```json
{
  "run_id": {
    "type": "string",
    "minLength": 1
  }
}
```

**Step ID:**
```json
{
  "step_id": {
    "type": "number",
    "minimum": 0
  }
}
```

**Agent:**
```json
{
  "agent": {
    "type": "string",
    "enum": ["orchestrator", "fetch", "extract", "index", "graph", "synthesis", "system"]
  }
}
```

**Artifacts:**
```json
{
  "artifacts": {
    "type": "object",
    "properties": {
      "urls": { "type": "array", "items": { "type": "string" } },
      "document_ids": { "type": "array", "items": { "type": "string" } },
      "node_ids": { "type": "array", "items": { "type": "string" } },
      "edge_ids": { "type": "array", "items": { "type": "string" } },
      "file_paths": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

**Cost:**
```json
{
  "cost": {
    "type": "object",
    "required": ["usd"],
    "properties": {
      "usd": { "type": "number", "minimum": 0 },
      "tokens": {
        "type": "object",
        "required": ["input", "output"],
        "properties": {
          "input": { "type": "number", "minimum": 0 },
          "output": { "type": "number", "minimum": 0 }
        }
      },
      "compute_ms": { "type": "number", "minimum": 0 }
    }
  }
}
```

---

## Usage Examples

### Basic Validation

```typescript
import { eventValidator, ResearchEvent } from '@deep-research/shared';

const event = {
  ts: new Date().toISOString(),
  run_id: 'run_abc123',
  step_id: 1,
  agent: 'fetch',
  action: 'fetch.start',
  input: { url: 'https://example.com' }
};

// Validate and assert type
eventValidator.validate(event);
// Now TypeScript knows event is ResearchEvent
console.log(event.run_id);
```

### Validation with Error Handling

```typescript
import { eventValidator, ValidationError } from '@deep-research/shared';

function processEvent(data: unknown) {
  try {
    eventValidator.validate(data);
    // Process valid event
    return handleResearchEvent(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Invalid event received:', {
        message: error.message,
        fields: error.fields,
        details: error.context
      });
      // Handle validation error
      return { error: 'Invalid event format' };
    }
    throw error;
  }
}
```

### Type Guard Usage

```typescript
import { eventValidator } from '@deep-research/shared';

function maybeProcessEvent(data: unknown) {
  if (eventValidator.isValid(data)) {
    // TypeScript knows data is ResearchEvent
    console.log(`Processing event: ${data.action}`);
    return processValidEvent(data);
  }

  console.warn('Skipping invalid event');
  return null;
}
```

### Filtering Valid Events

```typescript
import { eventValidator } from '@deep-research/shared';

// Filter array to only valid events
const validEvents = rawEvents.filter((event): event is ResearchEvent =>
  eventValidator.isValid(event)
);

// Process valid events
validEvents.forEach(event => {
  console.log(`${event.agent}.${event.action}`);
});
```

### API Endpoint Validation

```typescript
import { eventValidator, ValidationError } from '@deep-research/shared';
import { Request, Response } from 'express';

app.post('/api/events', (req: Request, res: Response) => {
  try {
    // Validate incoming event
    eventValidator.validate(req.body);

    // Store valid event
    await eventStore.save(req.body);

    res.status(201).json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Invalid event format',
        message: error.message,
        fields: error.fields
      });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Stream Validation

```typescript
import { eventValidator, ResearchEvent } from '@deep-research/shared';

async function* validateEventStream(
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
const validatedStream = validateEventStream(rawEventStream);
for await (const event of validatedStream) {
  await processEvent(event);
}
```

### Batch Validation

```typescript
import { eventValidator, ValidationError } from '@deep-research/shared';

interface ValidationResult {
  valid: ResearchEvent[];
  invalid: Array<{
    data: unknown;
    error: ValidationError;
  }>;
}

function validateBatch(events: unknown[]): ValidationResult {
  const result: ValidationResult = {
    valid: [],
    invalid: []
  };

  for (const event of events) {
    try {
      eventValidator.validate(event);
      result.valid.push(event);
    } catch (error) {
      if (error instanceof ValidationError) {
        result.invalid.push({ data: event, error });
      }
    }
  }

  return result;
}

// Usage
const { valid, invalid } = validateBatch(rawEvents);
console.log(`Valid: ${valid.length}, Invalid: ${invalid.length}`);
```

### Custom Error Messages

```typescript
import { eventValidator, ValidationError } from '@deep-research/shared';

function validateWithCustomMessage(event: unknown): ResearchEvent {
  try {
    eventValidator.validate(event);
    return event;
  } catch (error) {
    if (error instanceof ValidationError) {
      // Customize error message for user-facing API
      throw new Error(
        `Event validation failed. Please check the following fields: ${
          error.fields?.join(', ') || 'unknown'
        }`
      );
    }
    throw error;
  }
}
```

---

## Best Practices

### 1. Always Validate External Input

Never trust external data. Always validate events from:
- API requests
- Message queues
- File uploads
- External services
- User input

```typescript
// Good
app.post('/events', (req, res) => {
  eventValidator.validate(req.body);
  // Process validated event
});

// Bad - no validation
app.post('/events', (req, res) => {
  processEvent(req.body); // Potentially unsafe!
});
```

### 2. Use Type Guards for Conditional Logic

```typescript
// Good - type-safe
if (eventValidator.isValid(data)) {
  processEvent(data); // TypeScript knows data is ResearchEvent
}

// Bad - no type safety
if (data && data.run_id) {
  processEvent(data as ResearchEvent); // Unsafe cast
}
```

### 3. Handle Validation Errors Appropriately

```typescript
// Good - specific error handling
try {
  eventValidator.validate(event);
} catch (error) {
  if (error instanceof ValidationError) {
    // Log structured validation errors
    logger.warn('Validation failed', {
      fields: error.fields,
      details: error.context
    });
  } else {
    throw error;
  }
}

// Bad - swallow all errors
try {
  eventValidator.validate(event);
} catch {
  // Error details lost!
}
```

### 4. Validate Early in the Pipeline

```typescript
// Good - validate at entry point
async function ingestEvent(rawEvent: unknown) {
  eventValidator.validate(rawEvent);
  await eventStore.save(rawEvent);
  await eventStream.publish(rawEvent);
}

// Bad - validate late
async function ingestEvent(rawEvent: unknown) {
  await eventStore.save(rawEvent); // May store invalid data!
  eventValidator.validate(rawEvent);
}
```

### 5. Use Singleton for Performance

```typescript
// Good - reuse compiled schema
import { eventValidator } from '@deep-research/shared';

eventValidator.validate(event1);
eventValidator.validate(event2);

// Bad - recompile schema each time
import { EventValidator } from '@deep-research/shared';

new EventValidator().validate(event1);
new EventValidator().validate(event2); // Wasteful!
```

### 6. Log Validation Failures

```typescript
try {
  eventValidator.validate(event);
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Event validation failed', {
      error: error.message,
      fields: error.fields,
      context: error.context,
      event: sanitize(event) // Remove sensitive data
    });
  }
  throw error;
}
```

### 7. Sanitize Error Context

```typescript
// Good - remove sensitive data
try {
  eventValidator.validate(event);
} catch (error) {
  if (error instanceof ValidationError) {
    const sanitized = {
      ...error.context,
      // Remove sensitive fields
      password: undefined,
      token: undefined
    };
    logger.error('Validation failed', sanitized);
  }
}
```

### 8. Test Edge Cases

```typescript
describe('Event validation', () => {
  it('should reject missing required fields', () => {
    const invalidEvent = {
      run_id: 'run_123'
      // Missing ts, step_id, agent, action
    };

    expect(() => eventValidator.validate(invalidEvent))
      .toThrow(ValidationError);
  });

  it('should reject invalid agent type', () => {
    const invalidEvent = {
      ts: new Date().toISOString(),
      run_id: 'run_123',
      step_id: 1,
      agent: 'invalid_agent', // Not in enum
      action: 'test.action'
    };

    expect(() => eventValidator.validate(invalidEvent))
      .toThrow(ValidationError);
  });

  it('should accept valid minimal event', () => {
    const validEvent = {
      ts: new Date().toISOString(),
      run_id: 'run_123',
      step_id: 1,
      agent: 'fetch',
      action: 'fetch.start'
    };

    expect(() => eventValidator.validate(validEvent))
      .not.toThrow();
  });
});
```

---

## Performance Considerations

### Schema Compilation

The validator compiles the JSON Schema once during instantiation and caches it for subsequent validations. This makes validation extremely fast:

```typescript
// First validation: compiles schema (~1ms)
eventValidator.validate(event1);

// Subsequent validations: uses cached schema (~0.01ms)
eventValidator.validate(event2);
eventValidator.validate(event3);
```

### Benchmark Results

Typical validation performance on standard hardware:
- **Simple event**: ~0.01ms (100,000 ops/sec)
- **Complex event**: ~0.05ms (20,000 ops/sec)
- **Batch of 1000**: ~10-50ms total

### Memory Usage

The singleton pattern ensures only one compiled schema in memory:
- **Singleton**: ~50KB (one schema)
- **Per-instance**: ~50KB per validator (avoid!)

---

## Troubleshooting

### Common Validation Errors

#### Missing Required Field

```
Event validation failed: /ts: must have required property 'ts'
```

**Solution:** Ensure all required fields are present.

#### Invalid Date Format

```
Event validation failed: /ts: must match format "date-time"
```

**Solution:** Use ISO 8601 format: `new Date().toISOString()`

#### Invalid Agent Type

```
Event validation failed: /agent: must be equal to one of the allowed values
```

**Solution:** Use one of: orchestrator, fetch, extract, index, graph, synthesis, system

#### Negative Number

```
Event validation failed: /step_id: must be >= 0
```

**Solution:** Ensure numeric fields meet minimum constraints

#### Additional Properties

```
Event validation failed: must NOT have additional properties
```

**Solution:** Remove any fields not defined in the schema

---

## Migration Guide

### From Manual Validation

**Before:**
```typescript
function validateEvent(event: any): boolean {
  return event.ts && event.run_id && event.step_id >= 0;
}
```

**After:**
```typescript
import { eventValidator } from '@deep-research/shared';

eventValidator.validate(event); // Comprehensive validation
```

### From Zod

**Before:**
```typescript
import { z } from 'zod';

const eventSchema = z.object({
  ts: z.string(),
  run_id: z.string(),
  // ...
});

eventSchema.parse(event);
```

**After:**
```typescript
import { eventValidator } from '@deep-research/shared';

eventValidator.validate(event);
```

Both Zod and Ajv are available in the package - use the validator that best fits your needs!
