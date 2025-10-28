# Middleware Documentation

Documentation for Express middleware components in the `@deep-research/backend` package.

## Table of Contents

- [Error Handler](#error-handler)
- [Not Found Handler](#not-found-handler)
- [Async Handler](#async-handler)
- [Request Logging](#request-logging)

---

## Error Handler

**File:** `/src/middleware/errorHandler.ts`
**Function:** `errorHandler(err: Error, req: Request, res: Response, next: NextFunction)`

Central error handling middleware that catches and formats all errors.

### Features

- Distinguishes between operational and programming errors
- Formats consistent error responses
- Logs errors with request context
- Hides error details in production
- Handles both AppError and unexpected errors

### Error Types

#### 1. Operational Errors (AppError)

Known, expected errors from application logic.

**Characteristics:**
- Instance of `AppError` from `@deep-research/shared`
- Contains statusCode, message, context
- Full details returned to client
- Logged with request context

**Example:**
```typescript
import { AppError } from '@deep-research/shared';

throw new AppError('Resource not found', 404, {
  resource: 'user',
  id: userId
});
```

#### 2. Programming Errors

Unexpected errors from bugs or system failures.

**Characteristics:**
- Not instance of AppError
- Logged with full stack trace
- Details hidden in production
- Returns 500 status code

**Example:**
```typescript
// This will be caught as programming error
throw new Error('Unexpected null reference');
```

### Response Format

#### Operational Error Response

```json
{
  "error": {
    "name": "ValidationError",
    "message": "Invalid email format",
    "statusCode": 400,
    "context": {
      "field": "email",
      "value": "invalid-email"
    },
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

#### Programming Error Response (Development)

```json
{
  "error": {
    "name": "InternalError",
    "message": "Cannot read property 'id' of undefined",
    "statusCode": 500,
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

#### Programming Error Response (Production)

```json
{
  "error": {
    "name": "InternalError",
    "message": "Internal server error",
    "statusCode": 500,
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

### Usage

Must be registered **after all routes** in Express app:

```typescript
import express from 'express';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Routes first
app.use('/health', healthRouter);
app.use('/events', eventsRouter);

// Error handler MUST be last
app.use(errorHandler);
```

### Logging

Errors are logged with request context:

```typescript
logError('Request error', err, {
  method: req.method,
  path: req.path,
  query: req.query,
  body: req.body,
});
```

**Log Output:**
```json
{
  "level": "error",
  "message": "Request error",
  "metadata": {
    "error": {
      "message": "Invalid email format",
      "name": "ValidationError",
      "stack": "..."
    },
    "method": "POST",
    "path": "/users",
    "query": {},
    "body": {"email": "invalid-email"}
  },
  "timestamp": "2025-10-28T10:30:00.000Z"
}
```

### Error Handling Best Practices

**1. Use AppError for Known Errors**

```typescript
import { AppError } from '@deep-research/shared';

if (!event.run_id) {
  throw new AppError('run_id is required', 400, {
    field: 'run_id',
    received: event
  });
}
```

**2. Let Unexpected Errors Bubble**

```typescript
// Don't catch programming errors
const user = await database.findUser(id); // Let DB errors bubble
```

**3. Use Async Handler for Routes**

```typescript
import { asyncHandler } from './middleware/errorHandler';

router.get('/events', asyncHandler(async (req, res) => {
  // Async errors are automatically caught
  const events = await getEvents();
  res.json(events);
}));
```

---

## Not Found Handler

**Function:** `notFound(req: Request, res: Response)`

Handles requests to non-existent routes.

### Features

- Returns 404 status
- Includes requested method and path
- Consistent error format

### Response

```json
{
  "error": {
    "name": "NotFound",
    "message": "Route GET /invalid not found",
    "statusCode": 404,
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

### Usage

Register **before** the error handler but **after** all valid routes:

```typescript
import express from 'express';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// Valid routes
app.use('/health', healthRouter);
app.use('/events', eventsRouter);

// 404 handler (before error handler)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);
```

---

## Async Handler

**Function:** `asyncHandler(fn: AsyncRouteHandler): RouteHandler`

Wrapper for async route handlers that catches promise rejections.

### Problem it Solves

Without asyncHandler:

```typescript
// Promise rejection won't be caught by error handler
app.get('/events', async (req, res) => {
  const events = await getEvents(); // If this rejects, it won't be caught!
  res.json(events);
});
```

With asyncHandler:

```typescript
import { asyncHandler } from './middleware/errorHandler';

// Promise rejections are caught and passed to error handler
app.get('/events', asyncHandler(async (req, res) => {
  const events = await getEvents(); // Rejections are caught!
  res.json(events);
}));
```

### Type Definition

```typescript
type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

function asyncHandler(fn: AsyncRouteHandler): RouteHandler;
```

### Usage Examples

**Simple Route:**

```typescript
router.get('/events', asyncHandler(async (req, res) => {
  const events = await eventBus.getHistory();
  res.json(events);
}));
```

**With Error Throwing:**

```typescript
router.get('/events/:id', asyncHandler(async (req, res) => {
  const event = await getEvent(req.params.id);

  if (!event) {
    throw new AppError('Event not found', 404, {
      eventId: req.params.id
    });
  }

  res.json(event);
}));
```

**With Multiple Async Operations:**

```typescript
router.post('/events', asyncHandler(async (req, res) => {
  // All async operations are caught
  const validated = await validateEvent(req.body);
  const saved = await saveEvent(validated);
  await notifySubscribers(saved);

  res.status(201).json(saved);
}));
```

### How it Works

```typescript
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Wrap in Promise.resolve to catch both sync and async errors
    Promise.resolve(fn(req, res, next))
      .catch(next); // Pass errors to next() -> error handler
  };
}
```

### Best Practices

**1. Use for All Async Routes**

```typescript
// ✅ Good
router.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));

// ❌ Bad - unhandled promise rejection
router.get('/data', async (req, res) => {
  const data = await fetchData();
  res.json(data);
});
```

**2. Throw Errors, Don't Catch Unnecessarily**

```typescript
// ✅ Good - let errors bubble to error handler
router.post('/events', asyncHandler(async (req, res) => {
  const event = await createEvent(req.body);
  res.json(event);
}));

// ❌ Bad - catching and handling manually
router.post('/events', asyncHandler(async (req, res) => {
  try {
    const event = await createEvent(req.body);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));
```

**3. Use AppError for Operational Errors**

```typescript
router.get('/events/:id', asyncHandler(async (req, res) => {
  const event = await getEvent(req.params.id);

  if (!event) {
    // This will be caught by asyncHandler and passed to error handler
    throw new AppError('Event not found', 404, {
      eventId: req.params.id
    });
  }

  res.json(event);
}));
```

---

## Request Logging

**Location:** `/src/app.ts` (inline middleware)

Logs all incoming HTTP requests with metadata.

### Features

- Logs method, path, query, and IP
- Executed before route handlers
- Uses structured logging format

### Implementation

```typescript
app.use((req, _res, next) => {
  logger.info('Incoming request', {
    metadata: {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
    },
  });
  next();
});
```

### Log Output

```json
{
  "level": "info",
  "message": "Incoming request",
  "metadata": {
    "method": "GET",
    "path": "/events/search",
    "query": {
      "run_id": "run-123",
      "limit": "50"
    },
    "ip": "::1"
  },
  "timestamp": "2025-10-28T10:30:00.000Z"
}
```

### Use Cases

- Request auditing
- Traffic monitoring
- Debugging request flow
- Performance analysis

---

## Middleware Chain Order

**Critical:** Middleware order matters in Express!

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// 1. Security middleware (first)
app.use(helmet());
app.use(cors());

// 2. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Request logging
app.use((req, _res, next) => {
  logger.info('Incoming request', { ... });
  next();
});

// 4. Routes
app.use('/health', healthRouter);
app.use('/events', eventsRouter);

// 5. 404 handler (after all routes)
app.use(notFound);

// 6. Error handler (MUST be last)
app.use(errorHandler);
```

**Why This Order:**

1. **Security First** - Helmet and CORS before any processing
2. **Body Parsing Early** - So routes can access `req.body`
3. **Logging Before Routes** - Capture all requests
4. **Routes in Logical Order** - Most specific to least specific
5. **404 Before Error Handler** - Catch undefined routes
6. **Error Handler Last** - Catch all errors from above

---

## Error Handling Flow

```
Request
  ↓
Security Middleware (helmet, cors)
  ↓
Body Parsing (express.json)
  ↓
Request Logging
  ↓
Route Handler (wrapped in asyncHandler)
  ↓
  ├─► Success → Send Response
  │
  └─► Error Thrown
        ↓
      asyncHandler catches Promise rejection
        ↓
      Pass to next(error)
        ↓
      Error Handler Middleware
        ↓
        ├─► AppError → Format & Send
        │
        └─► Unexpected Error → Log & Send 500
```

---

## Security Middleware

While not custom middleware, these are configured in the app:

### Helmet

Security headers for HTTP responses.

```typescript
import helmet from 'helmet';
app.use(helmet());
```

**Headers Set:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- And more...

### CORS

Cross-Origin Resource Sharing configuration.

```typescript
import cors from 'cors';
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
}));
```

**Configuration:**
- `origin` - Allowed origins (from env: `CORS_ORIGIN`)
- `credentials` - Allow cookies/auth headers

---

## Related Documentation

- [API Endpoints](./api.md) - Routes that use this middleware
- [Services](./services.md) - Backend services called by routes
- [Utilities](./utils.md) - Logger used by error handler
- [Configuration](../../src/config/index.ts) - Middleware configuration
