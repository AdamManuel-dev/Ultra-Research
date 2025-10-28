# Backend Services Documentation

This document provides comprehensive documentation for all backend services in the `@deep-research/backend` package.

## Table of Contents

- [Event Bus](#event-bus)
- [Event Storage](#event-storage)
- [OpenSearch Event Indexer](#opensearch-event-indexer)
- [HTTP Client](#http-client)
- [Rate Limiter](#rate-limiter)
- [Robots Parser](#robots-parser)
- [Snapshot Generator](#snapshot-generator)

---

## Event Bus

**File:** `/src/services/event-bus.ts`
**Purpose:** Real-time event distribution with pub/sub pattern and Server-Sent Events (SSE) streaming

### Features

- Publish/subscribe event distribution
- Server-Sent Events (SSE) streaming for real-time updates
- WebSocket support for bidirectional communication
- Subscriber management with filtering by `run_id`
- Connection lifecycle management
- In-memory event history (last 1000 events)
- Automatic integration with OpenSearch for durable storage

### Architecture

The EventBus uses Node.js EventEmitter pattern with additional SSE client management:

```
┌─────────────┐
│   Publisher │
└──────┬──────┘
       │ publish(event)
       ▼
┌─────────────────┐
│    EventBus     │
├─────────────────┤
│ • Validators    │
│ • History       │
│ • Subscribers   │
│ • SSE Clients   │
└─────┬───────────┘
      │
      ├──► In-Memory Subscribers
      ├──► SSE Clients (HTTP)
      └──► OpenSearch (async)
```

### API Reference

#### Class: `EventBus`

##### `publish(event: ResearchEvent): void`

Publishes an event to all subscribers and SSE clients.

**Parameters:**
- `event` - Research event conforming to the event schema

**Behavior:**
1. Validates event against schema
2. Adds to in-memory history (max 1000 events)
3. Emits to all matching subscribers
4. Broadcasts to all matching SSE clients
5. Asynchronously indexes in OpenSearch

**Performance:** Target latency < 100ms for event delivery

**Example:**
```typescript
import { eventBus } from './services/event-bus';
import { ResearchEvent } from '@deep-research/shared';

const event: ResearchEvent = {
  ts: new Date().toISOString(),
  run_id: 'run-123',
  step_id: 1,
  agent: 'orchestrator',
  action: 'orchestrator.start',
  input: { query: 'AI research' }
};

eventBus.publish(event);
```

##### `subscribe(id: string, callback: (event: ResearchEvent) => void, runId?: string): () => void`

Subscribe to events with optional filtering by run_id.

**Parameters:**
- `id` - Unique subscriber identifier
- `callback` - Function called for each matching event
- `runId` - (Optional) Filter events by run_id

**Returns:** Unsubscribe function

**Example:**
```typescript
// Subscribe to all events
const unsubscribe = eventBus.subscribe('my-subscriber', (event) => {
  console.log('Received event:', event.action);
});

// Subscribe to specific run
const unsubscribeRun = eventBus.subscribe('run-specific', (event) => {
  console.log('Run event:', event.action);
}, 'run-123');

// Later: unsubscribe
unsubscribe();
```

##### `streamSSE(req: Request, res: Response, runId?: string): void`

Creates a Server-Sent Events stream for real-time event delivery.

**Parameters:**
- `req` - Express request object
- `res` - Express response object
- `runId` - (Optional) Filter events by run_id

**SSE Headers Set:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`
- `X-Accel-Buffering: no` (disables nginx buffering)

**Events Sent:**
- `heartbeat` - Every 30 seconds to keep connection alive
- `research_event` - When new events are published

**Example:**
```typescript
// Express route handler
app.get('/events/stream', (req, res) => {
  const runId = req.query.run_id as string | undefined;
  eventBus.streamSSE(req, res, runId);
});
```

##### `getHistory(runId?: string, limit?: number): ResearchEvent[]`

Retrieves recent events from in-memory history.

**Parameters:**
- `runId` - (Optional) Filter by run_id
- `limit` - (Optional) Maximum number of events to return

**Returns:** Array of recent events

**Note:** History is limited to last 1000 events. For full history, use OpenSearch.

##### `getStats(): { subscribers: number; sseClients: number; historySize: number }`

Returns current statistics about the event bus.

### Performance Characteristics

- **Event Delivery:** < 100ms latency target
- **History Size:** Last 1000 events (circular buffer)
- **Max Listeners:** 100 concurrent subscribers
- **SSE Heartbeat:** 30 seconds
- **Backpressure:** Handles SSE client slow consumers by dropping dead connections

### Error Handling

- Subscriber callback errors are caught and logged, doesn't affect other subscribers
- SSE write errors remove the dead client from active clients
- OpenSearch indexing errors are logged but don't block event publishing

---

## Event Storage

**File:** `/src/services/event-storage.ts`
**Purpose:** Durable event persistence to object storage (S3/MinIO) with JSONL format

### Features

- Append-only event storage
- JSONL (JSON Lines) format for efficient streaming
- Date and run_id based partitioning
- Buffered writes with automatic flushing
- Configurable batch size and flush interval

### Architecture

```
Events → Buffer → Batch Flush → Object Storage
           │            │
           │            └─► Partition: run_id/YYYY-MM-DD/
           │
           └─► Auto-flush on:
                • Batch size reached (100 events)
                • Flush interval (30s)
                • Manual flush()
```

### Partitioning Strategy

Events are partitioned by:
1. **run_id** - Top-level partition
2. **Date** - YYYY-MM-DD based on event timestamp
3. **File** - Timestamped JSONL files

**Example Structure:**
```
events/
  run-abc123/
    2025-10-28/
      2025-10-28T10-30-00-123.jsonl
      2025-10-28T11-15-30-456.jsonl
  run-def456/
    2025-10-28/
      2025-10-28T09-00-00-789.jsonl
```

### API Reference

#### Class: `EventStorage`

##### `constructor(config?: Partial<StorageConfig>)`

Creates an event storage instance.

**Config Options:**
- `bucketName` - S3/MinIO bucket name (default: 'research-events')
- `flushInterval` - Auto-flush interval in ms (default: 30000)
- `batchSize` - Events per batch (default: 100)

##### `store(event: ResearchEvent): void`

Adds an event to the buffer for batched write.

**Auto-flush Trigger:** Flushes immediately if batch size reached

##### `flush(partition?: string): Promise<void>`

Flushes buffered events to object storage.

**Parameters:**
- `partition` - (Optional) Specific partition to flush, or all if omitted

##### `retrieve(runId: string, fromDate?: Date, toDate?: Date): ResearchEvent[]`

Retrieves events for a run from object storage.

**Status:** TODO - Implementation pending

##### `getStats(): { partitions: number; bufferedEvents: number }`

Returns current buffer statistics.

### Configuration

```typescript
const storage = new EventStorage({
  bucketName: 'my-events',
  flushInterval: 60000, // 1 minute
  batchSize: 500
});
```

### Notes

- Object storage implementation (S3/MinIO client) is pending
- Currently logs write operations but doesn't persist to storage
- Designed for write-heavy workloads with batched writes

---

## OpenSearch Event Indexer

**File:** `/src/services/opensearch-event-indexer.ts`
**Purpose:** Fast event queries and analytics with sub-500ms latency

### Features

- Event indexing with bulk operations
- Advanced filtering and full-text search
- Aggregations for analytics (costs, performance, errors)
- Time-series optimization with daily indices
- Index templates for consistent mapping
- Sub-500ms query latency target

### Architecture

```
Events → Bulk Buffer → OpenSearch
           │              │
           │              ├─► Daily Indices (research-events-YYYY-MM-DD)
           │              ├─► Index Templates
           │              └─► Aggregations Engine
           │
           └─► Auto-flush every 5s or 100 events
```

### Index Strategy

**Daily Indices:** `research-events-YYYY-MM-DD`

**Benefits:**
- Efficient time-range queries
- Easy retention management (delete old indices)
- Optimal shard sizing

**Mappings:**
- `ts` - Date field for time-series queries
- `run_id`, `agent`, `action` - Keyword fields for exact matching
- `cost.*` - Numeric fields for aggregations
- `input`, `output`, `metadata` - Object fields for flexible storage
- `artifacts.*` - Keyword arrays for references

### API Reference

#### Class: `OpenSearchEventIndexer`

##### `initializeTemplates(): Promise<void>`

Creates index templates for consistent mappings across daily indices.

**Call Once:** At application startup

##### `indexEvent(event: ResearchEvent): Promise<void>`

Indexes a single event (buffered for bulk operations).

**Bulk Flush:** Automatic when buffer reaches 100 events or after 5 seconds

##### `searchEvents(query: EventQuery): Promise<EventSearchResult>`

Searches events with filters.

**Query Parameters:**
- `run_id` - Filter by run ID
- `agent` - Filter by agent type
- `action` - Filter by action type
- `from` - Start timestamp (ISO string)
- `to` - End timestamp (ISO string)
- `limit` - Max results (default: 100)
- `offset` - Pagination offset

**Returns:**
```typescript
{
  events: ResearchEvent[],
  total: number,
  took_ms: number
}
```

**Example:**
```typescript
const result = await opensearchEventIndexer.searchEvents({
  run_id: 'run-123',
  agent: 'fetch',
  from: '2025-10-28T00:00:00Z',
  to: '2025-10-28T23:59:59Z',
  limit: 50
});

console.log(`Found ${result.total} events in ${result.took_ms}ms`);
```

##### `aggregateEvents(query: EventQuery, aggregations: Record<string, any>): Promise<EventSearchResult>`

Performs aggregations for analytics.

**Common Aggregations:**

**Cost Analysis:**
```typescript
const costAgg = await opensearchEventIndexer.aggregateEvents(
  { run_id: 'run-123' },
  {
    total_cost: { sum: { field: 'cost.usd' } },
    cost_by_agent: {
      terms: { field: 'agent', size: 20 },
      aggs: {
        total_cost: { sum: { field: 'cost.usd' } }
      }
    }
  }
);
```

**Performance Analysis:**
```typescript
const perfAgg = await opensearchEventIndexer.aggregateEvents(
  { agent: 'fetch' },
  {
    avg_duration: { avg: { field: 'cost.compute_ms' } },
    percentiles: {
      percentiles: {
        field: 'cost.compute_ms',
        percents: [50, 90, 95, 99]
      }
    }
  }
);
```

##### `getTimeline(runId: string, interval: string = '1h'): Promise<EventSearchResult>`

Gets event timeline histogram for a run.

**Intervals:** '1m', '5m', '15m', '1h', '1d'

**Returns:** Aggregations with timeline buckets and action breakdown

##### `getAgentActivity(runId?: string): Promise<EventSearchResult>`

Gets agent activity summary with action breakdown and costs.

##### `healthCheck(): Promise<{ healthy: boolean; cluster?: string; version?: string }>`

Checks OpenSearch cluster health.

### Performance Optimization

- **Bulk Indexing:** Batches 100 events per request
- **Async Refresh:** Doesn't wait for index refresh (eventual consistency)
- **Daily Indices:** Optimizes time-range queries
- **Field Mapping:** Keyword fields for exact matching, text for full-text search

### Monitoring

```typescript
// Check health
const health = await opensearchEventIndexer.healthCheck();
console.log('OpenSearch healthy:', health.healthy);

// Monitor bulk performance
logger.info('Events bulk indexed', {
  metadata: {
    count: events.length,
    took_ms: took
  }
});
```

---

## HTTP Client

**File:** `/src/services/http-client.ts`
**Purpose:** HTTP client with proper headers, timeouts, and user agent for web scraping

### Features

- Configurable timeouts and retry logic
- Custom user agent for bot identification
- Request/response logging
- Redirect following (max 5 redirects)
- Support for GET, POST, HEAD methods
- Proper browser-like headers

### Architecture

Built on Axios with custom interceptors:

```
Request → Interceptor (Logging) → Axios → Response Interceptor → Result
            ↓                                      ↓
         Log Request                          Log Response/Error
```

### API Reference

#### Class: `HttpClient`

##### `fetch(url: string, options?: FetchOptions): Promise<FetchResponse>`

Fetches a URL with full response details.

**Options:**
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

**Example:**
```typescript
const response = await httpClient.fetch('https://example.com', {
  method: 'GET',
  timeout: 10000,
  headers: {
    'Accept-Language': 'en-US'
  }
});

console.log(`Fetched ${response.contentLength} bytes in ${response.duration_ms}ms`);
```

##### `get(url: string, headers?: Record<string, string>): Promise<FetchResponse>`

Convenient GET request wrapper.

##### `head(url: string, headers?: Record<string, string>): Promise<FetchResponse>`

HEAD request to check content without downloading body.

**Use Cases:**
- Check if URL is accessible
- Get content-type and size
- Check for redirects

##### `post(url: string, body: any, headers?: Record<string, string>): Promise<FetchResponse>`

POST request with body.

##### `isAccessible(url: string): Promise<boolean>`

Quick check if URL returns 2xx or 3xx status.

### Default Headers

```
User-Agent: DeepResearchBot/1.0 (+https://example.com/bot)
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Cache-Control: no-cache
Pragma: no-cache
```

### Configuration

Set via environment variables:
- `FETCH_USER_AGENT` - Custom user agent string
- `FETCH_TIMEOUT_MS` - Request timeout (default: 30000)

### Error Handling

- Network errors: Throws with error message
- Timeout: Throws timeout error after configured ms
- 4xx errors: Returns response (doesn't throw)
- 5xx errors: Throws server error

---

## Rate Limiter

**File:** `/src/services/rate-limiter.ts`
**Purpose:** Per-domain rate limiting with configurable limits and request queuing

### Features

- Per-domain rate tracking
- Configurable requests per second
- Sliding window algorithm
- robots.txt crawl-delay support
- Request queuing when limits reached
- Statistics for monitoring

### Architecture

```
Request → getDomain(url) → Check Limit → Wait if needed → Record Request
                              │              │
                              │              └─► Sliding Window (1 second)
                              └─► Domain State:
                                   • requestTimestamps[]
                                   • limit (req/sec)
                                   • lastRequest
```

### API Reference

#### Class: `RateLimiter`

##### `constructor(defaultLimit?: number)`

Creates rate limiter with default limit.

**Default:** 1 request/second (from config)

##### `setDomainLimit(url: string, requestsPerSecond: number): void`

Sets custom rate limit for a specific domain.

**Example:**
```typescript
// Allow 5 requests/second to example.com
rateLimiter.setDomainLimit('https://example.com', 5);
```

##### `canMakeRequest(url: string): boolean`

Checks if request can be made immediately.

**Returns:** `true` if under limit, `false` if rate limited

##### `recordRequest(url: string): void`

Records a request timestamp for rate tracking.

**Call After:** Successful request completion

##### `waitForSlot(url: string): Promise<void>`

Waits until a request slot is available.

**Behavior:** Blocks until rate limit allows the request

**Example:**
```typescript
// Wait for rate limit, then make request
await rateLimiter.waitForSlot('https://example.com/page');
const response = await httpClient.get('https://example.com/page');
rateLimiter.recordRequest('https://example.com/page');
```

##### `acquire(url: string): Promise<void>`

Combines `waitForSlot()` and `recordRequest()`.

**Recommended:** Use this for simplicity

**Example:**
```typescript
await rateLimiter.acquire('https://example.com/page');
const response = await httpClient.get('https://example.com/page');
```

##### `applyRobotsCrawlDelay(url: string, crawlDelaySeconds: number): void`

Applies crawl delay from robots.txt.

**Conversion:** `requestsPerSecond = 1 / crawlDelaySeconds`

**Example:**
```typescript
// robots.txt says: Crawl-delay: 2
rateLimiter.applyRobotsCrawlDelay('https://example.com', 2);
// Now limited to 0.5 requests/second
```

##### `getStats(url: string): DomainStats`

Gets current stats for a domain.

**Returns:**
```typescript
{
  domain: string;
  limit: number;
  current_requests: number;  // In current 1s window
  last_request_ms_ago: number;
}
```

##### `getAllStats(): DomainStats[]`

Gets stats for all tracked domains.

##### `reset(url?: string): void`

Resets rate limit state.

**Parameters:**
- `url` - Reset specific domain, or all if omitted

### Algorithm: Sliding Window

Tracks timestamps of requests in last 1 second:

```
Time:    [-------- 1 second window --------]
         |  |     |  |                     | ← Now
Requests: 1  2     3  4                     5

Limit: 5 req/sec
Current: 4 requests in window
Can make request: Yes (4 < 5)
```

Old timestamps are automatically cleaned on each check.

### Integration with Robots Parser

```typescript
import { rateLimiter } from './services/rate-limiter';
import { robotsParser } from './services/robots-parser';

// Check robots.txt and apply crawl delay
const crawlDelay = await robotsParser.getCrawlDelay(url);
if (crawlDelay) {
  rateLimiter.applyRobotsCrawlDelay(url, crawlDelay);
}

// Then use rate limiter
await rateLimiter.acquire(url);
const response = await httpClient.get(url);
```

---

## Robots Parser

**File:** `/src/services/robots-parser.ts`
**Purpose:** robots.txt parsing and compliance checking

### Features

- Fetch and parse robots.txt files
- URL allowance checking per user-agent
- Crawl-delay extraction
- Sitemap discovery
- Per-domain caching (24 hour TTL)
- Pattern matching with wildcards

### Architecture

```
URL → getRobotsTxtUrl() → Fetch (with cache) → Parse → Check Rules
                              ↓
                         Cache (24h TTL)
```

### API Reference

#### Class: `RobotsParser`

##### `fetchAndParse(url: string): Promise<RobotsTxt>`

Fetches and parses robots.txt for a domain.

**Caching:** 24 hours per domain

**Fallback:** If fetch fails or robots.txt missing, allows all requests

**Returns:**
```typescript
interface RobotsTxt {
  rules: RobotRule[];
  sitemaps: string[];
  parsed_at: string;
  url: string;
}
```

##### `isAllowed(url: string, userAgent: string = 'DeepResearchBot'): Promise<boolean>`

Checks if URL is allowed to be crawled.

**Parameters:**
- `url` - Full URL to check
- `userAgent` - Bot user agent (default: 'DeepResearchBot')

**Returns:** `true` if allowed, `false` if disallowed

**Matching Rules:**
1. Exact user-agent match
2. Wildcard (`*`) match
3. Partial match (user-agent contains)

**Priority:**
1. Allow rules (most specific)
2. Disallow rules
3. Default: Allow if no matching rules

**Example:**
```typescript
const allowed = await robotsParser.isAllowed('https://example.com/page', 'DeepResearchBot');

if (allowed) {
  // Proceed with fetch
  const response = await httpClient.get(url);
} else {
  console.log('Disallowed by robots.txt');
}
```

##### `getCrawlDelay(url: string, userAgent: string = 'DeepResearchBot'): Promise<number | null>`

Gets crawl delay in seconds for a domain.

**Returns:** Delay in seconds, or `null` if not specified

**Example:**
```typescript
const delay = await robotsParser.getCrawlDelay('https://example.com');
if (delay) {
  console.log(`Wait ${delay} seconds between requests`);
  rateLimiter.applyRobotsCrawlDelay(url, delay);
}
```

##### `getSitemaps(url: string): Promise<string[]>`

Gets sitemap URLs from robots.txt.

**Returns:** Array of sitemap URLs

##### `parse(content: string, url: string): RobotsTxt`

Parses robots.txt content.

**Format Support:**
- `User-agent: *`
- `Allow: /path`
- `Disallow: /path`
- `Crawl-delay: seconds`
- `Sitemap: url`

**Example robots.txt:**
```
User-agent: *
Disallow: /admin
Crawl-delay: 1

User-agent: DeepResearchBot
Allow: /api
Crawl-delay: 0.5

Sitemap: https://example.com/sitemap.xml
```

##### `clearCache(url?: string): void`

Clears cached robots.txt.

**Parameters:**
- `url` - Clear specific domain, or all if omitted

### Pattern Matching

Supports wildcards in robots.txt paths:

```
Disallow: /*.pdf        # Blocks all PDF files
Disallow: /tmp*         # Blocks /tmp, /temp, /temporary, etc.
Allow: /public/*        # Allows everything under /public/
```

**Conversion to Regex:**
- `*` → `.*` (matches anything)
- Other chars escaped for literal matching
- Anchored to start of path (`^`)

### Best Practices

```typescript
// 1. Check robots.txt before fetching
const allowed = await robotsParser.isAllowed(url);
if (!allowed) {
  throw new Error('Disallowed by robots.txt');
}

// 2. Apply crawl delay
const delay = await robotsParser.getCrawlDelay(url);
if (delay) {
  rateLimiter.applyRobotsCrawlDelay(url, delay);
}

// 3. Rate limit the request
await rateLimiter.acquire(url);

// 4. Now fetch
const response = await httpClient.get(url);
```

---

## Snapshot Generator

**File:** `/src/services/snapshot-generator.ts`
**Purpose:** Event replay and state reconstruction at specific points in time

### Features

- Generate snapshots at any point in time or step
- Replay events to reconstruct state
- Snapshot diffing between two points
- State summary building
- Event sourcing pattern for time-travel debugging

### Architecture

```
Query (run_id + timestamp/step_id)
  ↓
OpenSearch: Fetch all events up to point
  ↓
Filter & Sort by step_id
  ↓
Build Snapshot:
  • Events array
  • Metadata (agents, actions, costs)
  • Timeline
```

### API Reference

#### Class: `SnapshotGenerator`

##### `generateSnapshot(query: SnapshotQuery): Promise<EventSnapshot>`

Generates a snapshot at a specific point.

**Query:**
```typescript
interface SnapshotQuery {
  run_id: string;
  timestamp?: string;  // ISO timestamp
  step_id?: number;    // Step number
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

**Example:**
```typescript
// Snapshot at step 50
const snapshot = await snapshotGenerator.generateSnapshot({
  run_id: 'run-123',
  step_id: 50
});

console.log(`Snapshot has ${snapshot.events.length} events`);
console.log(`Total cost: $${snapshot.metadata.total_cost_usd}`);
console.log(`Agents involved: ${snapshot.metadata.agents.join(', ')}`);
```

##### `getLatestSnapshot(runId: string): Promise<EventSnapshot>`

Gets the most recent snapshot for a run.

##### `getSnapshotAtStep(runId: string, stepId: number): Promise<EventSnapshot>`

Gets snapshot at a specific step number.

##### `getSnapshotDiff(runId: string, fromStepId: number, toStepId: number): Promise<SnapshotDiff>`

Gets the diff between two snapshots.

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

**Example:**
```typescript
// What happened between step 10 and 20?
const diff = await snapshotGenerator.getSnapshotDiff('run-123', 10, 20);

console.log(`${diff.metadata.event_count} events occurred`);
console.log(`Cost delta: $${diff.metadata.cost_delta_usd}`);
diff.added_events.forEach(e => {
  console.log(`Step ${e.step_id}: ${e.agent}.${e.action}`);
});
```

##### `replayToSnapshot(snapshotId: string, stateReducer: Function, initialState: any): Promise<{ state: any; events: ResearchEvent[] }>`

Replays events through a reducer to reconstruct state.

**Parameters:**
- `snapshotId` - Snapshot identifier
- `stateReducer` - Function that applies events to state
- `initialState` - Starting state

**Example:**
```typescript
// Reconstruct frontier state
const { state, events } = await snapshotGenerator.replayToSnapshot(
  'run-123-1234567890',
  (state, event) => {
    if (event.action === 'orchestrator.frontier.update') {
      return {
        ...state,
        frontier: event.output.added.map(item => item.url)
      };
    }
    return state;
  },
  { frontier: [] }
);

console.log('Reconstructed frontier:', state.frontier);
```

##### `buildStateSummary(events: ResearchEvent[]): StateSummary`

Builds a summary from events.

**Returns:**
```typescript
{
  agents: Record<string, number>;        // Agent event counts
  actions: Record<string, number>;       // Action counts
  timeline: Array<{                      // Chronological timeline
    step: number;
    action: string;
    agent: string;
    timestamp: string;
  }>;
  costs: {
    total: number;
    by_agent: Record<string, number>;
  };
}
```

**Example:**
```typescript
const snapshot = await snapshotGenerator.getLatestSnapshot('run-123');
const summary = snapshotGenerator.buildStateSummary(snapshot.events);

console.log('Agent activity:', summary.agents);
// { orchestrator: 15, fetch: 42, extract: 38, index: 40 }

console.log('Top actions:', summary.actions);
// { 'fetch.complete': 42, 'extract.complete': 38, ... }

console.log('Total cost:', summary.costs.total);
console.log('Cost by agent:', summary.costs.by_agent);
```

### Use Cases

**1. Time-Travel Debugging**
```typescript
// What was the state at step 100?
const snapshot = await snapshotGenerator.getSnapshotAtStep('run-123', 100);
```

**2. Cost Analysis**
```typescript
// How much did steps 50-100 cost?
const diff = await snapshotGenerator.getSnapshotDiff('run-123', 50, 100);
console.log(`Cost: $${diff.metadata.cost_delta_usd}`);
```

**3. State Reconstruction**
```typescript
// Rebuild graph state from events
const { state } = await snapshotGenerator.replayToSnapshot(
  snapshotId,
  graphReducer,
  { nodes: [], edges: [] }
);
```

**4. Progress Monitoring**
```typescript
// Get latest snapshot for progress bar
const latest = await snapshotGenerator.getLatestSnapshot('run-123');
const summary = snapshotGenerator.buildStateSummary(latest.events);
console.log(`Progress: ${latest.step_id} steps, ${summary.agents.orchestrator} orchestrator events`);
```

### Performance Notes

- Snapshots query OpenSearch for all events up to the point
- Large runs (>10k events) may take longer to snapshot
- Consider caching frequently accessed snapshots
- Diffs are more efficient than full snapshots for delta analysis

---

## Related Documentation

- [API Endpoints](./api.md) - REST API routes that use these services
- [Middleware](./middleware.md) - Error handling and request processing
- [Utilities](./utils.md) - Logger and event producers
- [Configuration](../src/config/index.ts) - Service configuration options
