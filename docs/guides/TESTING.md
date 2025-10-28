# Testing Guide

> **Last Updated**: 2025-10-28
> **Target Audience**: Contributors, QA Engineers
> **Prerequisite**: [Development Guide](DEVELOPMENT.md)

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Organization](#test-organization)
- [Coverage Requirements](#coverage-requirements)
- [Continuous Integration](#continuous-integration)

---

## Testing Philosophy

### Testing Pyramid

```
        /\
       /E2E\        Few: Critical user workflows
      /──────\
     /  API  \      Some: Integration tests
    /────────\
   /   Unit   \     Many: Fast, isolated tests
  /────────────\
```

**Principles**:
1. **Fast feedback**: Unit tests run in milliseconds
2. **Isolated**: Tests don't depend on each other
3. **Deterministic**: Same input always produces same output
4. **Maintainable**: Tests are easy to understand and update
5. **Comprehensive**: Cover happy paths, edge cases, and errors

### Test Types

**Unit Tests** (70% of tests):
- Test individual functions/classes in isolation
- Mock external dependencies
- Fast execution (<10ms per test)
- High coverage of business logic

**Integration Tests** (25% of tests):
- Test interactions between components
- Use real dependencies (databases, APIs)
- Slower execution (<1s per test)
- Cover critical data flows

**E2E Tests** (5% of tests - Planned):
- Test complete user workflows
- Use real browser and services
- Slowest execution (<10s per test)
- Cover critical user paths

---

## Testing Stack

### Backend

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner and assertion library |
| **ts-jest** | TypeScript support for Jest |
| **Supertest** | HTTP integration testing |
| **@types/jest** | TypeScript type definitions |

**Configuration**: `packages/backend/jest.config.js`

### Frontend

| Tool | Purpose |
|------|---------|
| **Vitest** | Fast Vite-native test runner |
| **@testing-library/react** | React component testing |
| **@testing-library/user-event** | User interaction simulation |
| **@testing-library/jest-dom** | Custom DOM matchers |

**Configuration**: `packages/frontend/vitest.config.ts`

### Shared

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner and assertion library |
| **ts-jest** | TypeScript support |

**Configuration**: `packages/shared/jest.config.js`

---

## Running Tests

### All Packages

```bash
# Run all tests across all packages
npm run test

# Run with coverage
npm run test:coverage

# Watch mode (re-run on changes)
npm run test:watch  # Note: May not work at root level
```

### Specific Package

```bash
# Backend tests
cd packages/backend
npm run test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Frontend tests
cd packages/frontend
npm run test

# Shared tests
cd packages/shared
npm run test
```

### Specific Test File

```bash
# Run specific test file
npm run test -- event-bus.test.ts

# Run tests matching pattern
npm run test -- --testNamePattern="EventBus"

# Run single test
npm run test -- --testNamePattern="should emit events"
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open packages/backend/coverage/lcov-report/index.html

# Coverage summary in terminal
npm run test:coverage -- --verbose
```

---

## Writing Tests

### Unit Tests

#### Basic Structure

```typescript
/**
 * @fileoverview Tests for EventBus service
 * @lastmodified 2025-10-28
 */

import { EventBus } from './event-bus';
import { ResearchEvent } from '@deep-research/shared';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    // Setup: Create fresh instance for each test
    eventBus = new EventBus();
  });

  afterEach(() => {
    // Teardown: Clean up resources
    eventBus.close();
  });

  describe('publish', () => {
    it('should emit events to subscribers', () => {
      // Arrange
      const event: ResearchEvent = {
        ts: '2025-10-28T13:21:12Z',
        run_id: 'test-run',
        step_id: '1',
        agent: 'test',
        action: 'test:action',
      };
      const callback = jest.fn();
      eventBus.subscribe(callback);

      // Act
      eventBus.publish(event);

      // Assert
      expect(callback).toHaveBeenCalledWith(event);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers', () => {
      const event: ResearchEvent = { /* ... */ };
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventBus.subscribe(callback1);
      eventBus.subscribe(callback2);
      eventBus.publish(event);

      expect(callback1).toHaveBeenCalledWith(event);
      expect(callback2).toHaveBeenCalledWith(event);
    });

    it('should not emit to unsubscribed listeners', () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe(callback);

      unsubscribe();  // Unsubscribe before publishing
      eventBus.publish({ /* event */ });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe(callback);

      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });
});
```

#### Mocking Dependencies

**Mock external services**:
```typescript
import { fetchContent } from './fetch-service';
import { httpClient } from './http-client';

// Mock the HTTP client
jest.mock('./http-client');

describe('fetchContent', () => {
  it('should fetch content from URL', async () => {
    // Arrange: Mock the HTTP response
    const mockHtml = '<html><body>Content</body></html>';
    (httpClient.get as jest.Mock).mockResolvedValue({
      data: mockHtml,
      status: 200,
    });

    // Act
    const content = await fetchContent('https://example.com');

    // Assert
    expect(httpClient.get).toHaveBeenCalledWith('https://example.com');
    expect(content).toContain('Content');
  });

  it('should throw error on HTTP failure', async () => {
    // Arrange: Mock HTTP error
    (httpClient.get as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    // Act & Assert
    await expect(fetchContent('https://example.com')).rejects.toThrow(
      'Network error'
    );
  });
});
```

**Mock modules**:
```typescript
// Mock entire module
jest.mock('@/services/event-bus', () => ({
  eventBus: {
    publish: jest.fn(),
    subscribe: jest.fn(),
  },
}));

// Mock specific exports
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));
```

#### Testing Async Code

**Promise-based**:
```typescript
it('should resolve with data', async () => {
  const result = await asyncFunction();
  expect(result).toEqual(expectedValue);
});

it('should reject with error', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

**Callback-based**:
```typescript
it('should call callback with result', (done) => {
  functionWithCallback((err, result) => {
    expect(err).toBeNull();
    expect(result).toEqual(expectedValue);
    done();
  });
});
```

**Testing timers**:
```typescript
jest.useFakeTimers();

it('should execute after delay', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);

  jest.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});

jest.useRealTimers();
```

### Integration Tests

#### API Integration Tests

```typescript
/**
 * @fileoverview Integration tests for health endpoint
 * @lastmodified 2025-10-28
 */

import request from 'supertest';
import { createApp } from '../app';

describe('GET /health', () => {
  let app: Express;

  beforeAll(() => {
    // Setup: Create app instance
    app = createApp();
  });

  it('should return 200 and health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: expect.stringMatching(/healthy|degraded/),
      services: expect.any(Object),
      uptime_seconds: expect.any(Number),
    });
  });

  it('should include service statuses', async () => {
    const response = await request(app).get('/health');

    expect(response.body.services).toHaveProperty('neo4j');
    expect(response.body.services).toHaveProperty('opensearch');
    expect(response.body.services).toHaveProperty('redis');
  });

  it('should return 503 when services unavailable', async () => {
    // This test requires services to be down - skip in CI
    // Or mock service connections to return errors
  });
});
```

#### Database Integration Tests

```typescript
/**
 * @fileoverview Integration tests for Graph Memory service
 * @lastmodified 2025-10-28
 */

import { GraphMemoryService } from './graph-memory';
import neo4j from 'neo4j-driver';

describe('GraphMemoryService', () => {
  let service: GraphMemoryService;
  let driver: neo4j.Driver;

  beforeAll(async () => {
    // Connect to test database
    driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'research_password')
    );
    service = new GraphMemoryService(driver);
  });

  afterAll(async () => {
    // Clean up connections
    await driver.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    const session = driver.session();
    try {
      await session.run('MATCH (n) DETACH DELETE n');
    } finally {
      await session.close();
    }
  });

  describe('upsertClaim', () => {
    it('should create new claim with source relationship', async () => {
      const claim = {
        text: 'Test claim',
        confidence: 0.9,
        source_url: 'https://example.com',
      };

      await service.upsertClaim(claim);

      // Verify claim was created
      const session = driver.session();
      try {
        const result = await session.run(
          'MATCH (c:Claim {text: $text}) RETURN c',
          { text: claim.text }
        );
        expect(result.records.length).toBe(1);
      } finally {
        await session.close();
      }
    });
  });
});
```

### Frontend Component Tests

```typescript
/**
 * @fileoverview Tests for EventLog component
 * @lastmodified 2025-10-28
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EventLog } from './EventLog';
import { ResearchEvent } from '@deep-research/shared';

describe('EventLog', () => {
  const mockEvents: ResearchEvent[] = [
    {
      ts: '2025-10-28T13:21:12Z',
      run_id: 'test-run',
      step_id: '1',
      agent: 'orchestrator',
      action: 'orchestrator:plan',
      output_summary: 'Planning research task',
    },
    {
      ts: '2025-10-28T13:21:13Z',
      run_id: 'test-run',
      step_id: '2',
      agent: 'fetch',
      action: 'fetch:http_start',
      output_summary: 'Fetching https://example.com',
    },
  ];

  it('should render list of events', () => {
    render(<EventLog events={mockEvents} />);

    expect(screen.getByText('Planning research task')).toBeInTheDocument();
    expect(screen.getByText('Fetching https://example.com')).toBeInTheDocument();
  });

  it('should filter events by agent', () => {
    render(<EventLog events={mockEvents} />);

    // Click filter for "orchestrator"
    const filterButton = screen.getByRole('button', { name: /orchestrator/i });
    fireEvent.click(filterButton);

    // Should show only orchestrator event
    expect(screen.getByText('Planning research task')).toBeInTheDocument();
    expect(screen.queryByText('Fetching https://example.com')).not.toBeInTheDocument();
  });

  it('should display empty state when no events', () => {
    render(<EventLog events={[]} />);

    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });

  it('should call onEventClick when event is clicked', () => {
    const handleEventClick = jest.fn();
    render(<EventLog events={mockEvents} onEventClick={handleEventClick} />);

    const firstEvent = screen.getByText('Planning research task');
    fireEvent.click(firstEvent);

    expect(handleEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });
});
```

#### Testing Redux

```typescript
import { configureStore } from '@reduxjs/toolkit';
import eventsReducer, { addEvent } from './eventsSlice';

describe('eventsSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        events: eventsReducer,
      },
    });
  });

  it('should add event to state', () => {
    const event: ResearchEvent = { /* ... */ };

    store.dispatch(addEvent(event));

    const state = store.getState().events;
    expect(state.items).toContain(event);
  });
});
```

---

## Test Organization

### File Naming

**Co-located tests**:
```
src/
├── services/
│   ├── event-bus.ts
│   └── event-bus.test.ts      # ✓ Test next to source
```

**Separate test directory** (alternative):
```
src/
├── services/
│   └── event-bus.ts
└── __tests__/
    └── services/
        └── event-bus.test.ts   # ✓ Mirrored structure
```

### Test Suite Organization

**Group related tests**:
```typescript
describe('EventBus', () => {
  describe('publish', () => {
    it('should emit to subscribers', () => {});
    it('should handle errors', () => {});
  });

  describe('subscribe', () => {
    it('should register listener', () => {});
    it('should return unsubscribe function', () => {});
  });
});
```

### Setup and Teardown

**beforeEach / afterEach** for each test:
```typescript
describe('Service', () => {
  let service: Service;

  beforeEach(() => {
    service = new Service();
  });

  afterEach(() => {
    service.cleanup();
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

**beforeAll / afterAll** for entire suite:
```typescript
describe('Integration tests', () => {
  beforeAll(async () => {
    // Expensive setup (database connection)
    await connectToDatabase();
  });

  afterAll(async () => {
    // Cleanup
    await disconnectFromDatabase();
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

---

## Coverage Requirements

### Targets

**Overall coverage**: >80%
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

**Per package**:
- **Backend**: >85% (business logic critical)
- **Frontend**: >75% (UI components harder to test)
- **Shared**: >90% (foundational code)

### Checking Coverage

```bash
# Generate coverage report
npm run test:coverage

# View summary in terminal
npm run test:coverage -- --verbose

# View detailed HTML report
open coverage/lcov-report/index.html
```

### Coverage Configuration

**Jest** (`jest.config.js`):
```javascript
module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
```

### Excluding Files

**Files to exclude from coverage**:
- Test files (*.test.ts)
- Type definitions (*.d.ts)
- Entry points (index.ts)
- Configuration files
- Generated code

---

## Continuous Integration

### GitHub Actions (Planned)

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      neo4j:
        image: neo4j:5.15-community
        ports:
          - 7687:7687
        env:
          NEO4J_AUTH: neo4j/test_password

      opensearch:
        image: opensearchproject/opensearch:2.11.1
        ports:
          - 9200:9200
        env:
          discovery.type: single-node

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hooks

**Husky configuration** (`.husky/pre-commit`):
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type check
npm run type-check

# Run linter
npm run lint

# Run tests
npm run test

# If any fail, commit is blocked
```

---

## Best Practices

### 1. Test Naming

**Use descriptive test names**:
```typescript
// Good
it('should throw ValidationError when event is missing required fields', () => {});

// Bad
it('should throw error', () => {});  // ❌ Too vague
it('test 1', () => {});              // ❌ Not descriptive
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should calculate total correctly', () => {
  // Arrange: Setup test data
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 },
  ];

  // Act: Execute the code under test
  const total = calculateTotal(items);

  // Assert: Verify the result
  expect(total).toBe(35);
});
```

### 3. One Assertion Per Test

```typescript
// Good: Focused tests
it('should return 200 status', async () => {
  const response = await request(app).get('/health');
  expect(response.status).toBe(200);
});

it('should return health data', async () => {
  const response = await request(app).get('/health');
  expect(response.body).toHaveProperty('status');
});

// Bad: Multiple concerns
it('should return health data', async () => {
  const response = await request(app).get('/health');
  expect(response.status).toBe(200);  // ❌ Testing two things
  expect(response.body).toHaveProperty('status');
});
```

### 4. Test Edge Cases

```typescript
describe('divide', () => {
  it('should divide positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should divide negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });

  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle very large numbers', () => {
    expect(divide(Number.MAX_SAFE_INTEGER, 2)).toBe(Number.MAX_SAFE_INTEGER / 2);
  });
});
```

### 5. Avoid Test Interdependence

```typescript
// Bad: Tests depend on execution order
describe('Counter', () => {
  let counter = 0;

  it('should increment', () => {
    counter++;
    expect(counter).toBe(1);
  });

  it('should increment again', () => {
    counter++;  // ❌ Depends on previous test
    expect(counter).toBe(2);
  });
});

// Good: Independent tests
describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter();  // ✓ Fresh state for each test
  });

  it('should increment from 0 to 1', () => {
    counter.increment();
    expect(counter.value).toBe(1);
  });

  it('should increment from 0 to 1 again', () => {
    counter.increment();
    expect(counter.value).toBe(1);  // ✓ Independent
  });
});
```

---

## Troubleshooting Tests

### Tests Fail Locally

**Clear Jest cache**:
```bash
npm run test -- --clearCache
```

**Ensure services are running**:
```bash
docker-compose ps
# All services should be "healthy"
```

**Check environment variables**:
```bash
cat .env
# Verify database connection strings
```

### Tests Timeout

**Increase timeout**:
```typescript
it('should complete long operation', async () => {
  // Increase timeout for this test
  jest.setTimeout(10000);  // 10 seconds

  await longRunningOperation();
}, 10000);  // Or specify timeout here
```

### Flaky Tests

**Common causes**:
1. Race conditions in async code
2. Shared state between tests
3. External dependencies (network, time)
4. Insufficient waiting for async operations

**Solutions**:
```typescript
// Use async/await properly
it('should fetch data', async () => {
  await act(async () => {
    render(<Component />);
  });
  expect(screen.getByText('Data')).toBeInTheDocument();
});

// Wait for elements
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

---

## Next Steps

- **[Development Guide](DEVELOPMENT.md)** - Development workflow
- **[Contributing Guide](../../CONTRIBUTING.md)** - Contribution guidelines
- **[Architecture Overview](../../ARCHITECTURE.md)** - System architecture

---

**Happy testing! ✅**

For questions or issues:
- Check test examples in codebase
- Review Jest/Vitest documentation
- Ask in community channels
