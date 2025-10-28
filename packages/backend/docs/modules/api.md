# REST API Documentation

Complete documentation for all REST API endpoints in the `@deep-research/backend` package.

## Base URL

```
http://localhost:3000
```

## API Overview

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Health | `/health` | Service health checks |
| Events | `/events/*` | Event streaming and querying |
| Advanced Events | `/events/search`, `/events/aggregate`, `/events/snapshot`, `/events/analytics/*` | Advanced event queries and analytics |

---

## Health Endpoints

### GET /health

Returns service health status and dependency availability.

**Request:**
```http
GET /health HTTP/1.1
Host: localhost:3000
```

**Response:** `200 OK` (if healthy) or `503 Service Unavailable` (if degraded)

```json
{
  "status": "healthy",
  "timestamp": "2025-10-28T10:30:00.000Z",
  "uptime": 3600.5,
  "version": "0.1.0",
  "dependencies": {
    "neo4j": {
      "status": "up",
      "latency_ms": 5
    },
    "opensearch": {
      "status": "up",
      "latency_ms": 10
    },
    "redis": {
      "status": "up",
      "latency_ms": 2
    }
  }
}
```

**Status Values:**
- `healthy` - All systems operational
- `degraded` - Some dependencies down but service functional
- `unhealthy` - Critical dependencies down

**Use Cases:**
- Load balancer health checks
- Monitoring and alerting
- Dependency status verification

---

## Event Endpoints

### GET /events/stream

Server-Sent Events (SSE) stream for real-time event delivery.

**Request:**
```http
GET /events/stream?run_id=run-123 HTTP/1.1
Host: localhost:3000
Accept: text/event-stream
```

**Query Parameters:**
- `run_id` (optional) - Filter events by run ID

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**SSE Events:**

**Heartbeat Event** (every 30s):
```
event: heartbeat
data: {"message":"alive"}

```

**Research Event:**
```
event: research_event
id: run-123-1
data: {"ts":"2025-10-28T10:30:00.000Z","run_id":"run-123","step_id":1,"agent":"orchestrator","action":"orchestrator.start","input":{"query":"AI research"}}

```

**Client Example (JavaScript):**
```javascript
const eventSource = new EventSource('/events/stream?run_id=run-123');

eventSource.addEventListener('research_event', (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.action, data);
});

eventSource.addEventListener('heartbeat', (event) => {
  console.log('Connection alive');
});

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

**Client Example (curl):**
```bash
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3000/events/stream?run_id=run-123"
```

**Connection Management:**
- Server sends heartbeat every 30 seconds
- Client should reconnect on connection drop
- Filter by `run_id` to receive only relevant events

---

### GET /events

Query event history with filtering.

**Request:**
```http
GET /events?run_id=run-123&limit=50 HTTP/1.1
Host: localhost:3000
```

**Query Parameters:**
- `run_id` (optional) - Filter by run ID
- `limit` (optional) - Max events to return (default: 100)

**Response:** `200 OK`

```json
{
  "events": [
    {
      "ts": "2025-10-28T10:30:00.000Z",
      "run_id": "run-123",
      "step_id": 1,
      "agent": "orchestrator",
      "action": "orchestrator.start",
      "input": {
        "query": "AI research"
      }
    },
    {
      "ts": "2025-10-28T10:30:05.000Z",
      "run_id": "run-123",
      "step_id": 2,
      "agent": "fetch",
      "action": "fetch.start",
      "input": {
        "url": "https://example.com"
      }
    }
  ],
  "count": 2,
  "filters": {
    "run_id": "run-123",
    "limit": 50
  }
}
```

**Notes:**
- Returns in-memory history (last 1000 events)
- For full history, use `/events/search` (OpenSearch)
- Events ordered by step_id (chronological)

---

### POST /events

Publish a new event to the event bus.

**Request:**
```http
POST /events HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "ts": "2025-10-28T10:30:00.000Z",
  "run_id": "run-123",
  "step_id": 1,
  "agent": "orchestrator",
  "action": "orchestrator.start",
  "input": {
    "query": "AI research"
  }
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "event": {
    "run_id": "run-123",
    "step_id": 1,
    "action": "orchestrator.start"
  }
}
```

**Validation:**
- Event must conform to ResearchEvent schema
- Required fields: `ts`, `run_id`, `step_id`, `agent`, `action`

**Side Effects:**
- Event broadcast to all SSE clients
- Event sent to subscribers
- Event indexed in OpenSearch (async)
- Event added to in-memory history

---

### GET /events/stats

Get event bus statistics.

**Request:**
```http
GET /events/stats HTTP/1.1
Host: localhost:3000
```

**Response:** `200 OK`

```json
{
  "subscribers": 3,
  "sseClients": 5,
  "historySize": 234
}
```

---

## Advanced Event Endpoints

### GET /events/search

Advanced event search with filtering and pagination.

**Request:**
```http
GET /events/search?run_id=run-123&agent=fetch&from=2025-10-28T00:00:00Z&to=2025-10-28T23:59:59Z&limit=100&offset=0 HTTP/1.1
Host: localhost:3000
```

**Query Parameters:**
- `run_id` (optional) - Filter by run ID
- `agent` (optional) - Filter by agent type (`orchestrator`, `fetch`, `extract`, etc.)
- `action` (optional) - Filter by action type
- `from` (optional) - Start timestamp (ISO 8601)
- `to` (optional) - End timestamp (ISO 8601)
- `limit` (optional) - Max results (default: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "ts": "2025-10-28T10:30:00.000Z",
        "run_id": "run-123",
        "step_id": 5,
        "agent": "fetch",
        "action": "fetch.complete",
        "input": {
          "url": "https://example.com"
        },
        "output": {
          "status_code": 200,
          "content_length": 15234
        },
        "cost": {
          "usd": 0,
          "compute_ms": 523
        }
      }
    ],
    "total": 42,
    "took_ms": 15
  },
  "query": {
    "run_id": "run-123",
    "agent": "fetch",
    "limit": 100,
    "offset": 0
  }
}
```

**Performance:**
- Target latency: < 500ms
- Uses OpenSearch for fast queries
- Supports pagination for large result sets

**Example Queries:**

**All events for a run:**
```bash
curl "http://localhost:3000/events/search?run_id=run-123"
```

**Fetch events in time range:**
```bash
curl "http://localhost:3000/events/search?agent=fetch&from=2025-10-28T00:00:00Z&to=2025-10-28T12:00:00Z"
```

**Specific action type:**
```bash
curl "http://localhost:3000/events/search?action=fetch.error&limit=10"
```

---

### GET /events/aggregate

Event aggregations for analytics.

**Request:**
```http
GET /events/aggregate?type=timeline&run_id=run-123&interval=1h HTTP/1.1
Host: localhost:3000
```

**Query Parameters:**
- `type` (required) - Aggregation type: `timeline`, `agent_activity`, or `custom`
- `run_id` (optional) - Filter by run ID
- `interval` (optional, for timeline) - Histogram interval (`1m`, `5m`, `1h`, `1d`)

**Aggregation Types:**

#### 1. Timeline

Time-series histogram of events with action breakdown.

**Request:**
```http
GET /events/aggregate?type=timeline&run_id=run-123&interval=1h
```

**Response:**
```json
{
  "success": true,
  "data": {
    "aggregations": {
      "timeline": {
        "buckets": [
          {
            "key": "2025-10-28T10:00:00.000Z",
            "doc_count": 156,
            "by_action": {
              "buckets": [
                {"key": "fetch.complete", "doc_count": 42},
                {"key": "extract.complete", "doc_count": 38},
                {"key": "index.write", "doc_count": 40}
              ]
            }
          },
          {
            "key": "2025-10-28T11:00:00.000Z",
            "doc_count": 203,
            "by_action": {
              "buckets": [
                {"key": "fetch.complete", "doc_count": 58},
                {"key": "extract.complete", "doc_count": 52}
              ]
            }
          }
        ]
      },
      "total_cost": {
        "value": 2.45
      },
      "total_tokens": {
        "value": 125000
      }
    },
    "total": 359,
    "took_ms": 35
  }
}
```

#### 2. Agent Activity

Agent activity summary with action breakdown and costs.

**Request:**
```http
GET /events/aggregate?type=agent_activity&run_id=run-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "aggregations": {
      "by_agent": {
        "buckets": [
          {
            "key": "fetch",
            "doc_count": 142,
            "by_action": {
              "buckets": [
                {"key": "fetch.complete", "doc_count": 120},
                {"key": "fetch.error", "doc_count": 22}
              ]
            },
            "avg_cost": {
              "value": 0.002
            }
          },
          {
            "key": "orchestrator",
            "doc_count": 45,
            "by_action": {
              "buckets": [
                {"key": "orchestrator.plan", "doc_count": 30},
                {"key": "orchestrator.command", "doc_count": 15}
              ]
            },
            "avg_cost": {
              "value": 0.015
            }
          }
        ]
      }
    },
    "total": 187,
    "took_ms": 28
  }
}
```

#### 3. Custom Aggregations

Provide custom OpenSearch aggregations.

**Request:**
```http
POST /events/aggregate?type=custom&run_id=run-123 HTTP/1.1
Content-Type: application/json

{
  "aggregations": {
    "avg_compute": {
      "avg": {
        "field": "cost.compute_ms"
      }
    },
    "max_compute": {
      "max": {
        "field": "cost.compute_ms"
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "aggregations": {
      "avg_compute": {
        "value": 523.5
      },
      "max_compute": {
        "value": 2340
      }
    },
    "total": 187,
    "took_ms": 18
  }
}
```

---

### GET /events/snapshot

Generate snapshot at a specific point in time.

**Request:**
```http
GET /events/snapshot?run_id=run-123&step_id=50 HTTP/1.1
Host: localhost:3000
```

**Query Parameters:**
- `run_id` (required) - Run identifier
- `timestamp` (optional) - ISO timestamp to snapshot at or before
- `step_id` (optional) - Step number to snapshot at or before

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "snapshot_id": "run-123-1698500000000",
    "run_id": "run-123",
    "timestamp": "2025-10-28T10:30:00.000Z",
    "step_id": 50,
    "events": [
      {
        "ts": "2025-10-28T10:00:00.000Z",
        "run_id": "run-123",
        "step_id": 1,
        "agent": "orchestrator",
        "action": "orchestrator.start"
      }
    ],
    "metadata": {
      "event_count": 50,
      "agents": ["orchestrator", "fetch", "extract", "index"],
      "actions": ["orchestrator.start", "fetch.complete", "extract.complete"],
      "total_cost_usd": 0.85,
      "duration_ms": 125
    }
  }
}
```

**Use Cases:**
- Time-travel debugging
- State reconstruction
- Progress monitoring
- Cost analysis at specific points

---

### GET /events/snapshot/latest

Get the most recent snapshot for a run.

**Request:**
```http
GET /events/snapshot/latest?run_id=run-123 HTTP/1.1
Host: localhost:3000
```

**Query Parameters:**
- `run_id` (required) - Run identifier

**Response:** Same as `/events/snapshot`

---

### GET /events/snapshot/diff

Get diff between two snapshots.

**Request:**
```http
GET /events/snapshot/diff?run_id=run-123&from_step=10&to_step=50 HTTP/1.1
Host: localhost:3000
```

**Query Parameters:**
- `run_id` (required) - Run identifier
- `from_step` (required) - Starting step number
- `to_step` (required) - Ending step number

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "from_step": 10,
    "to_step": 50,
    "added_events": [
      {
        "ts": "2025-10-28T10:05:00.000Z",
        "run_id": "run-123",
        "step_id": 11,
        "agent": "fetch",
        "action": "fetch.complete"
      }
    ],
    "metadata": {
      "event_count": 40,
      "cost_delta_usd": 0.42
    }
  }
}
```

**Use Cases:**
- Analyze what happened between two points
- Calculate cost for a step range
- Debug specific workflow segments

---

### GET /events/analytics/costs

Cost analytics across runs or agents.

**Request:**
```http
GET /events/analytics/costs?run_id=run-123&from=2025-10-28T00:00:00Z&to=2025-10-28T23:59:59Z HTTP/1.1
Host: localhost:3000
```

**Query Parameters:**
- `run_id` (optional) - Filter by run ID
- `from` (optional) - Start timestamp
- `to` (optional) - End timestamp

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "aggregations": {
      "total_cost": {
        "value": 5.23
      },
      "cost_by_agent": {
        "buckets": [
          {
            "key": "orchestrator",
            "total_cost": {"value": 3.15},
            "total_tokens": {"value": 450000}
          },
          {
            "key": "fetch",
            "total_cost": {"value": 0.08},
            "total_tokens": {"value": 0}
          },
          {
            "key": "synthesis",
            "total_cost": {"value": 2.00},
            "total_tokens": {"value": 280000}
          }
        ]
      },
      "cost_by_action": {
        "buckets": [
          {
            "key": "orchestrator.plan",
            "total_cost": {"value": 2.50}
          },
          {
            "key": "synthesis.complete",
            "total_cost": {"value": 2.00}
          },
          {
            "key": "orchestrator.start",
            "total_cost": {"value": 0.65}
          }
        ]
      }
    },
    "total": 187,
    "took_ms": 42
  },
  "query": {
    "run_id": "run-123",
    "from": "2025-10-28T00:00:00Z",
    "to": "2025-10-28T23:59:59Z"
  }
}
```

**Use Cases:**
- Budget tracking
- Cost optimization
- Agent cost comparison
- Identify expensive operations

---

### GET /events/analytics/performance

Performance analytics (durations, latencies).

**Request:**
```http
GET /events/analytics/performance?run_id=run-123&agent=fetch HTTP/1.1
Host: localhost:3000
```

**Query Parameters:**
- `run_id` (optional) - Filter by run ID
- `agent` (optional) - Filter by agent type

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "aggregations": {
      "avg_compute": {
        "value": 523.5
      },
      "max_compute": {
        "value": 2340
      },
      "compute_percentiles": {
        "values": {
          "50.0": 450,
          "90.0": 1200,
          "95.0": 1650,
          "99.0": 2200
        }
      },
      "by_action": {
        "buckets": [
          {
            "key": "fetch.complete",
            "avg_duration": {"value": 520}
          },
          {
            "key": "fetch.start",
            "avg_duration": {"value": 5}
          }
        ]
      }
    },
    "total": 142,
    "took_ms": 38
  }
}
```

**Metrics:**
- Average compute time
- Max compute time
- Percentiles (p50, p90, p95, p99)
- Duration by action type

**Use Cases:**
- Performance optimization
- Identify slow operations
- SLA monitoring
- Capacity planning

---

### GET /events/analytics/errors

Error analytics and trends.

**Request:**
```http
GET /events/analytics/errors?run_id=run-123&from=2025-10-28T00:00:00Z&to=2025-10-28T23:59:59Z HTTP/1.1
Host: localhost:3000
```

**Query Parameters:**
- `run_id` (optional) - Filter by run ID
- `from` (optional) - Start timestamp
- `to` (optional) - End timestamp

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "aggregations": {
      "errors_by_agent": {
        "buckets": [
          {"key": "fetch", "doc_count": 22},
          {"key": "extract", "doc_count": 5},
          {"key": "index", "doc_count": 2}
        ]
      },
      "errors_by_code": {
        "buckets": [
          {"key": "TIMEOUT", "doc_count": 15},
          {"key": "NETWORK_ERROR", "doc_count": 8},
          {"key": "PARSE_ERROR", "doc_count": 6}
        ]
      },
      "error_timeline": {
        "buckets": [
          {
            "key": "2025-10-28T10:00:00.000Z",
            "doc_count": 5
          },
          {
            "key": "2025-10-28T11:00:00.000Z",
            "doc_count": 12
          }
        ]
      }
    },
    "total": 29,
    "took_ms": 25
  }
}
```

**Use Cases:**
- Error rate monitoring
- Root cause analysis
- Error pattern detection
- Reliability metrics

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request

Invalid request parameters.

```json
{
  "error": {
    "name": "BadRequest",
    "message": "run_id is required",
    "statusCode": 400,
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

### 404 Not Found

Route not found.

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

### 500 Internal Server Error

Unexpected server error.

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

**Note:** Error details are hidden in production for security.

---

## Rate Limiting

Currently no API rate limiting is enforced. Consider implementing rate limiting for production deployments.

## Authentication

Currently no authentication is required. Consider implementing JWT or API key authentication for production.

## CORS

CORS is configured to allow requests from:
- Development: `http://localhost:5173` (Vite dev server)
- Production: Configured via `CORS_ORIGIN` environment variable

## Related Documentation

- [Services](./services.md) - Backend services that power these endpoints
- [Middleware](./middleware.md) - Error handling and request processing
- [Configuration](../../src/config/index.ts) - API configuration options
