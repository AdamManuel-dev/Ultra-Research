# Development Guide

> **Last Updated**: 2025-10-28
> **Target Audience**: Contributors, Core Team
> **Prerequisite**: [Getting Started Guide](GETTING_STARTED.md)

## Table of Contents

- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Testing Strategy](#testing-strategy)
- [Git Workflow](#git-workflow)
- [Debugging](#debugging)
- [Performance Profiling](#performance-profiling)
- [Common Tasks](#common-tasks)

---

## Development Workflow

### Daily Development Loop

```bash
# 1. Start services (if not running)
npm run docker:up

# 2. Start dev servers with hot reload
npm run dev

# 3. Make changes to code
# - Edit files in packages/backend, packages/frontend, or packages/shared
# - Changes auto-reload thanks to tsx watch (backend) and Vite HMR (frontend)

# 4. Run type checking
npm run type-check

# 5. Run linter
npm run lint

# 6. Run tests
npm run test

# 7. Commit changes (see Git Workflow section)
git add .
git commit -m "feat: add feature description"
```

### Hot Reload Behavior

**Backend** (tsx watch):
- Automatically restarts on `.ts` file changes
- Preserves Docker service connections
- Takes ~1-2 seconds to restart

**Frontend** (Vite HMR):
- Instant updates for component changes
- Preserves React state when possible
- Full reload on config changes

**Shared Package**:
- Changes require restart of backend/frontend
- Run `npm run build` in shared package if needed
- Or restart dev servers to pick up changes

---

## Project Structure

### Monorepo Organization

```
UltraResearch/
├── packages/
│   ├── backend/              # Express API and services
│   │   ├── src/
│   │   │   ├── config/       # Environment configuration
│   │   │   ├── middleware/   # Express middleware
│   │   │   ├── routes/       # API route handlers
│   │   │   ├── services/     # Business logic services
│   │   │   ├── utils/        # Utility functions
│   │   │   ├── app.ts        # Express app setup
│   │   │   └── index.ts      # Server entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/             # React application
│   │   ├── src/
│   │   │   ├── components/   # Reusable React components
│   │   │   ├── features/     # Redux slices and features
│   │   │   ├── pages/        # Route pages
│   │   │   ├── services/     # API clients (RTK Query)
│   │   │   ├── styles/       # Global styles
│   │   │   └── App.tsx       # Root component
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── shared/               # Shared types and utilities
│       ├── src/
│       │   ├── types/        # TypeScript types
│       │   │   ├── events.ts          # Event schema
│       │   │   ├── errors/            # Error classes
│       │   │   └── index.ts
│       │   └── validation/   # Validation schemas
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                     # Documentation
│   ├── guides/              # User and developer guides
│   ├── PRD/                 # Product requirements
│   └── INDEX.md             # Documentation index
│
├── docker-compose.yml       # Service orchestration
├── lerna.json              # Lerna configuration
├── package.json            # Root package with scripts
├── tsconfig.json           # Base TypeScript config
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
└── README.md               # Project overview
```

### Package Responsibilities

**@deep-research/backend**:
- Express API server
- Event bus and storage
- Fetch pipeline (HTTP and JS rendering)
- Graph and search indexing
- Orchestration logic

**@deep-research/frontend**:
- React UI components
- Redux state management
- Real-time event streaming (SSE)
- Data visualization
- User interaction controls

**@deep-research/shared**:
- TypeScript type definitions
- Event schema interfaces
- Error class definitions
- Validation utilities
- Constants and enums

---

## Code Standards

### TypeScript Guidelines

#### File Headers
**Every TypeScript file must include a header**:

```typescript
/**
 * @fileoverview Brief description of file purpose
 * @lastmodified 2025-10-28T13:21:12Z
 *
 * Features: Comma-separated list of main capabilities
 * Main APIs: Key functions or classes
 * Constraints: Dependencies, limitations, requirements
 * Patterns: Error handling, conventions, important gotchas
 */
```

Update `@lastmodified` using system date:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

#### Type Safety

**Use strict TypeScript**:
- Enable `strict: true` in tsconfig
- No `any` types (use `unknown` if truly needed)
- Prefer interfaces over types for object shapes
- Use generics for reusable components

**Good**:
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<UserProfile> {
  // Implementation
}
```

**Bad**:
```typescript
function getUser(id: any): any {  // ❌ No any types
  // Implementation
}
```

#### Naming Conventions

**Variables and Functions**:
- `camelCase` for variables and functions
- Descriptive names, avoid abbreviations
- Boolean variables start with `is`, `has`, `should`

```typescript
// Good
const userName = 'John';
const isAuthenticated = true;
function fetchUserProfile() {}

// Bad
const usr = 'John';  // ❌ Abbreviation
const auth = true;   // ❌ Not descriptive
function get() {}    // ❌ Too generic
```

**Classes and Interfaces**:
- `PascalCase` for classes, interfaces, types
- Interfaces don't need `I` prefix
- Error classes end with `Error`

```typescript
// Good
interface EventBus {}
class EventStorage {}
class ValidationError extends Error {}

// Bad
interface IEventBus {}  // ❌ No I prefix needed
class eventStorage {}   // ❌ Use PascalCase
```

**Constants**:
- `UPPER_SNAKE_CASE` for constants
- Group related constants in objects or enums

```typescript
// Good
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;

enum EventAction {
  FETCH_START = 'fetch:start',
  FETCH_COMPLETE = 'fetch:complete',
}

// Bad
const maxRetries = 3;  // ❌ Use UPPER_SNAKE_CASE
```

### ESLint Configuration

**Ruleset**: Airbnb TypeScript + Prettier

**Key Rules**:
- No unused variables
- No console.log (use logger)
- Consistent return types
- Explicit function return types
- No magic numbers

**Running ESLint**:
```bash
# Check all packages
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Check specific package
cd packages/backend
npm run lint
```

### Prettier Configuration

**Formatting Rules**:
- 2 spaces indentation
- Single quotes for strings
- Trailing commas (ES5)
- 80 character line length
- Semicolons required

**Running Prettier**:
```bash
# Format all files
npx prettier --write .

# Check formatting
npx prettier --check .
```

**Editor Integration**:
- VS Code: Install "Prettier - Code formatter" extension
- Enable "Format on Save" in settings

### Documentation Standards

#### JSDoc Comments

**Public APIs require JSDoc**:
```typescript
/**
 * Fetches content from a URL with caching and retry logic.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options including timeout and retry count
 * @returns Promise resolving to fetched content
 * @throws {FetchError} If fetch fails after retries
 *
 * @example
 * ```typescript
 * const content = await fetchContent('https://example.com', {
 *   timeout: 5000,
 *   retries: 3
 * });
 * ```
 */
async function fetchContent(
  url: string,
  options: FetchOptions
): Promise<string> {
  // Implementation
}
```

**Don't duplicate TypeScript types in JSDoc**:
```typescript
// Good
/**
 * Validates event schema.
 */
function validateEvent(event: ResearchEvent): boolean {}

// Bad
/**
 * Validates event schema.
 * @param {ResearchEvent} event - The event to validate  // ❌ Redundant
 * @returns {boolean} True if valid                      // ❌ Redundant
 */
function validateEvent(event: ResearchEvent): boolean {}
```

#### Inline Comments

**Use sparingly for complex logic**:
```typescript
// Good: Explain WHY, not WHAT
// Use exponential backoff to avoid overwhelming external APIs
const delay = Math.min(1000 * Math.pow(2, attempt), 30000);

// Bad: Obvious comment
// Increment counter by 1
counter++;  // ❌ Code is self-documenting
```

---

## Testing Strategy

See [Testing Guide](TESTING.md) for comprehensive testing documentation.

### Quick Reference

**Run all tests**:
```bash
npm run test
```

**Run tests for specific package**:
```bash
cd packages/backend
npm run test

cd packages/shared
npm run test
```

**Run tests in watch mode**:
```bash
cd packages/backend
npm run test:watch
```

**Generate coverage report**:
```bash
npm run test:coverage
```

**Coverage targets**:
- Unit tests: >80% coverage for business logic
- Integration tests: Critical paths covered
- E2E tests: User workflows covered (planned)

---

## Git Workflow

### Branch Strategy

**Main branches**:
- `main` - Production-ready code
- `develop` - Integration branch (future)

**Feature branches**:
```bash
# Create feature branch
git checkout -b feature/add-graph-retrieval

# Work on feature
git add .
git commit -m "feat: add graph-guided retrieval"

# Push to remote
git push -u origin feature/add-graph-retrieval
```

### Commit Message Format

**Follow Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
# Feature
git commit -m "feat(backend): add event streaming via SSE"

# Bug fix
git commit -m "fix(frontend): resolve race condition in event handler"

# Documentation
git commit -m "docs(guides): add development workflow guide"

# Refactoring
git commit -m "refactor(shared): extract error classes to separate files"

# With body
git commit -m "feat(backend): add graph-guided retrieval

Implements hybrid retrieval combining BM25, vector search,
and graph-guided expansion using Neo4j relationships.

Closes #42"
```

### Pre-commit Hooks

**Husky runs checks before commit**:
1. ESLint check
2. TypeScript type check
3. Prettier formatting check

**If checks fail**:
```bash
# Fix issues
npm run lint:fix
npm run type-check

# Retry commit
git commit
```

**Skip hooks** (emergency only):
```bash
git commit --no-verify -m "emergency fix"
```

---

## Debugging

### Backend Debugging

#### Using VS Code Debugger

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/packages/backend",
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      }
    }
  ]
}
```

**Usage**:
1. Set breakpoints in code
2. Press F5 or click "Run and Debug"
3. Inspect variables, step through code

#### Logging

**Use Winston logger, not console.log**:
```typescript
import { logger } from '@/utils/logger';

// Log with context
logger.info('Fetching content', { url, run_id });
logger.error('Fetch failed', { url, error: err.message });
logger.debug('Cache hit', { key });

// Create child logger with context
const childLogger = logger.child({ run_id, step_id });
childLogger.info('Processing event');
```

**Log Levels**:
- `error`: Errors that need attention
- `warn`: Warnings, degraded functionality
- `info`: Important events (default in production)
- `debug`: Detailed debugging (development only)

**View logs**:
```bash
# Backend logs
# In terminal running npm run dev

# Docker service logs
npm run docker:logs

# Specific service
docker-compose logs -f neo4j
docker-compose logs -f opensearch
```

### Frontend Debugging

#### React DevTools

**Install extension**:
- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**Usage**:
1. Open DevTools (F12)
2. Navigate to "Components" or "Profiler" tab
3. Inspect component props, state, hooks

#### Redux DevTools

**Install extension**:
- [Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

**Usage**:
1. Open DevTools (F12)
2. Navigate to "Redux" tab
3. View actions, state, time-travel debugging

#### Browser Console

**Log from components**:
```typescript
// Use console.log for development debugging
console.log('Component rendered', { props, state });

// Remove before committing (ESLint will warn)
```

### Network Debugging

**Chrome DevTools Network Tab**:
1. Open DevTools (F12)
2. Navigate to "Network" tab
3. Filter by "XHR" or "Fetch"
4. Inspect API requests/responses

**SSE Debugging**:
```bash
# Monitor SSE stream with curl
curl -N http://localhost:3001/events/stream

# Should see events as they're published
```

**API Testing with curl**:
```bash
# Health check
curl http://localhost:3001/health | jq

# Query events
curl "http://localhost:3001/events?run_id=abc123" | jq

# Publish event
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d @event.json
```

---

## Performance Profiling

### Backend Profiling

**Measure execution time**:
```typescript
const startTime = Date.now();
await someOperation();
const duration = Date.now() - startTime;

logger.info('Operation completed', { duration_ms: duration });
```

**Event timing**:
```typescript
// Events automatically include cost_ms
const event = createFetchEvent('fetch:http_complete', run_id, step_id, {
  cost_ms: duration,
  // ...
});
```

**Node.js Profiler**:
```bash
# Run with profiler
node --prof packages/backend/dist/index.js

# Process profile
node --prof-process isolate-*.log > profile.txt
```

### Frontend Profiling

**React Profiler**:
1. Open React DevTools
2. Click "Profiler" tab
3. Click "Record"
4. Perform actions
5. Click "Stop"
6. Analyze flame graph

**Chrome Performance Tab**:
1. Open DevTools (F12)
2. Navigate to "Performance" tab
3. Click "Record"
4. Perform actions
5. Click "Stop"
6. Analyze timeline, bottlenecks

### Database Profiling

**Neo4j Query Profiling**:
```cypher
PROFILE
MATCH (c:Claim)-[:SUPPORTED_BY]->(s:Source)
WHERE s.tier = 'L0'
RETURN c, s
LIMIT 10
```

**OpenSearch Query Profiling**:
```bash
curl -k -u admin:Admin@123 -X POST \
  "https://localhost:9200/events/_search?profile=true" \
  -H "Content-Type: application/json" \
  -d '{"query": {"match_all": {}}}'
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Create route handler** in `packages/backend/src/routes/`:
   ```typescript
   import { Router } from 'express';

   const router = Router();

   router.get('/my-endpoint', async (req, res, next) => {
     try {
       // Implementation
       res.json({ data: 'response' });
     } catch (err) {
       next(err);
     }
   });

   export default router;
   ```

2. **Register route** in `packages/backend/src/app.ts`:
   ```typescript
   import myRoutes from './routes/my-endpoint';

   app.use('/api/my', myRoutes);
   ```

3. **Add tests** in `packages/backend/src/routes/my-endpoint.test.ts`:
   ```typescript
   import request from 'supertest';
   import { createApp } from '../app';

   describe('GET /api/my/my-endpoint', () => {
     it('should return data', async () => {
       const app = createApp();
       const response = await request(app).get('/api/my/my-endpoint');

       expect(response.status).toBe(200);
       expect(response.body).toHaveProperty('data');
     });
   });
   ```

### Adding a New Event Type

1. **Update event schema** in `packages/shared/src/types/events.ts`:
   ```typescript
   export interface ResearchEvent {
     // ... existing fields
     action: 'fetch:start' | 'fetch:complete' | 'my:new_action' | ...;
   }
   ```

2. **Create event producer** in `packages/backend/src/utils/event-producers.ts`:
   ```typescript
   export function createMyEvent(
     action: string,
     runId: string,
     stepId: string,
     data: any
   ): ResearchEvent {
     return {
       ts: new Date().toISOString(),
       run_id: runId,
       step_id: stepId,
       agent: 'my-service',
       action,
       // ... additional fields
     };
   }
   ```

3. **Emit events** in service:
   ```typescript
   import { eventBus } from '@/services/event-bus';
   import { createMyEvent } from '@/utils/event-producers';

   const event = createMyEvent('my:new_action', runId, stepId, data);
   eventBus.publish(event);
   ```

### Adding a New React Component

1. **Create component** in `packages/frontend/src/components/`:
   ```typescript
   import React from 'react';

   interface MyComponentProps {
     title: string;
     onAction: () => void;
   }

   export const MyComponent: React.FC<MyComponentProps> = ({
     title,
     onAction,
   }) => {
     return (
       <div>
         <h2>{title}</h2>
         <button onClick={onAction}>Click</button>
       </div>
     );
   };
   ```

2. **Add tests** in same directory:
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react';
   import { MyComponent } from './MyComponent';

   describe('MyComponent', () => {
     it('should render title', () => {
       render(<MyComponent title="Test" onAction={() => {}} />);
       expect(screen.getByText('Test')).toBeInTheDocument();
     });

     it('should call onAction when clicked', () => {
       const handleAction = jest.fn();
       render(<MyComponent title="Test" onAction={handleAction} />);

       fireEvent.click(screen.getByText('Click'));
       expect(handleAction).toHaveBeenCalled();
     });
   });
   ```

### Updating Shared Types

1. **Edit types** in `packages/shared/src/types/`:
   ```typescript
   export interface MyNewType {
     id: string;
     name: string;
   }
   ```

2. **Rebuild shared package**:
   ```bash
   cd packages/shared
   npm run build
   ```

3. **Restart dev servers** to pick up changes:
   ```bash
   # Press Ctrl+C in npm run dev terminal
   npm run dev
   ```

### Running Specific Tests

```bash
# Run tests matching pattern
npm run test -- --testNamePattern="EventBus"

# Run tests in specific file
npm run test -- event-bus.test.ts

# Run tests with coverage
npm run test -- --coverage --collectCoverageFrom="src/services/event-bus.ts"
```

---

## Next Steps

- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation
- **[Contributing Guide](../../CONTRIBUTING.md)** - Contribution guidelines
- **[Architecture Overview](../../ARCHITECTURE.md)** - System architecture
- **[Deployment Guide](DEPLOYMENT.md)** - Deployment procedures (coming soon)

---

**Happy coding! 🚀**

For questions or issues, please:
- Check existing documentation
- Search GitHub issues
- Open a new issue with details
- Ask in community channels
