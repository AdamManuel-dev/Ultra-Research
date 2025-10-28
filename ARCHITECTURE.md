# Deep Research Cockpit - Architecture

> **Last Updated**: 2025-10-28
> **Version**: 0.1.0 (Pre-Alpha)
> **Status**: Foundation Phase - Core components implemented

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [System Components](#system-components)
- [Data Flow Architecture](#data-flow-architecture)
- [Technology Stack](#technology-stack)
- [Package Architecture](#package-architecture)
- [Database Schemas](#database-schemas)
- [API Architecture](#api-architecture)
- [Event-Driven Architecture](#event-driven-architecture)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Performance Characteristics](#performance-characteristics)
- [Design Patterns](#design-patterns)

---

## System Overview

Deep Research Cockpit is a distributed, event-driven system for steerable AI research exploration. The architecture emphasizes:

- **Real-time streaming** for live control and feedback
- **Event sourcing** for complete replay and audit trails
- **Hybrid retrieval** combining text, vector, and graph search
- **Cost-aware execution** with intelligent JS rendering escalation
- **Horizontal scalability** through stateless services

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend UI Layer                         │
│  ┌────────────────┐              ┌─────────────────────┐         │
│  │  Run Mode      │              │   Review Mode       │         │
│  │  (Pilot View)  │              │   (Black Box)       │         │
│  └────────────────┘              └─────────────────────┘         │
└────────────────────┬──────────────────────────┬──────────────────┘
                     │                          │
                     │   HTTP/REST + SSE        │
                     │                          │
┌────────────────────▼──────────────────────────▼──────────────────┐
│                      Backend API Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  Health API  │  │  Event API   │  │  Orchestrator API  │     │
│  │  /health     │  │  /events     │  │  /runs, /controls  │     │
│  └──────────────┘  └──────────────┘  └────────────────────┘     │
│                                                                    │
│  Middleware: CORS, Helmet, Auth, Error Handling, Logging         │
└────────────────────┬──────────────────────────┬──────────────────┘
                     │                          │
                     │   Event Bus (Pub/Sub)    │
                     │                          │
┌────────────────────▼──────────────────────────▼──────────────────┐
│                     Service Layer                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │  Fetch      │  │  Indexer     │  │  Graph Memory       │     │
│  │  Pipeline   │  │  Service     │  │  Service            │     │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────────────┘     │
│         │                │                  │                     │
│         │                │                  │                     │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌──────▼──────────────┐     │
│  │  HTTP       │  │  OpenSearch  │  │  Neo4j Driver       │     │
│  │  Client     │  │  Client      │  │  GraphRAG Engine    │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
                     │                          │
                     │   Storage Layer          │
                     │                          │
┌────────────────────▼──────────────────────────▼──────────────────┐
│                   Persistent Storage                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │  Neo4j      │  │  OpenSearch  │  │  MinIO (S3)         │     │
│  │  (Graph DB) │  │  (Search)    │  │  (Object Store)     │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
│                                                                    │
│  ┌─────────────┐                                                  │
│  │  Redis      │  (Caching & Rate Limiting)                      │
│  └─────────────┘                                                  │
└───────────────────────────────────────────────────────────────────┘
```

---

## Architecture Principles

### 1. Event Sourcing & Observability

**Every action emits an immutable event** capturing:
- Inputs, outputs, and decision rationale
- Timing, cost (tokens, time, money)
- Correlation IDs (run_id, step_id)
- Artifacts created

**Benefits**:
- Complete audit trail
- Deterministic replay
- Real-time streaming
- Post-hoc analysis

### 2. Cost-Aware Execution

**Optimize for minimal cost** while maintaining quality:
- Non-JS fetch by default (600ms, minimal cost)
- Smart router detects when JS rendering needed
- JS rendering escalation only when necessary (3s, higher cost)
- Budget enforcement (tokens, time, domains, JS renders)

### 3. Hybrid Retrieval

**Combine multiple search strategies**:
- **BM25**: Keyword matching for precise queries
- **Dense Vectors**: Semantic similarity for conceptual search
- **Neural Sparse**: Entity-aware keyword expansion
- **Graph Guided**: Follow relationships in knowledge graph
- **RRF**: Reciprocal Rank Fusion to blend signals

### 4. Core-First Prioritization

**Emphasize authoritative sources**:
- L0/L1 sources (papers, specs, repos) prioritized
- Metadata enrichment from scholarly APIs
- Reading queue enforces L0→L4 order
- Transparent why-ranked explanations

### 5. Horizontal Scalability

**Stateless services enable scaling**:
- Each service can run multiple instances
- Event bus handles distribution
- Storage layer handles coordination
- No in-memory shared state

---

## System Components

### Frontend Layer

#### Run Mode (Pilot View)
Real-time research interface with live controls:
- **Strategy Compass**: Adjustable knobs (Depth/Breadth, Core-First, Verify)
- **Frontier Map**: Interactive concept graph with overlays
- **Evidence Queue**: L0→L4 ranked sources with why-ranked cards
- **Live Log**: Filterable event stream
- **Status Strip**: Operational metrics

**Technology**: React 18, Redux Toolkit, Material-UI, ReactFlow

#### Review Mode (Black Box Recorder)
Post-session analysis and replay:
- **Timeline Replay**: Scrub through session snapshots
- **Effectiveness Dashboard**: KPIs (TTFC, Authority Mix, Evidence Robustness)
- **Evidence Ledger**: Complete claim inventory
- **Learning Map**: Graph memory diff
- **A/B Comparison**: Side-by-side run comparison

**Technology**: React 18, Redux Toolkit, Recharts, Material-UI

### Backend API Layer

#### Express Application
RESTful API with middleware chain:
- **Security**: Helmet for HTTP headers, CORS for cross-origin
- **Logging**: Winston structured logging with correlation IDs
- **Error Handling**: Centralized error middleware
- **Validation**: Request validation using shared schemas

**Endpoints**:
- `GET /health` - Service health check
- `GET /events/stream` - SSE event streaming
- `GET /events` - Query events with filters
- `POST /events` - Publish events
- `GET /events/search` - Advanced OpenSearch queries
- `GET /events/aggregate` - Aggregations and analytics
- `GET /events/snapshot` - Snapshot retrieval

**Technology**: Express 4, TypeScript, Winston, Helmet, CORS

### Service Layer

#### Fetch Pipeline
Cost-aware content acquisition:

**Non-JS Path** (Default):
1. **HTTP Client**: axios with retry, timeout, custom headers
2. **Robots Parser**: Check robots.txt compliance
3. **Rate Limiter**: Per-domain rate limiting
4. **Trafilatura**: Content extraction
5. **Turndown**: HTML→Markdown normalization

**JS Rendering Path** (Escalation):
1. **Smart Router**: Detect SPA patterns, placeholder DOM
2. **Browserbase + Stagehand**: Browser automation
3. **Site Playbooks**: Structured extraction
4. **Session Management**: Multi-step workflows

**Caching**:
- HTTP cache (ETag-aware)
- HTML→Markdown reduction cache
- Metadata cache (scholarly APIs)

**Technology**: axios, Trafilatura (Python bridge), Turndown, Browserbase, Stagehand

#### Indexer Service
Hybrid OpenSearch indexing:

**Index Strategy**:
- **BM25**: Keyword-based full-text search
- **Dense Vectors**: Semantic embeddings (configurable model)
- **Neural Sparse**: Entity-aware sparse vectors
- **Metadata**: Source tier, publish date, citations, venue

**Performance**:
- Bulk indexing for throughput
- Index templates for consistency
- Time-series optimization
- Sub-500ms query latency target

**Technology**: OpenSearch 2.11, TypeScript client

#### Graph Memory Service
Knowledge graph storage and retrieval:

**Schema**:
```
Nodes:
  - Concept (name, description, embeddings)
  - Entity (name, type, metadata)
  - Claim (text, confidence, timestamp)
  - Source (url, tier, metadata)
  - Note (user annotations)

Edges:
  - SUPPORTED_BY (Claim → Source)
  - ABOUT (Source → Concept)
  - RELATED_TO (Concept ↔ Concept)
  - CONTRADICTS (Claim ↔ Claim)
  - CITES (Source → Source)
```

**Operations**:
- Upsert claims with automatic deduplication
- Community detection and summarization
- Origin path calculation (shortest path to L0 sources)
- Hybrid retrieval (graph + text + vector)

**Technology**: Neo4j 5.15, Cypher, APOC, Graph Data Science

#### Event Bus Service
Real-time event distribution:

**Pub/Sub Model**:
- Publishers: All services emit typed events
- Subscribers: Frontend SSE clients, event storage, analytics
- Backpressure handling: Client buffering and disconnection

**Features**:
- Sub-100ms latency for event delivery
- Connection lifecycle management
- Typed event validation
- Filtering by run_id, action, agent

**Technology**: TypeScript EventEmitter, SSE (Server-Sent Events)

#### Event Storage Service
Durable event persistence:

**Storage Strategy**:
- **Object Store (MinIO/S3)**: JSONL files partitioned by run_id and date
- **OpenSearch**: Indexed for fast queries and aggregations
- **Write-Ahead Log**: Buffered writes with periodic flush

**Queryable**:
- By run_id, time range, action, agent
- Full-text search on event content
- Aggregations (counts, timings, costs)

**Technology**: MinIO (S3-compatible), OpenSearch, TypeScript

#### Snapshot Generator Service
State reconstruction for replay:

**Snapshot Strategy**:
- Generate at key landmarks (first core source, contradictions, cost spikes)
- Store complete system state (frontier, graph, reading queue)
- Enable <2s replay load times
- Support A/B comparison

**Technology**: TypeScript, MinIO for storage

---

## Data Flow Architecture

### Research Session Flow

```
1. User starts new session
   ↓
2. Frontend sends query + controls → Backend API
   ↓
3. Orchestrator decomposes into task graph
   ↓
4. Task graph executed with frontier scoring
   ↓
5. Each task emits events → Event Bus
   ↓
6. Events streamed to Frontend (SSE)
   ├─ Events persisted to Object Store (JSONL)
   ├─ Events indexed in OpenSearch
   └─ Snapshots generated at landmarks
   ↓
7. Fetch Pipeline retrieves content
   ├─ Check cache (Redis)
   ├─ Check robots.txt compliance
   ├─ Rate limit check
   ├─ HTTP fetch (or JS render if needed)
   └─ HTML→Markdown normalization
   ↓
8. Content indexed in OpenSearch
   ├─ BM25 index
   ├─ Dense vector embeddings
   └─ Neural sparse vectors
   ↓
9. Claims extracted and stored in Graph
   ├─ Nodes: Concepts, Entities, Claims, Sources
   ├─ Edges: SUPPORTED_BY, ABOUT, RELATED_TO, CONTRADICTS
   └─ Community detection and summarization
   ↓
10. Retrieval uses Hybrid strategy
    ├─ Text search (BM25)
    ├─ Vector search (semantic similarity)
    └─ Graph-guided expansion
    ↓
11. Results ranked with multi-factor scoring
    ├─ Text relevance (BM25)
    ├─ Authority (tier, citations, venue)
    ├─ Core proximity (citation distance)
    ├─ Recency (publish date)
    └─ Independence (diversity)
    ↓
12. Reading queue built with L0→L4 order
    ↓
13. Frontend displays ranked sources with why-ranked cards
```

### Event Flow

```
Service Layer                Event Bus               Storage Layer
────────────                ─────────               ─────────────
[Orchestrator]
    │ emit
    └─────────────────────→ [Event Bus] ────────→ [Object Store]
                               │    │                (JSONL files)
                               │    │
[Fetch Service]                │    └──────────→ [OpenSearch]
    │ emit                     │                   (indexed events)
    └─────────────────────────→│
                               │
[Graph Service]                │
    │ emit                     │
    └─────────────────────────→│
                               │
                               │
                          [Frontend SSE]
                          (real-time stream)
```

---

## Technology Stack

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18 | UI component library |
| **State Management** | Redux Toolkit | Global state with RTK Query |
| **UI Library** | Material-UI v5 | Component design system |
| **Routing** | React Router v6 | Client-side routing |
| **Data Viz** | Recharts | Charts and dashboards |
| **Graph Viz** | ReactFlow | Interactive concept graph |
| **Build Tool** | Vite | Fast dev server and bundler |
| **Testing** | Vitest + Testing Library | Component testing |

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express 4 | Web framework |
| **Language** | TypeScript 5.3 | Type-safe development |
| **HTTP Client** | axios | HTTP requests with retry |
| **Validation** | Ajv + JSON Schema | Request validation |
| **Logging** | Winston | Structured logging |
| **Testing** | Jest + Supertest | Unit and integration tests |

### Storage & Databases

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Graph DB** | Neo4j 5.15 Community | Knowledge graph storage |
| **Search Engine** | OpenSearch 2.11 | Hybrid retrieval (BM25 + vector) |
| **Cache** | Redis 7 | Caching and rate limiting |
| **Object Store** | MinIO | S3-compatible event storage |

### External Services

| Service | Purpose |
|---------|---------|
| **Browserbase** | Browser automation for JS rendering |
| **Stagehand** | Structured web scraping |
| **Trafilatura** | Content extraction (non-JS) |
| **Crossref** | DOI lookup and metadata |
| **OpenAlex** | Scholarly metadata |
| **Semantic Scholar** | Citation context |
| **Unpaywall** | Open access links |

### DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Service isolation |
| **Orchestration** | Docker Compose | Local development |
| **Monorepo** | Lerna 8 | Package management |
| **Linting** | ESLint (Airbnb) | Code quality |
| **Formatting** | Prettier | Code formatting |
| **Git Hooks** | Husky | Pre-commit checks |

---

## Package Architecture

### Monorepo Structure

```
UltraResearch/
├── packages/
│   ├── backend/           # Express API and services
│   │   ├── src/
│   │   │   ├── config/    # Configuration loading
│   │   │   ├── middleware/# Express middleware
│   │   │   ├── routes/    # API endpoints
│   │   │   ├── services/  # Business logic services
│   │   │   ├── utils/     # Utilities (logger, event producers)
│   │   │   ├── app.ts     # Express app setup
│   │   │   └── index.ts   # Server entry point
│   │   └── package.json
│   │
│   ├── frontend/          # React UI
│   │   ├── src/
│   │   │   ├── components/# React components
│   │   │   ├── features/  # Redux slices
│   │   │   ├── pages/     # Route pages
│   │   │   ├── services/  # RTK Query APIs
│   │   │   └── App.tsx    # Root component
│   │   └── package.json
│   │
│   └── shared/            # Shared types and utilities
│       ├── src/
│       │   ├── types/     # TypeScript types and interfaces
│       │   │   ├── events.ts     # Event schema
│       │   │   ├── errors/       # Error classes
│       │   │   └── index.ts
│       │   └── validation/# Validation schemas and utilities
│       └── package.json
│
├── docs/                  # Documentation
├── docker-compose.yml     # Service orchestration
├── lerna.json            # Lerna configuration
├── package.json          # Root package
└── tsconfig.json         # TypeScript configuration
```

### Package Dependencies

```
@deep-research/frontend
    ├── @deep-research/shared (types, validation)
    └── External: react, redux-toolkit, mui, recharts, reactflow

@deep-research/backend
    ├── @deep-research/shared (types, validation, errors)
    └── External: express, neo4j-driver, @opensearch-project/opensearch
                  ioredis, axios, winston

@deep-research/shared
    └── External: ajv, ajv-formats, zod
```

---

## Database Schemas

### Neo4j Graph Schema

#### Node Types

**Concept**
```cypher
(:Concept {
  id: string,              # UUID
  name: string,            # Concept name
  description: string,     # Summary
  embeddings: float[],     # Dense vector
  first_seen: timestamp,   # Discovery time
  run_id: string          # Session that discovered it
})
```

**Entity**
```cypher
(:Entity {
  id: string,              # UUID
  name: string,            # Entity name
  type: string,            # Person, Organization, Location, etc.
  metadata: map,           # Additional properties
  first_seen: timestamp
})
```

**Claim**
```cypher
(:Claim {
  id: string,              # UUID
  text: string,            # Claim statement
  confidence: float,       # 0.0-1.0
  timestamp: timestamp,    # When extracted
  extraction_span: string, # Character offsets in source
  run_id: string
})
```

**Source**
```cypher
(:Source {
  id: string,              # UUID
  url: string,             # Source URL
  tier: string,            # L0, L1, L2, L3, L4
  title: string,
  venue: string,           # Journal, conference, etc.
  publish_date: date,
  citation_count: int,
  doi: string,             # If available
  open_access: boolean,
  metadata: map,           # Enriched metadata
  fetch_timestamp: timestamp
})
```

#### Edge Types

```cypher
(:Claim)-[:SUPPORTED_BY {
  extraction_method: string,
  confidence: float
}]->(:Source)

(:Source)-[:ABOUT {
  relevance: float
}]->(:Concept)

(:Concept)-[:RELATED_TO {
  relationship_type: string,
  strength: float
}]->(:Concept)

(:Claim)-[:CONTRADICTS {
  detected_at: timestamp,
  confidence: float
}]->(:Claim)

(:Source)-[:CITES {
  citation_context: string
}]->(:Source)
```

### OpenSearch Index Schema

#### Event Index

```json
{
  "mappings": {
    "properties": {
      "ts": { "type": "date" },
      "run_id": { "type": "keyword" },
      "step_id": { "type": "keyword" },
      "agent": { "type": "keyword" },
      "action": { "type": "keyword" },
      "input": { "type": "object" },
      "output_summary": { "type": "text" },
      "artifacts": { "type": "keyword" },
      "source": { "type": "keyword" },
      "cost_ms": { "type": "long" },
      "tokens_in": { "type": "long" },
      "tokens_out": { "type": "long" },
      "decision": { "type": "text" }
    }
  }
}
```

#### Content Index

```json
{
  "mappings": {
    "properties": {
      "url": { "type": "keyword" },
      "title": { "type": "text" },
      "content": { "type": "text" },
      "content_vector": {
        "type": "knn_vector",
        "dimension": 768
      },
      "tier": { "type": "keyword" },
      "publish_date": { "type": "date" },
      "citation_count": { "type": "integer" },
      "metadata": { "type": "object" }
    }
  }
}
```

### Redis Cache Schema

**HTTP Cache**
```
Key: cache:http:{url}:{etag}
Value: JSON serialized response
TTL: 24 hours
```

**Metadata Cache**
```
Key: cache:metadata:{doi}
Value: JSON enriched metadata
TTL: 7 days
```

**Rate Limit**
```
Key: ratelimit:{domain}:{window}
Value: Request count
TTL: Window duration
```

---

## API Architecture

### REST Endpoints

#### Health Check
```
GET /health
Response: {
  status: "healthy" | "degraded" | "unhealthy",
  services: {
    neo4j: { status: string, latency_ms: number },
    opensearch: { status: string, latency_ms: number },
    redis: { status: string, latency_ms: number }
  },
  uptime_seconds: number,
  version: string
}
```

#### Event Streaming (SSE)
```
GET /events/stream?run_id={run_id}
Headers: Accept: text/event-stream
Response: Server-Sent Events stream

Event Format:
event: research_event
data: {ResearchEvent JSON}
```

#### Event Query
```
GET /events?run_id={run_id}&agent={agent}&action={action}
       &from={iso_timestamp}&to={iso_timestamp}
       &limit={num}&offset={num}
Response: {
  events: ResearchEvent[],
  total: number,
  limit: number,
  offset: number
}
```

#### Event Search (Advanced)
```
POST /events/search
Body: {
  query: { /* OpenSearch query DSL */ },
  filters: { run_id?, agent?, action?, date_range? },
  aggregations: { /* OpenSearch aggs */ },
  sort: [{ field: string, order: "asc" | "desc" }],
  limit: number,
  offset: number
}
Response: {
  events: ResearchEvent[],
  aggregations: { /* Results */ },
  total: number
}
```

#### Snapshot Retrieval
```
GET /events/snapshot?run_id={run_id}&timestamp={iso_timestamp}
Response: {
  run_id: string,
  timestamp: string,
  state: {
    frontier: /* Frontier snapshot */,
    graph: /* Graph state */,
    reading_queue: /* Queue snapshot */
  },
  metadata: { /* Snapshot metadata */ }
}
```

### Error Responses

All errors follow consistent format:
```json
{
  "error": {
    "name": "ValidationError",
    "message": "Invalid run_id format",
    "statusCode": 400,
    "context": { /* Additional context */ },
    "timestamp": "2025-10-28T13:21:12Z"
  }
}
```

---

## Event-Driven Architecture

### Event Schema

All events conform to `ResearchEvent` interface:

```typescript
interface ResearchEvent {
  ts: string;              // ISO 8601 timestamp
  run_id: string;          // Session identifier
  step_id: string;         // Step within session
  agent: string;           // Component that emitted event
  action: string;          // Action type
  input?: any;             // Input parameters
  output_summary?: string; // Human-readable summary
  artifacts?: string[];    // Created artifacts (URLs, IDs)
  source?: string;         // Source document URL
  cost_ms?: number;        // Execution time
  tokens_in?: number;      // Input tokens (if LLM call)
  tokens_out?: number;     // Output tokens (if LLM call)
  decision?: string;       // Decision rationale
}
```

### Event Types

**Orchestrator Events**
- `orchestrator:plan` - Task graph planning
- `orchestrator:schedule` - Task scheduling
- `orchestrator:score_frontier` - Frontier prioritization
- `orchestrator:apply_strategy` - Control changes applied

**Fetch Events**
- `fetch:http_start` - HTTP request initiated
- `fetch:http_complete` - HTTP response received
- `fetch:js_render_start` - JS rendering started
- `fetch:js_render_complete` - JS rendering complete
- `fetch:cache_hit` - Cache hit
- `fetch:cache_miss` - Cache miss

**Index Events**
- `index:document` - Document indexed
- `index:bulk` - Bulk indexing operation

**Graph Events**
- `graph:upsert_claim` - Claim added or updated
- `graph:create_edge` - Relationship created
- `graph:community_detect` - Community detection run

**Retrieval Events**
- `retrieval:search` - Search query executed
- `retrieval:hybrid` - Hybrid retrieval performed
- `retrieval:graph_guided` - Graph-guided expansion

### Event Flow Patterns

#### Request-Response Pattern
```
Frontend → Backend API → Service
                       ↓
                   Event Bus → [Storage, Frontend SSE]
                       ↓
Service → Backend API → Frontend
```

#### Async Task Pattern
```
Orchestrator → Task Queue
                   ↓
               Service Worker
                   ↓
               Event Bus → [Storage, Frontend SSE]
```

---

## Security Architecture

### Authentication & Authorization

**Current**: Basic authentication (development phase)
**Planned**: JWT-based authentication with role-based access control (RBAC)

**Roles**:
- `viewer` - Read-only access to sessions
- `editor` - Create and modify sessions
- `admin` - Full system access including configuration

### Data Protection

**Encryption**:
- TLS for all HTTP traffic
- Encrypted storage at rest (MinIO, Redis)
- Secret management via environment variables

**PII Minimization**:
- Avoid storing user content unnecessarily
- Anonymize logs where possible
- Data retention policies with automatic cleanup

### Compliance

**Robots.txt Respect**:
- Parse and cache robots.txt per domain
- Block disallowed URLs
- Respect crawl-delay directives

**Rate Limiting**:
- Per-domain request limits
- Exponential backoff on errors
- Circuit breakers for failing services

**User Agent Identification**:
- Clear identification in requests
- Contact information provided
- Respect for site terms of service

---

## Deployment Architecture

### Development Environment

```
Docker Compose
├── neo4j:5.15-community        Port 7474 (HTTP), 7687 (Bolt)
├── opensearch:2.11.1           Port 9200 (API), 9600 (metrics)
├── opensearch-dashboards:2.11  Port 5601
├── redis:7-alpine              Port 6379
├── minio:latest                Port 9000 (API), 9001 (Console)
└── research-network (bridge)
```

**Service Dependencies**:
- Backend requires: Neo4j, OpenSearch, Redis, MinIO
- Frontend requires: Backend API

### Production Architecture (Planned)

```
                    ┌─────────────┐
                    │   CDN       │
                    │   (Static)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Load      │
                    │   Balancer  │
                    └──────┬──────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
    ┌─────▼─────┐                    ┌─────▼─────┐
    │ Frontend  │                    │  Backend  │
    │ (N nodes) │                    │ (N nodes) │
    └───────────┘                    └─────┬─────┘
                                           │
          ┌────────────────┬───────────────┼──────────────┐
          │                │               │              │
    ┌─────▼─────┐    ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
    │   Neo4j   │    │OpenSearch│   │  Redis  │   │  MinIO  │
    │  Cluster  │    │  Cluster │   │ Cluster │   │ Cluster │
    └───────────┘    └──────────┘    └─────────┘   └─────────┘
```

**Scalability Considerations**:
- Backend: Stateless, horizontal scaling
- Neo4j: Causal cluster with read replicas
- OpenSearch: Multi-node cluster with sharding
- Redis: Cluster mode with replication
- MinIO: Distributed mode with erasure coding

---

## Performance Characteristics

### Latency Targets (P95)

| Operation | Target | Current |
|-----------|--------|---------|
| Health check | <100ms | ✓ |
| Event publish | <50ms | ✓ |
| Event query (simple) | <200ms | ✓ |
| Event search (advanced) | <500ms | In Progress |
| HTTP fetch | <600ms | ✓ |
| JS fetch | <3s | Planned |
| Graph upsert | <200ms | ✓ |
| Hybrid retrieval | <400ms | Planned |
| Control change → preview | <400ms | Planned |
| Control change → apply | <800ms | Planned |

### Throughput Targets

| Operation | Target |
|-----------|--------|
| Events/sec | 1000+ |
| Concurrent SSE clients | 100+ |
| HTTP fetches/sec | 50+ |
| Graph writes/sec | 100+ |
| OpenSearch queries/sec | 500+ |

### Resource Usage

**Development Environment**:
- Neo4j: 2GB heap, 1GB pagecache
- OpenSearch: 1GB heap
- Redis: 512MB max memory
- MinIO: Unlimited (local disk)
- Backend: ~200MB per instance
- Frontend: Served from Vite dev server

**Production Estimates** (per instance):
- Backend: 512MB-1GB RAM
- Neo4j: 4GB+ heap recommended
- OpenSearch: 2GB+ heap recommended
- Redis: 1GB+ recommended

---

## Design Patterns

### Service Layer Patterns

**Repository Pattern**:
- Services abstract data access
- Consistent interface across storage backends
- Easy to mock for testing

**Factory Pattern**:
- Event producers create typed events
- Consistent event structure
- Auto-incrementing step IDs

**Strategy Pattern**:
- Pluggable fetch strategies (HTTP vs JS)
- Configurable ranking algorithms
- Interchangeable retrieval methods

### API Patterns

**RESTful Design**:
- Resource-oriented URLs
- HTTP verbs for operations
- Standard status codes
- JSON responses

**Event Streaming**:
- Server-Sent Events for real-time updates
- Connection lifecycle management
- Automatic reconnection

**Error Handling**:
- Custom error classes with context
- Consistent error response format
- Operational vs programming errors

### Data Patterns

**Event Sourcing**:
- Immutable event log
- State reconstruction from events
- Audit trail and replay

**CQRS** (Command Query Responsibility Segregation):
- Write path: Event bus → Storage
- Read path: OpenSearch queries
- Optimized for different access patterns

**Graph Pattern**:
- Knowledge graph for relationships
- Community detection for clustering
- Path queries for provenance

---

## Related Documentation

- [Getting Started Guide](docs/guides/GETTING_STARTED.md) - Setup and installation
- [Development Guide](docs/guides/DEVELOPMENT.md) - Development workflow
- [Testing Guide](docs/guides/TESTING.md) - Testing strategy
- [API Reference](docs/api/README.md) - Detailed API documentation
- [Event Schema Reference](docs/architecture/events.md) - Complete event schema
- [Graph Schema Reference](docs/architecture/graph.md) - Neo4j schema details

---

**Document Version**: 1.0
**Last Updated**: 2025-10-28
**Next Review**: 2025-11-28
