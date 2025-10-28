# @deep-research/backend Documentation

Welcome to the comprehensive documentation for the `@deep-research/backend` package - the backend services and REST API for the Deep Research Cockpit platform.

## Overview

The backend package provides:

- **REST API** - HTTP endpoints for event streaming, querying, and analytics
- **Event Bus** - Real-time event distribution with pub/sub and SSE streaming
- **Event Storage** - Durable persistence to object storage (S3/MinIO)
- **Event Indexing** - Fast queries and analytics with OpenSearch (sub-500ms latency)
- **HTTP Client** - Web scraping with proper headers, rate limiting, and robots.txt compliance
- **Snapshot System** - Point-in-time state reconstruction and event replay
- **Structured Logging** - Winston-based logging with correlation IDs and JSON output

## Technology Stack

- **Runtime:** Node.js with TypeScript
- **Web Framework:** Express.js
- **Databases:** OpenSearch, Neo4j, Redis
- **Object Storage:** S3/MinIO
- **Logging:** Winston
- **HTTP Client:** Axios
- **Validation:** AJV (JSON Schema)

## Quick Start

### Installation

```bash
# From project root
npm install
cd packages/backend
npm install
```

### Configuration

Create `.env` file with required variables:

```bash
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# OpenAI
OPENAI_API_KEY=your-key-here

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# OpenSearch
OPENSEARCH_NODE=http://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-secret-here
CORS_ORIGIN=http://localhost:5173
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production build and run
npm run build
npm start

# Run tests
npm test
```

### Basic Usage

```typescript
import {
  createApp,
  eventBus,
  logger,
  createOrchestratorStartEvent,
  publishEvent,
  config
} from '@deep-research/backend';

// Create and start server
const app = createApp();
app.listen(config.port, () => {
  logger.info('Server started', { metadata: { port: config.port } });
});

// Subscribe to events
eventBus.subscribe('my-app', (event) => {
  console.log('Event:', event.action);
});

// Publish an event
const event = createOrchestratorStartEvent('run-123', {
  query: 'AI research'
});
publishEvent(event);
```

## Documentation Structure

### Core Documentation

| Document | Description |
|----------|-------------|
| **[API Reference](./API.md)** | Complete API reference for all public exports |
| **[REST API Endpoints](./modules/api.md)** | HTTP endpoint documentation |
| **[Services](./modules/services.md)** | Backend services (event bus, storage, indexing, etc.) |
| **[Middleware](./modules/middleware.md)** | Error handling and request processing |
| **[Utilities](./modules/utils.md)** | Logger and event producers |

### Quick Links

#### For API Consumers

- [REST API Endpoints](./modules/api.md) - HTTP endpoints, request/response formats
- [Event Streaming](./modules/api.md#get-eventsstream) - Real-time SSE connection
- [Event Querying](./modules/api.md#get-eventssearch) - Advanced search and filtering
- [Analytics](./modules/api.md#get-eventsanalyticscosts) - Cost and performance analytics

#### For Developers

- [Complete API Reference](./API.md) - All exported functions and classes
- [Event Bus Service](./modules/services.md#event-bus) - Pub/sub event distribution
- [OpenSearch Indexer](./modules/services.md#opensearch-event-indexer) - Fast event queries
- [Snapshot Generator](./modules/services.md#snapshot-generator) - Event replay and state reconstruction
- [Event Producers](./modules/utils.md#event-producers) - Type-safe event creation

#### For Operations

- [Configuration](../src/config/index.ts) - Environment variables and settings
- [Logger](./modules/utils.md#logger) - Structured logging and monitoring
- [Health Endpoints](./modules/api.md#get-health) - Service health checks

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Express Application                      │
├─────────────────────────────────────────────────────────────┤
│  Security (Helmet, CORS) → Body Parsing → Request Logging   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
   ┌─────────┐   ┌──────────┐   ┌──────────────┐
   │ Health  │   │  Events  │   │   Advanced   │
   │  API    │   │   API    │   │  Events API  │
   └────┬────┘   └────┬─────┘   └──────┬───────┘
        │             │                 │
        └─────────────┼─────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   Event Bus   │
              ├───────────────┤
              │ • Pub/Sub     │
              │ • SSE Stream  │
              │ • History     │
              └───────┬───────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
    ┌──────────┐ ┌─────────┐ ┌─────────┐
    │OpenSearch│ │  S3/    │ │  Redis  │
    │  Indexer │ │ MinIO   │ │ (cache) │
    └──────────┘ └─────────┘ └─────────┘
```

### Event Flow

```
Publisher
   │
   ├─► publishEvent(event)
   │
   ▼
Event Bus
   │
   ├─► Validate event
   ├─► Add to history (in-memory, last 1000)
   ├─► Emit to subscribers
   ├─► Broadcast to SSE clients
   └─► Index in OpenSearch (async)
```

### Service Dependencies

```
Event Bus
├─► OpenSearch Event Indexer → OpenSearch
├─► Event Storage → S3/MinIO
└─► Event Validator → @deep-research/shared

HTTP Client
├─► Robots Parser
└─► Rate Limiter

Snapshot Generator
└─► OpenSearch Event Indexer
```

## Key Features

### Real-Time Event Streaming

Server-Sent Events (SSE) for real-time event delivery to clients:

```typescript
// Connect to event stream
const eventSource = new EventSource('/events/stream?run_id=run-123');

eventSource.addEventListener('research_event', (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.action);
});
```

[Learn more about Event Streaming →](./modules/api.md#get-eventsstream)

### Advanced Event Queries

Fast, flexible event queries with OpenSearch (< 500ms latency):

```bash
# Search by agent and time range
curl "http://localhost:3000/events/search?agent=fetch&from=2025-10-28T00:00:00Z&to=2025-10-28T23:59:59Z"

# Get timeline aggregation
curl "http://localhost:3000/events/aggregate?type=timeline&run_id=run-123&interval=1h"

# Cost analytics
curl "http://localhost:3000/events/analytics/costs?run_id=run-123"
```

[Learn more about Event Queries →](./modules/api.md#get-eventssearch)

### Event Replay and Snapshots

Point-in-time state reconstruction:

```typescript
// Get snapshot at step 50
const snapshot = await snapshotGenerator.getSnapshotAtStep('run-123', 50);

// Calculate what happened between steps
const diff = await snapshotGenerator.getSnapshotDiff('run-123', 10, 50);
console.log(`Cost delta: $${diff.metadata.cost_delta_usd}`);

// Replay events to reconstruct state
const { state } = await snapshotGenerator.replayToSnapshot(
  snapshotId,
  stateReducer,
  initialState
);
```

[Learn more about Snapshots →](./modules/services.md#snapshot-generator)

### Type-Safe Event Creation

Factory functions for creating consistent events:

```typescript
import {
  resetRun,
  createOrchestratorStartEvent,
  createFetchCompleteEvent,
  publishEvent
} from '@deep-research/backend';

const runId = 'run-123';
resetRun(runId);

// Auto-incremented step IDs
publishEvent(createOrchestratorStartEvent(runId, {
  query: 'AI research'
})); // step_id: 1

publishEvent(createFetchCompleteEvent(runId, {
  url: 'https://example.com'
}, {
  status_code: 200,
  content_length: 15234,
  content_type: 'text/html',
  duration_ms: 523
})); // step_id: 2
```

[Learn more about Event Producers →](./modules/utils.md#event-producers)

### Structured Logging

Winston-based logging with correlation IDs:

```typescript
import { logger, createChildLogger } from '@deep-research/backend';

// Global logger
logger.info('Server started', {
  metadata: { port: 3000, env: 'development' }
});

// Child logger with correlation context
const runLogger = createChildLogger({ run_id: 'run-123' });
runLogger.info('Step completed'); // Automatically includes run_id
```

[Learn more about Logger →](./modules/utils.md#logger)

### Web Scraping Utilities

Respectful web scraping with rate limiting and robots.txt compliance:

```typescript
import { robotsParser, rateLimiter, httpClient } from '@deep-research/backend';

const url = 'https://example.com/page';

// 1. Check robots.txt
const allowed = await robotsParser.isAllowed(url);
if (!allowed) {
  throw new Error('Disallowed by robots.txt');
}

// 2. Apply crawl delay
const delay = await robotsParser.getCrawlDelay(url);
if (delay) {
  rateLimiter.applyRobotsCrawlDelay(url, delay);
}

// 3. Respect rate limit
await rateLimiter.acquire(url);

// 4. Fetch
const response = await httpClient.get(url);
```

[Learn more about HTTP Client →](./modules/services.md#http-client)

## Performance Characteristics

| Component | Target Performance |
|-----------|-------------------|
| Event Bus Latency | < 100ms event delivery |
| OpenSearch Queries | < 500ms query latency |
| SSE Heartbeat | Every 30 seconds |
| Event History Size | Last 1000 events in-memory |
| Bulk Indexing | 100 events/batch, 5s interval |
| Rate Limiter | Per-domain tracking, 1s sliding window |

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "name": "ValidationError",
    "message": "run_id is required",
    "statusCode": 400,
    "context": {
      "field": "run_id"
    },
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

[Learn more about Error Handling →](./modules/middleware.md#error-handler)

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

## Contributing

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- File headers required (see [CLAUDE.md](../../../.claude/CLAUDE.md))
- JSDoc for public APIs
- Test coverage > 80% for critical paths

### Development Workflow

1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Update documentation
5. Run linting and tests
6. Submit PR

### Documentation Updates

When adding new features:

1. Add JSDoc comments to code
2. Update relevant documentation in `docs/`
3. Update this README if needed
4. Add examples to demonstrate usage

## Troubleshooting

### Common Issues

**Issue: "Missing required environment variables"**
- Solution: Ensure all required variables in `.env` are set
- See [Configuration](#configuration) section

**Issue: "OpenSearch connection refused"**
- Solution: Start OpenSearch: `docker-compose up opensearch`
- Check `OPENSEARCH_NODE` environment variable

**Issue: "SSE connection drops"**
- Solution: Check firewall/proxy settings
- SSE requires long-lived HTTP connections
- Nginx may need `proxy_buffering off;`

**Issue: "Rate limiting too aggressive"**
- Solution: Adjust per-domain limits:
  ```typescript
  rateLimiter.setDomainLimit(url, 5); // 5 req/sec
  ```

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

View debug logs:
```typescript
logger.debug('Cache hit', {
  metadata: { key: 'user:123', ttl: 3600 }
});
```

## API Versioning

Current version: **0.1.0**

Breaking changes will increment major version. See [CHANGELOG.md](../CHANGELOG.md) for version history.

## Security

### Environment Variables

Never commit `.env` files or secrets:
- Use `.env.example` for documentation
- Rotate secrets regularly
- Use different secrets per environment

### API Security

Current security measures:
- Helmet for security headers
- CORS configuration
- Input validation
- Error message sanitization in production

Future enhancements:
- JWT authentication
- API key authentication
- Rate limiting per client

[Learn more about Middleware →](./modules/middleware.md)

## Monitoring

### Health Checks

```bash
# Check service health
curl http://localhost:3000/health

# Check event bus stats
curl http://localhost:3000/events/stats
```

### Logging

Production logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only

JSON format for log aggregators:
```json
{
  "level": "info",
  "message": "Event published",
  "metadata": {
    "run_id": "run-123",
    "latency_ms": 45
  },
  "timestamp": "2025-10-28T10:30:00.123Z"
}
```

## Related Packages

- `@deep-research/shared` - Shared types and utilities
- `@deep-research/frontend` - React frontend application

## License

MIT

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/your-org/ultra-research/issues)
- Documentation: [Full documentation](./README.md)
- API Reference: [API.md](./API.md)

---

**Last Updated:** 2025-10-28

**Documentation Version:** 0.1.0
