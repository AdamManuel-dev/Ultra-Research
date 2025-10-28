# Deep Research Cockpit - Implementation TODO List

**Generated**: 2025-10-28
**Source**: docs/PRD/PRD.md
**Total Tasks**: 406
**Estimated Duration**: 7-28 weeks (team size dependent)

---

## Executive Summary

This TODO list provides a **complete, DAG-ordered implementation roadmap** for the Deep Research Cockpit—a steerable AI research platform with real-time web exploration, graph memory, and sophisticated UI controls.

### Scope Coverage
✅ All 12 feature PRDs (B1-B12) decomposed into atomic tasks
✅ Every functional requirement and data contract captured
✅ Infrastructure, testing, documentation, and operations included
✅ Risk mitigation and quality gates built in
✅ 4-phase rollout aligned with PRD timeline (MVP → V1 → V1.5 → V2)

### Exit Criteria
- **MVP** (Phases 1-2): TTFC ≤120s, Authority Mix ≥50% L0/L1, non-JS pipeline operational
- **V1** (Phases 1-4): TTFC ≤90s, Authority Mix ≥60%, Evidence Robustness ≥2.0, full replay + exports

---

## Phase 1: Foundations (Weeks 1-3) — 89 Tasks

### 1.1 Project Setup & Infrastructure (10 tasks)

- [ ] **[P1/M/Backend]** Initialize monorepo structure with backend/frontend/shared packages
  - Dependencies: None
  - Estimate: 4-8 hours
  - Acceptance: Lerna/Nx workspace with TypeScript, ESLint, Prettier configured

- [ ] **[P1/S/Backend]** Set up TypeScript configuration with strict mode enabled
  - Dependencies: Monorepo structure
  - Estimate: 2-4 hours
  - Acceptance: tsconfig.json with strict: true, no implicit any, proper path mappings

- [ ] **[P1/S/Backend]** Configure ESLint and Prettier with Airbnb style guide
  - Dependencies: TypeScript setup
  - Estimate: 2-4 hours
  - Acceptance: .eslintrc.json, .prettierrc with consistent formatting rules

- [ ] **[P1/M/Backend]** Create environment configuration system with .env template
  - Dependencies: Project structure
  - Estimate: 4-8 hours
  - Acceptance: .env.example with all required vars, config validation on startup

- [ ] **[P1/M/Backend]** Set up dependency management and package scripts
  - Dependencies: Monorepo structure
  - Estimate: 4-8 hours
  - Acceptance: package.json with dev/build/test/lint scripts, proper peer dependencies

- [ ] **[P1/L/DevOps]** Configure Docker development environment with docker-compose
  - Dependencies: Project structure
  - Estimate: 8-16 hours
  - Acceptance: docker-compose.yml with Neo4j, OpenSearch, Redis, hot-reload

- [ ] **[P1/M/Backend]** Implement centralized error handling with custom error classes
  - Dependencies: TypeScript setup
  - Estimate: 4-8 hours
  - Acceptance: AuthError, FetchError, GraphError classes with proper stack traces

- [ ] **[P1/M/Backend]** Set up structured logging with correlation IDs
  - Dependencies: Error handling
  - Estimate: 4-8 hours
  - Acceptance: Winston/Pino logger with JSON output, run_id/step_id tracking

- [ ] **[P1/S/Backend]** Create health check endpoint for service monitoring
  - Dependencies: Basic server setup
  - Estimate: 2-4 hours
  - Acceptance: GET /health returns 200 with service status, dependencies check

- [ ] **[P1/M/QA]** Configure Jest/Vitest testing framework with coverage reporting
  - Dependencies: TypeScript setup
  - Estimate: 4-8 hours
  - Acceptance: Test runner with >80% coverage threshold, mocking utilities

---

### 1.2 Event Schema & Observability (B8) — 18 tasks

#### Core Event System

- [ ] **[P1/M/Backend]** Define unified event schema with TypeScript types
  - Dependencies: TypeScript setup
  - Estimate: 4-8 hours
  - Acceptance: Event interface with ts/run_id/step_id/agent/action/input/output/artifacts/source/cost/tokens/decision

- [ ] **[P1/M/Backend]** Implement event validator with JSON Schema
  - Dependencies: Event schema
  - Estimate: 4-8 hours
  - Acceptance: Ajv validator rejecting invalid events, comprehensive error messages

- [ ] **[P1/L/Backend]** Build event bus with streaming support (SSE/WebSocket)
  - Dependencies: Event schema, validator
  - Estimate: 8-16 hours
  - Acceptance: Real-time event broadcasting to connected clients, <100ms latency

- [ ] **[P1/M/Backend]** Create durable event storage with object store integration
  - Dependencies: Event bus
  - Estimate: 4-8 hours
  - Acceptance: S3/GCS/Minio storage with JSONL format, partitioned by run_id/date

- [ ] **[P1/M/Backend]** Implement event indexing for queryable history
  - Dependencies: Event storage
  - Estimate: 4-8 hours
  - Acceptance: OpenSearch index with run/time/action/agent filters, ≤500ms query latency

- [ ] **[P1/M/Backend]** Build snapshot generator for replay support
  - Dependencies: Event storage, indexing
  - Estimate: 4-8 hours
  - Acceptance: Pre-computed snapshots at key decision points, delta compression

#### Event Producers

- [ ] **[P2/S/Backend]** Add orchestrator decision events
  - Dependencies: Orchestrator skeleton
  - Estimate: 2-4 hours
  - Acceptance: frontier.update, command.received, task.scheduled events

- [ ] **[P2/S/Backend]** Add fetch pipeline events
  - Dependencies: Fetch implementation
  - Estimate: 2-4 hours
  - Acceptance: fetch.start, fetch.complete, fetch.error with URLs and timing

- [ ] **[P2/S/Backend]** Add extraction/parsing events
  - Dependencies: Extraction implementation
  - Estimate: 2-4 hours
  - Acceptance: extract.start, extract.complete with content stats

- [ ] **[P2/S/Backend]** Add indexing events
  - Dependencies: Indexer implementation
  - Estimate: 2-4 hours
  - Acceptance: index.write, index.query with document counts and latency

- [ ] **[P2/S/Backend]** Add graph memory events
  - Dependencies: Graph implementation
  - Estimate: 2-4 hours
  - Acceptance: graph.merge, graph.query with node/edge counts

- [ ] **[P2/S/Backend]** Add synthesis events
  - Dependencies: Synthesis implementation
  - Estimate: 2-4 hours
  - Acceptance: synthesis.start, synthesis.complete with input/output tokens

#### Analytics & Monitoring

- [ ] **[P2/M/Backend]** Implement event analytics aggregation jobs
  - Dependencies: Event indexing
  - Estimate: 4-8 hours
  - Acceptance: Periodic rollups for KPI calculations, time-series metrics

- [ ] **[P2/M/Backend]** Create event stream query API
  - Dependencies: Event indexing
  - Estimate: 4-8 hours
  - Acceptance: GET /events?run_id=X&action=Y with filtering and pagination

- [ ] **[P2/S/Backend]** Build event retention policy enforcement
  - Dependencies: Event storage
  - Estimate: 2-4 hours
  - Acceptance: Configurable TTL, archival to cold storage, audit log preservation

- [ ] **[P3/M/Backend]** Add event-driven alerting rules
  - Dependencies: Event stream
  - Estimate: 4-8 hours
  - Acceptance: Alert on error spikes, cost thresholds, TTFC violations

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for event schema validation
  - Dependencies: Event validator
  - Estimate: 4-8 hours
  - Acceptance: Test all required fields, type constraints, edge cases

- [ ] **[P2/M/QA]** Write integration tests for event streaming
  - Dependencies: Event bus
  - Estimate: 4-8 hours
  - Acceptance: Test SSE/WebSocket delivery, reconnection, backpressure

---

### 1.3 Basic Fetch Pipeline (B2 - Part 1) — 22 tasks

#### Non-JS Fetch Implementation

- [ ] **[P1/M/Backend]** Create HTTP client with proper User-Agent and headers
  - Dependencies: Project setup
  - Estimate: 4-8 hours
  - Acceptance: httpx/axios client with timeout, redirects, charset detection

- [ ] **[P1/M/Backend]** Implement robots.txt parser and compliance checker
  - Dependencies: HTTP client
  - Estimate: 4-8 hours
  - Acceptance: Respect Crawl-delay, User-agent rules, cache robots.txt per domain

- [ ] **[P1/M/Backend]** Build rate limiter with per-domain tracking
  - Dependencies: HTTP client
  - Estimate: 4-8 hours
  - Acceptance: Configurable requests/second per domain, exponential backoff on 429

- [ ] **[P1/L/Backend]** Integrate Trafilatura for main content extraction
  - Dependencies: HTTP client
  - Estimate: 8-16 hours
  - Acceptance: Extract main text, title, author, date with confidence scores

- [ ] **[P1/M/Backend]** Add Readability fallback for extraction
  - Dependencies: Trafilatura integration
  - Estimate: 4-8 hours
  - Acceptance: Use Readability when Trafilatura confidence <0.5

- [ ] **[P1/M/Backend]** Implement charset detection and normalization
  - Dependencies: HTTP client
  - Estimate: 4-8 hours
  - Acceptance: Handle UTF-8, ISO-8859-1, detect from headers/meta/BOM

#### HTML to Markdown Conversion

- [ ] **[P1/L/Backend]** Build Turndown microservice for HTML→Markdown
  - Dependencies: Extraction pipeline
  - Estimate: 8-16 hours
  - Acceptance: Preserve headings, code blocks, links, tables; remove boilerplate

- [ ] **[P1/M/Backend]** Implement custom Turndown rules for academic content
  - Dependencies: Turndown service
  - Estimate: 4-8 hours
  - Acceptance: Handle math equations, citations, figures with proper formatting

- [ ] **[P1/S/Backend]** Add markdown post-processing cleanup
  - Dependencies: Turndown service
  - Estimate: 2-4 hours
  - Acceptance: Remove excessive whitespace, normalize heading levels, fix broken links

- [ ] **[P1/M/Backend]** Create POST /reduce/html2md API endpoint
  - Dependencies: Turndown service
  - Estimate: 4-8 hours
  - Acceptance: Accept HTML, return markdown with metadata, handle errors gracefully

#### Fetch Orchestration

- [ ] **[P1/L/Backend]** Build fetch coordinator with request queue
  - Dependencies: HTTP client, rate limiter
  - Estimate: 8-16 hours
  - Acceptance: Priority queue, concurrent request management, retry logic

- [ ] **[P1/M/Backend]** Implement exponential backoff with jitter
  - Dependencies: Fetch coordinator
  - Estimate: 4-8 hours
  - Acceptance: Retry on 5xx/timeout, max 3 retries, exponential delays

- [ ] **[P1/M/Backend]** Add request deduplication
  - Dependencies: Fetch coordinator
  - Estimate: 4-8 hours
  - Acceptance: Coalesce concurrent requests for same URL, share result

- [ ] **[P1/M/Backend]** Create POST /fetch/basic API endpoint
  - Dependencies: Fetch coordinator, extraction
  - Estimate: 4-8 hours
  - Acceptance: Accept URL, return {status, html, extracted, headers}, emit events

#### Caching Layer

- [ ] **[P1/L/Backend]** Implement HTTP cache with ETag support
  - Dependencies: HTTP client
  - Estimate: 8-16 hours
  - Acceptance: Redis/Memcached storage, conditional requests, configurable TTL

- [ ] **[P1/M/Backend]** Build HTML→Markdown cache
  - Dependencies: Turndown service, HTTP cache
  - Estimate: 4-8 hours
  - Acceptance: Cache by HTML hash, separate TTL from HTTP cache

- [ ] **[P1/S/Backend]** Add cache hit rate metrics
  - Dependencies: Caching layers
  - Estimate: 2-4 hours
  - Acceptance: Expose hit/miss/eviction stats per cache type

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for robots.txt parsing
  - Dependencies: Robots parser
  - Estimate: 4-8 hours
  - Acceptance: Test various robots.txt formats, edge cases, malformed files

- [ ] **[P2/M/QA]** Write integration tests for fetch pipeline
  - Dependencies: Fetch coordinator
  - Estimate: 4-8 hours
  - Acceptance: Test successful fetch, retries, rate limiting, caching

- [ ] **[P2/L/QA]** Create golden corpus for extraction quality
  - Dependencies: Extraction implementation
  - Estimate: 8-16 hours
  - Acceptance: 50+ diverse pages with expected extractions, automated comparison

- [ ] **[P2/M/QA]** Write property-based tests for HTML→Markdown
  - Dependencies: Turndown service
  - Estimate: 4-8 hours
  - Acceptance: Test idempotency, structural preservation, no data loss

- [ ] **[P2/M/QA]** Test cache invalidation and TTL
  - Dependencies: Caching layers
  - Estimate: 4-8 hours
  - Acceptance: Verify expiration, manual invalidation, size limits

---

### 1.4 Hybrid Indexer & Retrieval Bootstrap (B4 - Part 1) — 15 tasks

#### OpenSearch Setup

- [ ] **[P1/L/Backend]** Set up OpenSearch cluster in Docker
  - Dependencies: Docker environment
  - Estimate: 8-16 hours
  - Acceptance: Single-node cluster with security disabled for dev, persistent volumes

- [ ] **[P1/M/Backend]** Design document schema for sources and content
  - Dependencies: OpenSearch setup
  - Estimate: 4-8 hours
  - Acceptance: Schema with URL/title/content/metadata fields, proper field types

- [ ] **[P1/M/Backend]** Create indices with hybrid search configuration
  - Dependencies: Schema design
  - Estimate: 4-8 hours
  - Acceptance: BM25 + dense vector fields (text-embedding-3-small), kNN settings

- [ ] **[P1/M/Backend]** Implement index mapping with analyzers
  - Dependencies: Indices creation
  - Estimate: 4-8 hours
  - Acceptance: Standard analyzer for BM25, custom stopwords, stemming

#### Embedding Generation

- [ ] **[P1/L/Backend]** Integrate OpenAI embeddings API with batching
  - Dependencies: Project setup
  - Estimate: 8-16 hours
  - Acceptance: Batch requests (up to 100 docs), handle rate limits, retry logic

- [ ] **[P1/M/Backend]** Build embedding cache with vector similarity check
  - Dependencies: Embeddings API
  - Estimate: 4-8 hours
  - Acceptance: Cache by text hash, deduplicate near-identical embeddings

- [ ] **[P1/M/Backend]** Implement embedding generation queue
  - Dependencies: Embeddings API
  - Estimate: 4-8 hours
  - Acceptance: Async job queue (Bull/BeeQueue), prioritize user-requested docs

#### Indexing Pipeline

- [ ] **[P1/M/Backend]** Create document indexer with batch upsert
  - Dependencies: Indices, embeddings
  - Estimate: 4-8 hours
  - Acceptance: Bulk API usage, handle partial failures, idempotent operations

- [ ] **[P1/M/Backend]** Implement chunking strategy for long documents
  - Dependencies: Document indexer
  - Estimate: 4-8 hours
  - Acceptance: Sliding window (1000 tokens, 200 overlap), preserve context

- [ ] **[P1/S/Backend]** Add document fingerprinting for deduplication
  - Dependencies: Document indexer
  - Estimate: 2-4 hours
  - Acceptance: SHA-256 hash + SimHash for near-duplicates

- [ ] **[P1/M/Backend]** Build POST /index/upsert API endpoint
  - Dependencies: Document indexer
  - Estimate: 4-8 hours
  - Acceptance: Accept doc with metadata, return indexed_id, emit index.write event

#### Retrieval Implementation

- [ ] **[P1/L/Backend]** Implement hybrid retrieval with RRF fusion
  - Dependencies: Indices with vectors
  - Estimate: 8-16 hours
  - Acceptance: Combine BM25 + kNN scores using Reciprocal Rank Fusion

- [ ] **[P1/M/Backend]** Create POST /search/hybrid API endpoint
  - Dependencies: Hybrid retrieval
  - Estimate: 4-8 hours
  - Acceptance: Accept query, return ranked results with scores and highlights

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for chunking logic
  - Dependencies: Chunking implementation
  - Estimate: 4-8 hours
  - Acceptance: Test boundary conditions, overlap preservation, metadata propagation

- [ ] **[P2/L/QA]** Create retrieval evaluation set with relevance labels
  - Dependencies: Hybrid retrieval
  - Estimate: 8-16 hours
  - Acceptance: 20+ queries with expected results, automated NDCG@10 calculation

---

### 1.5 Orchestrator Foundation (B1) — 14 tasks

#### Core Orchestrator

- [ ] **[P1/M/Backend]** Design task graph data structure
  - Dependencies: Event schema
  - Estimate: 4-8 hours
  - Acceptance: DAG representation with search/fetch/extract/index/retrieve/synthesize/graph.merge nodes

- [ ] **[P1/L/Backend]** Implement planner skeleton with task decomposition
  - Dependencies: Task graph
  - Estimate: 8-16 hours
  - Acceptance: Decompose user query into task graph, emit plan.created event

- [ ] **[P1/L/Backend]** Build task executor with concurrency control
  - Dependencies: Planner, task graph
  - Estimate: 8-16 hours
  - Acceptance: Execute tasks respecting dependencies, configurable parallelism

- [ ] **[P1/M/Backend]** Create run context store (run_id, state, config)
  - Dependencies: Event schema
  - Estimate: 4-8 hours
  - Acceptance: PostgreSQL/Redis storage, fast lookups by run_id, proper isolation

#### Frontier Management

- [ ] **[P1/L/Backend]** Implement frontier priority queue with scoring
  - Dependencies: Planner
  - Estimate: 8-16 hours
  - Acceptance: Score by novelty/centrality/disagreement/recency, emit frontier.update events

- [ ] **[P1/M/Backend]** Build novelty scorer using graph distance
  - Dependencies: Frontier queue
  - Estimate: 4-8 hours
  - Acceptance: Penalize concepts close to already-explored nodes

- [ ] **[P1/M/Backend]** Build centrality scorer using PageRank proxy
  - Dependencies: Frontier queue
  - Estimate: 4-8 hours
  - Acceptance: Approximate centrality from citation/link counts

- [ ] **[P1/M/Backend]** Build disagreement scorer using claim contradictions
  - Dependencies: Frontier queue, graph
  - Estimate: 4-8 hours
  - Acceptance: Boost concepts with CONTRADICTS edges

- [ ] **[P1/S/Backend]** Build recency scorer using publication dates
  - Dependencies: Frontier queue
  - Estimate: 2-4 hours
  - Acceptance: Exponential decay with configurable half-life

#### Strategy Controller

- [ ] **[P1/M/Backend]** Implement command handler for strategy changes
  - Dependencies: Run context store
  - Estimate: 4-8 hours
  - Acceptance: POST /orchestrator/command accepts {run_id, kind, params}, updates weights

- [ ] **[P1/M/Backend]** Add knob change preview generator
  - Dependencies: Frontier, command handler
  - Estimate: 4-8 hours
  - Acceptance: Re-score frontier with ghost weights, return delta, ≤100ms latency

- [ ] **[P1/M/Backend]** Create GET /frontier/state API endpoint
  - Dependencies: Frontier
  - Estimate: 4-8 hours
  - Acceptance: Return [{concept_id, score, reason}] with breakdown

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for task graph DAG validation
  - Dependencies: Task graph
  - Estimate: 4-8 hours
  - Acceptance: Detect cycles, orphaned nodes, missing dependencies

- [ ] **[P2/L/QA]** Write integration tests for orchestrator with mocked tasks
  - Dependencies: Orchestrator
  - Estimate: 8-16 hours
  - Acceptance: Test full cycle: plan → execute → complete, verify event sequence

---

### 1.6 Pilot View Shell (B5 - Part 1) — 10 tasks

#### Frontend Setup

- [ ] **[P1/M/Frontend]** Initialize React + TypeScript + Vite project
  - Dependencies: Monorepo structure
  - Estimate: 4-8 hours
  - Acceptance: Hot reload, TypeScript strict mode, Tailwind CSS configured

- [ ] **[P1/M/Frontend]** Set up React Router with /run/:run_id and /review/:run_id routes
  - Dependencies: React setup
  - Estimate: 4-8 hours
  - Acceptance: Proper routing, URL param extraction, 404 handling

- [ ] **[P1/M/Frontend]** Configure Redux Toolkit with RTK Query for API calls
  - Dependencies: React setup
  - Estimate: 4-8 hours
  - Acceptance: Store with slices, RTK Query for backend APIs, proper typing

- [ ] **[P1/L/Frontend]** Implement WebSocket/SSE connection for event streaming
  - Dependencies: Redux setup
  - Estimate: 8-16 hours
  - Acceptance: Auto-reconnect, backpressure handling, event dispatch to Redux

#### Layout & Shell

- [ ] **[P1/M/Frontend]** Create main layout with responsive grid
  - Dependencies: React Router
  - Estimate: 4-8 hours
  - Acceptance: Header, sidebar, main content area, collapsible panels

- [ ] **[P1/M/Frontend]** Build status strip component with metrics
  - Dependencies: Layout
  - Estimate: 4-8 hours
  - Acceptance: Display latency/tokens/%JS/diversity/contradiction, real-time updates

- [ ] **[P1/L/Frontend]** Implement live event log with virtualized list
  - Dependencies: Event stream
  - Estimate: 8-16 hours
  - Acceptance: React-window for performance, filtering, collapsible decision groups

#### Testing

- [ ] **[P2/M/QA]** Set up Jest + React Testing Library
  - Dependencies: Frontend setup
  - Estimate: 4-8 hours
  - Acceptance: Test runner with coverage, component testing utilities

- [ ] **[P2/M/QA]** Write tests for WebSocket connection logic
  - Dependencies: WebSocket implementation
  - Estimate: 4-8 hours
  - Acceptance: Test connect/disconnect/reconnect, event dispatching

- [ ] **[P2/M/QA]** Write tests for layout responsiveness
  - Dependencies: Layout component
  - Estimate: 4-8 hours
  - Acceptance: Test desktop/tablet/mobile breakpoints, panel collapse

---

## Phase 2: Core Search + Ranking (Weeks 4-6) — 97 Tasks

### 2.1 External Scholarly Integrations (B12) — 18 tasks

#### API Clients

- [ ] **[P1/M/Backend]** Build Crossref API client with rate limiting
  - Dependencies: HTTP client
  - Estimate: 4-8 hours
  - Acceptance: DOI lookup, metadata extraction, respect 50 req/s limit, retry on 429

- [ ] **[P1/M/Backend]** Build OpenAlex API client with cursor pagination
  - Dependencies: HTTP client
  - Estimate: 4-8 hours
  - Acceptance: Work/Author/Venue lookups, handle pagination, batch requests

- [ ] **[P1/M/Backend]** Build Semantic Scholar API client with auth
  - Dependencies: HTTP client
  - Estimate: 4-8 hours
  - Acceptance: Paper details, citation counts, S2FieldsOfStudy, API key management

- [ ] **[P1/M/Backend]** Build Unpaywall API client for OA links
  - Dependencies: HTTP client
  - Estimate: 4-8 hours
  - Acceptance: DOI → best OA URL, respect email requirement, cache results

- [ ] **[P1/M/Backend]** Integrate YouTube Data API for video metadata
  - Dependencies: HTTP client
  - Estimate: 4-8 hours
  - Acceptance: Video details, channel info, statistics, quota management

- [ ] **[P1/M/Backend]** Integrate YouTube Transcript API for captions
  - Dependencies: YouTube client
  - Estimate: 4-8 hours
  - Acceptance: Fetch auto/manual captions, multi-language support, timestamp preservation

#### Normalization & Caching

- [ ] **[P1/M/Backend]** Define source profile schema with all enrichment fields
  - Dependencies: Project setup
  - Estimate: 4-8 hours
  - Acceptance: TypeScript interface with DOI/title/authors/venue/citations/OA/retracted/type

- [ ] **[P1/L/Backend]** Build metadata enrichment pipeline with parallel calls
  - Dependencies: All API clients, source profile schema
  - Estimate: 8-16 hours
  - Acceptance: Enrich source profile using multiple APIs concurrently, fallback handling

- [ ] **[P1/M/Backend]** Implement retraction database lookup (Retraction Watch)
  - Dependencies: Crossref client
  - Estimate: 4-8 hours
  - Acceptance: Check DOI against retraction DB, flag retractions with reasons

- [ ] **[P1/M/Backend]** Create venue ranking lookup (SCImago, CORE)
  - Dependencies: Enrichment pipeline
  - Estimate: 4-8 hours
  - Acceptance: Map venue name → rank/quartile, cached locally, annual refresh

- [ ] **[P1/L/Backend]** Build enrichment cache with PostgreSQL
  - Dependencies: Source profile schema
  - Estimate: 8-16 hours
  - Acceptance: Store by URL/DOI, TTL (7 days for papers, 1 day for videos), batch lookups

- [ ] **[P1/M/Backend]** Implement batch updater for cache refresh
  - Dependencies: Enrichment cache
  - Estimate: 4-8 hours
  - Acceptance: Cron job to refresh stale entries, prioritize frequently accessed

#### Health Monitoring

- [ ] **[P2/S/Backend]** Add health checks for external APIs
  - Dependencies: API clients
  - Estimate: 2-4 hours
  - Acceptance: Periodic ping, alert on failures, display status in /health endpoint

- [ ] **[P2/M/Backend]** Implement circuit breakers for API resilience
  - Dependencies: API clients
  - Estimate: 4-8 hours
  - Acceptance: Open circuit after N failures, half-open probe, fallback to cached data

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for API clients with mocked responses
  - Dependencies: API clients
  - Estimate: 4-8 hours
  - Acceptance: Test success, errors, rate limits, pagination for each client

- [ ] **[P2/M/QA]** Write integration tests for enrichment pipeline
  - Dependencies: Enrichment pipeline
  - Estimate: 4-8 hours
  - Acceptance: Test multi-source enrichment, partial failures, cache hits

- [ ] **[P2/M/QA]** Create test fixtures for various source types
  - Dependencies: Source profile schema
  - Estimate: 4-8 hours
  - Acceptance: Paper/spec/repo/video/blog profiles with all fields populated

- [ ] **[P2/S/QA]** Test retraction flagging with known retracted papers
  - Dependencies: Retraction lookup
  - Estimate: 2-4 hours
  - Acceptance: Verify flagging of known retractions, no false positives

---

### 2.2 Ranking System (B3) — 28 tasks

#### Source Classification

- [ ] **[P1/M/Backend]** Build URL-based source type classifier
  - Dependencies: Project setup
  - Estimate: 4-8 hours
  - Acceptance: Regex/domain rules for arxiv/github/youtube/stackoverflow/etc., 95% accuracy

- [ ] **[P1/M/Backend]** Build content-based type classifier with heuristics
  - Dependencies: URL classifier
  - Estimate: 4-8 hours
  - Acceptance: Fallback using title/meta/structure signals, handle edge cases

- [ ] **[P1/S/Backend]** Map source types to L0-L4 tiers
  - Dependencies: Type classifier
  - Estimate: 2-4 hours
  - Acceptance: Paper/spec/repo → L0, conf talks → L1, blog → L2, forum → L3, practitioner → L4

#### Core Proximity Calculation

- [ ] **[P1/L/Backend]** Implement citation graph traversal for origin detection
  - Dependencies: Graph memory schema
  - Estimate: 8-16 hours
  - Acceptance: Identify earliest highly-cited works, cache origin set per topic

- [ ] **[P1/M/Backend]** Build shortest path calculator from origin sources
  - Dependencies: Citation graph
  - Estimate: 4-8 hours
  - Acceptance: Use Neo4j shortestPath, cache distances, handle disconnected components

- [ ] **[P1/M/Backend]** Compute core proximity score with exponential decay
  - Dependencies: Shortest path calculator
  - Estimate: 4-8 hours
  - Acceptance: Score = exp(-distance / decay_constant), configurable decay

#### Multi-Factor Scoring

- [ ] **[P1/M/Backend]** Implement relevance scorer using BM25 + embedding similarity
  - Dependencies: Hybrid retrieval
  - Estimate: 4-8 hours
  - Acceptance: Normalize BM25 and cosine scores, weighted combination

- [ ] **[P1/M/Backend]** Implement authority scorer using citations + venue rank
  - Dependencies: Enrichment pipeline
  - Estimate: 4-8 hours
  - Acceptance: Combine citation count (log scale) with venue quartile, normalize

- [ ] **[P1/M/Backend]** Implement recency scorer with time decay
  - Dependencies: Enrichment pipeline
  - Estimate: 4-8 hours
  - Acceptance: Exponential decay from publication date, configurable half-life

- [ ] **[P1/M/Backend]** Implement independence scorer using author/source overlap
  - Dependencies: Enrichment pipeline
  - Estimate: 4-8 hours
  - Acceptance: Penalize sources with shared authors/affiliations with already-consumed sources

- [ ] **[P1/M/Backend]** Apply retraction penalty
  - Dependencies: Retraction lookup
  - Estimate: 4-8 hours
  - Acceptance: Set score to 0 for retracted papers, visible warning

- [ ] **[P1/L/Backend]** Build composite scoring function with knob weights
  - Dependencies: All scorers
  - Estimate: 8-16 hours
  - Acceptance: Weighted sum of all factors, normalized to [0,1], configurable weights

#### Why-Ranked Explanations

- [ ] **[P1/M/Backend]** Generate score breakdown with factor contributions
  - Dependencies: Composite scoring
  - Estimate: 4-8 hours
  - Acceptance: Return {total, relevance, authority, core_proximity, recency, independence} per doc

- [ ] **[P1/M/Backend]** Create human-readable ranking reasons
  - Dependencies: Score breakdown
  - Estimate: 4-8 hours
  - Acceptance: "Highly cited (2.3K) seminal paper (L0) from Nature (Q1)"

- [ ] **[P1/M/Backend]** Build POST /rank/score API endpoint
  - Dependencies: Composite scoring, explanations
  - Estimate: 4-8 hours
  - Acceptance: Accept {doc_profile, knobs}, return {score, breakdown}

#### Reading Queue Builder

- [ ] **[P1/L/Backend]** Implement L0-L4 queue builder with quotas
  - Dependencies: Source classification, composite scoring
  - Estimate: 8-16 hours
  - Acceptance: Enforce min/max per tier, prioritize L0/L1 in core-first mode

- [ ] **[P1/M/Backend]** Detect and mark gaps (missing L0/L1 sources)
  - Dependencies: Queue builder
  - Estimate: 4-8 hours
  - Acceptance: Identify expected but unfound primary sources, suggest searches

- [ ] **[P1/M/Backend]** Support manual queue overrides with audit trail
  - Dependencies: Queue builder
  - Estimate: 4-8 hours
  - Acceptance: Allow drag-to-reorder, log overrides with reason, revert option

- [ ] **[P1/M/Backend]** Build POST /queue/build API endpoint
  - Dependencies: Queue builder
  - Estimate: 4-8 hours
  - Acceptance: Accept {candidates, knobs}, return {L0:[..], L1:[..], ...}

#### What-If Previews

- [ ] **[P1/M/Backend]** Implement ghost re-ranking for knob changes
  - Dependencies: Composite scoring
  - Estimate: 4-8 hours
  - Acceptance: Re-score with hypothetical weights, return delta, ≤100ms latency

- [ ] **[P1/M/Backend]** Build preview API for strategy changes
  - Dependencies: Ghost re-ranking
  - Estimate: 4-8 hours
  - Acceptance: GET /rank/preview?knobs={...} returns new order with highlights

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for source type classification
  - Dependencies: Type classifier
  - Estimate: 4-8 hours
  - Acceptance: Test all L0-L4 types, ambiguous cases, edge domains

- [ ] **[P2/M/QA]** Write unit tests for core proximity calculation
  - Dependencies: Core proximity scorer
  - Estimate: 4-8 hours
  - Acceptance: Test with synthetic citation graphs, disconnected components

- [ ] **[P2/L/QA]** Create ranking evaluation set with relevance judgments
  - Dependencies: Composite scoring
  - Estimate: 8-16 hours
  - Acceptance: 20+ queries with expected top-K, automated NDCG calculation

- [ ] **[P2/M/QA]** Write integration tests for queue builder
  - Dependencies: Queue builder
  - Estimate: 4-8 hours
  - Acceptance: Test quota enforcement, gap detection, various knob settings

- [ ] **[P2/M/QA]** Test why-ranked explanations for clarity
  - Dependencies: Ranking reasons
  - Estimate: 4-8 hours
  - Acceptance: Manual review + readability scoring, no jargon/abbreviations

- [ ] **[P2/M/QA]** Write property-based tests for score normalization
  - Dependencies: Composite scoring
  - Estimate: 4-8 hours
  - Acceptance: Verify scores always in [0,1], monotonicity, weight sensitivity

---

### 2.3 Pilot View - Strategy Controls & Rank Cards (B5 - Part 2) — 20 tasks

#### Command Bar

- [ ] **[P1/L/Frontend]** Build ⌘K command palette with fuzzy search
  - Dependencies: React setup
  - Estimate: 8-16 hours
  - Acceptance: Keyboard shortcut, instant search, command history, recent actions

- [ ] **[P1/M/Frontend]** Implement macro commands (Survey, Spec Hunt, etc.)
  - Dependencies: Command palette
  - Estimate: 4-8 hours
  - Acceptance: Pre-configured knob sets, one-click activation, tooltip descriptions

- [ ] **[P1/M/Frontend]** Add command autocomplete with descriptions
  - Dependencies: Command palette
  - Estimate: 4-8 hours
  - Acceptance: Show parameters, examples, keyboard shortcuts in dropdown

#### Strategy Compass

- [ ] **[P1/L/Frontend]** Build interactive knob controls with sliders
  - Dependencies: Redux setup
  - Estimate: 8-16 hours
  - Acceptance: Depth/breadth/core-first/verify/compare sliders, real-time updates

- [ ] **[P1/M/Frontend]** Implement ghost re-rank preview on hover
  - Dependencies: Knob controls, preview API
  - Estimate: 4-8 hours
  - Acceptance: Show rank deltas on hover, debounced API calls, <200ms latency

- [ ] **[P1/M/Frontend]** Add knob presets with named configurations
  - Dependencies: Knob controls
  - Estimate: 4-8 hours
  - Acceptance: Save/load presets, default presets for macros, shareable links

- [ ] **[P1/S/Frontend]** Show knob change confirmation with impact estimate
  - Dependencies: Knob controls
  - Estimate: 2-4 hours
  - Acceptance: "This will re-rank 23 sources", undo option, animation

#### Reading Queue UI

- [ ] **[P1/L/Frontend]** Build L0-L4 column layout with virtualized lists
  - Dependencies: Layout, queue API
  - Estimate: 8-16 hours
  - Acceptance: 5 columns, drag-drop between tiers, react-window for performance

- [ ] **[P1/L/Frontend]** Create rank card component with why-ranked tooltip
  - Dependencies: Queue layout
  - Estimate: 8-16 hours
  - Acceptance: Title/authors/venue, score badge, hover for breakdown, OA indicator

- [ ] **[P1/M/Frontend]** Add source preview modal with extracted content
  - Dependencies: Rank card
  - Estimate: 4-8 hours
  - Acceptance: Click card → modal with markdown preview, scroll to relevant sections

- [ ] **[P1/M/Frontend]** Implement drag-to-override queue order
  - Dependencies: Queue layout
  - Estimate: 4-8 hours
  - Acceptance: React DnD, visual feedback, confirmation, emit override event

- [ ] **[P1/M/Frontend]** Show gap indicators for missing L0/L1 sources
  - Dependencies: Queue layout
  - Estimate: 4-8 hours
  - Acceptance: Yellow banner "No L0 spec found", suggested search links

- [ ] **[P1/S/Frontend]** Add tier collapse/expand controls
  - Dependencies: Queue layout
  - Estimate: 2-4 hours
  - Acceptance: Collapse to header only, persist state, keyboard shortcuts

#### Rank Card Enhancements

- [ ] **[P2/M/Frontend]** Add citation count badge with trend arrow
  - Dependencies: Rank card
  - Estimate: 4-8 hours
  - Acceptance: Display citations, sparkline for growth, color coding

- [ ] **[P2/S/Frontend]** Add retraction warning badge
  - Dependencies: Rank card
  - Estimate: 2-4 hours
  - Acceptance: Red badge "RETRACTED", tooltip with reason, prevent selection

- [ ] **[P2/M/Frontend]** Show independence score as overlap indicator
  - Dependencies: Rank card
  - Estimate: 4-8 hours
  - Acceptance: Icon showing shared authors/affiliations, tooltip listing overlaps

#### Testing

- [ ] **[P2/M/QA]** Write tests for command palette keyboard navigation
  - Dependencies: Command palette
  - Estimate: 4-8 hours
  - Acceptance: Test arrow keys, enter, escape, fuzzy matching

- [ ] **[P2/M/QA]** Write tests for knob control state management
  - Dependencies: Knob controls
  - Estimate: 4-8 hours
  - Acceptance: Test Redux actions, preview debouncing, preset loading

- [ ] **[P2/L/QA]** Write E2E tests for queue interaction flow
  - Dependencies: Queue layout
  - Estimate: 8-16 hours
  - Acceptance: Test drag-drop, modal open, override, gap handling with Playwright

- [ ] **[P2/M/QA]** Test rank card rendering with various source types
  - Dependencies: Rank card
  - Estimate: 4-8 hours
  - Acceptance: Test paper/spec/video/blog, missing fields, retracted sources

---

### 2.4 Fetch Router & Caching (B2 - Part 2, B10 - Part 1) — 16 tasks

#### Fetch Router

- [ ] **[P1/L/Backend]** Build router with heuristic signals for JS detection
  - Dependencies: Basic fetch, JS fetch skeleton
  - Estimate: 8-16 hours
  - Acceptance: Detect SPA/empty DOM/interstitials, escalate to JS path

- [ ] **[P1/M/Backend]** Implement content quality checker for escalation
  - Dependencies: Router
  - Estimate: 4-8 hours
  - Acceptance: Check extracted content length/structure, retry with JS if insufficient

- [ ] **[P1/M/Backend]** Add domain-based routing overrides
  - Dependencies: Router
  - Estimate: 4-8 hours
  - Acceptance: Maintain whitelist/blacklist for always-JS/never-JS domains

- [ ] **[P1/S/Backend]** Emit routing decision events with reasons
  - Dependencies: Router
  - Estimate: 2-4 hours
  - Acceptance: Log "Chose JS path: empty DOM" or "Chose basic: sufficient content"

#### JS Fetch Budget Management

- [ ] **[P1/M/Backend]** Implement per-run JS budget tracker
  - Dependencies: Run context store
  - Estimate: 4-8 hours
  - Acceptance: Track %JS fetches, cap at configurable limit (e.g., 25%), emit warnings

- [ ] **[P1/M/Backend]** Create JS policy configurations (Auto/Conservative/Aggressive)
  - Dependencies: Budget tracker
  - Estimate: 4-8 hours
  - Acceptance: Auto = dynamic, Conservative = 10%, Aggressive = 50%, user-selectable

- [ ] **[P1/M/Backend]** Build budget guard with soft stop
  - Dependencies: Budget tracker
  - Estimate: 4-8 hours
  - Acceptance: Warn at 80%, stop new JS requests at 100%, actionable summary

#### Advanced Caching

- [ ] **[P1/M/Backend]** Implement multi-tier cache (L1 memory, L2 Redis, L3 S3)
  - Dependencies: Basic cache
  - Estimate: 4-8 hours
  - Acceptance: Read-through, write-through, TTL per layer, metrics per tier

- [ ] **[P1/M/Backend]** Build metadata cache for enrichment
  - Dependencies: Multi-tier cache
  - Estimate: 4-8 hours
  - Acceptance: Cache DOI/URL metadata, 7-day TTL, batch invalidation

- [ ] **[P1/M/Backend]** Implement embeddings cache
  - Dependencies: Multi-tier cache
  - Estimate: 4-8 hours
  - Acceptance: Cache by text hash, no expiration, LRU eviction

- [ ] **[P1/S/Backend]** Add cache warming for common queries
  - Dependencies: Multi-tier cache
  - Estimate: 2-4 hours
  - Acceptance: Cron job to pre-fetch popular docs, configurable warming schedule

#### Circuit Breakers

- [ ] **[P1/M/Backend]** Implement circuit breaker pattern for external services
  - Dependencies: API clients
  - Estimate: 4-8 hours
  - Acceptance: Open after N failures, half-open probe, fallback to cache

- [ ] **[P1/S/Backend]** Add circuit breaker dashboard
  - Dependencies: Circuit breakers
  - Estimate: 2-4 hours
  - Acceptance: Show status per service, manual reset, alert on open circuits

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for router heuristics
  - Dependencies: Router
  - Estimate: 4-8 hours
  - Acceptance: Test various HTML patterns (SPA, empty, well-formed), routing decisions

- [ ] **[P2/M/QA]** Write integration tests for budget enforcement
  - Dependencies: Budget tracker
  - Estimate: 4-8 hours
  - Acceptance: Test cap behavior, policy switching, soft stop

- [ ] **[P2/M/QA]** Test multi-tier cache coherence
  - Dependencies: Multi-tier cache
  - Estimate: 4-8 hours
  - Acceptance: Test L1/L2/L3 consistency, invalidation propagation, TTL

---

### 2.5 Cost & Performance Foundations (B10 - Part 1) — 15 tasks

#### Cost Tracking

- [ ] **[P1/M/Backend]** Implement per-run cost tracker (API calls, tokens, storage)
  - Dependencies: Run context store
  - Estimate: 4-8 hours
  - Acceptance: Track OpenAI tokens, Browserbase minutes, enrichment API calls

- [ ] **[P1/M/Backend]** Build cost estimation for planned tasks
  - Dependencies: Cost tracker, planner
  - Estimate: 4-8 hours
  - Acceptance: Estimate cost before execution, show in UI, warn if over budget

- [ ] **[P1/S/Backend]** Create GET /run/:id/costs API endpoint
  - Dependencies: Cost tracker
  - Estimate: 2-4 hours
  - Acceptance: Return breakdown by service, cumulative total, projections

#### Performance Optimization

- [ ] **[P1/M/Backend]** Implement connection pooling for databases
  - Dependencies: PostgreSQL/Neo4j clients
  - Estimate: 4-8 hours
  - Acceptance: Configure pool sizes, idle timeouts, health checks

- [ ] **[P1/M/Backend]** Add request batching for embeddings API
  - Dependencies: Embeddings API
  - Estimate: 4-8 hours
  - Acceptance: Auto-batch up to 100 docs, configurable flush timeout

- [ ] **[P1/M/Backend]** Implement query result caching with TTL
  - Dependencies: Hybrid retrieval
  - Estimate: 4-8 hours
  - Acceptance: Cache by query hash, 1-hour TTL, invalidate on new docs

- [ ] **[P1/M/Backend]** Add index optimization jobs (vacuum, reindex)
  - Dependencies: OpenSearch/Neo4j
  - Estimate: 4-8 hours
  - Acceptance: Scheduled maintenance, metrics before/after, alert on performance degradation

#### Monitoring & Alerts

- [ ] **[P1/L/Backend]** Set up Prometheus metrics collection
  - Dependencies: Event schema
  - Estimate: 8-16 hours
  - Acceptance: Expose /metrics endpoint, counters/gauges/histograms for latency/cost/cache

- [ ] **[P1/M/Backend]** Create Grafana dashboards for key metrics
  - Dependencies: Prometheus
  - Estimate: 4-8 hours
  - Acceptance: Dashboards for TTFC, Authority Mix, cost, %JS, cache hit rates

- [ ] **[P1/M/Backend]** Configure alerting rules for SLO violations
  - Dependencies: Prometheus
  - Estimate: 4-8 hours
  - Acceptance: Alert on TTFC >120s P95, cost >$X/run, error rate >5%

- [ ] **[P2/M/Backend]** Implement distributed tracing with OpenTelemetry
  - Dependencies: Event schema
  - Estimate: 4-8 hours
  - Acceptance: Trace requests across services, visualize in Jaeger/Zipkin

#### Load Testing

- [ ] **[P2/L/QA]** Create load testing scenarios with k6/Locust
  - Dependencies: All APIs
  - Estimate: 8-16 hours
  - Acceptance: Test 10 concurrent runs, measure latency/throughput, identify bottlenecks

- [ ] **[P2/M/QA]** Run performance benchmarks and establish baselines
  - Dependencies: Load testing
  - Estimate: 4-8 hours
  - Acceptance: Document P50/P95/P99 latencies, throughput, resource usage

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for cost calculations
  - Dependencies: Cost tracker
  - Estimate: 4-8 hours
  - Acceptance: Test token counting, API call pricing, projections

- [ ] **[P2/M/QA]** Test connection pool behavior under load
  - Dependencies: Connection pooling
  - Estimate: 4-8 hours
  - Acceptance: Test pool exhaustion, timeout handling, reconnection

---

## Phase 3: Graph + JS Path (Weeks 7-9) — 93 Tasks

### 3.1 JS Rendering Pipeline (B2 - Part 3) — 22 tasks

#### Browserbase Integration

- [ ] **[P1/L/Backend]** Integrate Browserbase SDK for managed browser sessions
  - Dependencies: Project setup
  - Estimate: 8-16 hours
  - Acceptance: Create/manage sessions, handle session lifecycle, API key configuration

- [ ] **[P1/M/Backend]** Implement session pooling with warm standby
  - Dependencies: Browserbase integration
  - Estimate: 4-8 hours
  - Acceptance: Keep N sessions warm, reuse for requests, configurable pool size

- [ ] **[P1/M/Backend]** Add session timeout and cleanup
  - Dependencies: Session pooling
  - Estimate: 4-8 hours
  - Acceptance: Auto-close after timeout, cleanup on errors, emit session.closed events

#### Stagehand Integration

- [ ] **[P1/L/Backend]** Integrate Stagehand for structured extraction
  - Dependencies: Browserbase integration
  - Estimate: 8-16 hours
  - Acceptance: Navigate pages, extract content with selectors, handle waits/clicks

- [ ] **[P1/M/Backend]** Build playbook registry for site-specific extraction
  - Dependencies: Stagehand integration
  - Estimate: 4-8 hours
  - Acceptance: Store playbooks (selectors, actions) per domain, version control

- [ ] **[P1/M/Backend]** Implement playbook matcher by URL patterns
  - Dependencies: Playbook registry
  - Estimate: 4-8 hours
  - Acceptance: Match domain/path to playbook, fallback to generic extraction

- [ ] **[P1/L/Backend]** Create generic extraction playbook with heuristics
  - Dependencies: Stagehand integration
  - Estimate: 8-16 hours
  - Acceptance: Extract main content, title, metadata using common patterns

#### Site-Specific Playbooks

- [ ] **[P2/L/Backend]** Build playbook for arXiv papers
  - Dependencies: Playbook registry
  - Estimate: 8-16 hours
  - Acceptance: Extract abstract, PDF link, authors, categories

- [ ] **[P2/L/Backend]** Build playbook for GitHub repos
  - Dependencies: Playbook registry
  - Estimate: 8-16 hours
  - Acceptance: Extract README, stars, contributors, recent commits

- [ ] **[P2/L/Backend]** Build playbook for YouTube videos
  - Dependencies: Playbook registry
  - Estimate: 8-16 hours
  - Acceptance: Extract description, channel, view count, transcript link

- [ ] **[P2/M/Backend]** Build playbook for Medium articles
  - Dependencies: Playbook registry
  - Estimate: 4-8 hours
  - Acceptance: Bypass paywall preview, extract full text when possible

- [ ] **[P2/M/Backend]** Build playbook for Stack Overflow
  - Dependencies: Playbook registry
  - Estimate: 4-8 hours
  - Acceptance: Extract question, answers, votes, accepted answer

#### JS Fetch Endpoint

- [ ] **[P1/L/Backend]** Create POST /fetch/js API endpoint
  - Dependencies: Browserbase, Stagehand, playbooks
  - Estimate: 8-16 hours
  - Acceptance: Accept URL, return {status, html, meta, session_id}, emit events

- [ ] **[P1/M/Backend]** Add screenshot capture for debugging
  - Dependencies: /fetch/js endpoint
  - Estimate: 4-8 hours
  - Acceptance: Save screenshot on errors, store in S3, include URL in event

- [ ] **[P1/M/Backend]** Implement retry logic with playbook fallback
  - Dependencies: /fetch/js endpoint
  - Estimate: 4-8 hours
  - Acceptance: Retry with generic playbook if specific fails, max 2 retries

#### Anti-Bot Handling

- [ ] **[P2/M/Backend]** Implement header randomization for bot detection evasion
  - Dependencies: Browserbase integration
  - Estimate: 4-8 hours
  - Acceptance: Rotate User-Agent, Accept-Language, viewport size

- [ ] **[P2/M/Backend]** Add CAPTCHA detection and graceful degradation
  - Dependencies: Stagehand integration
  - Estimate: 4-8 hours
  - Acceptance: Detect CAPTCHA, emit warning event, fallback to cached/basic fetch

- [ ] **[P2/M/Backend]** Implement stealth mode with Puppeteer-extra plugins
  - Dependencies: Browserbase integration
  - Estimate: 4-8 hours
  - Acceptance: Hide automation indicators, pass bot detection tests

#### Testing

- [ ] **[P2/L/QA]** Write integration tests for Browserbase session lifecycle
  - Dependencies: Browserbase integration
  - Estimate: 8-16 hours
  - Acceptance: Test create/reuse/close, timeout handling, pool management

- [ ] **[P2/L/QA]** Test playbooks on real sites (with mocks for CI)
  - Dependencies: Playbooks
  - Estimate: 8-16 hours
  - Acceptance: Verify extraction correctness, handle site changes, mock in CI

- [ ] **[P2/M/QA]** Test JS vs basic fetch quality comparison
  - Dependencies: Router, JS fetch
  - Estimate: 4-8 hours
  - Acceptance: Measure extraction quality delta, validate router decisions

- [ ] **[P2/M/QA]** Test screenshot capture and storage
  - Dependencies: Screenshot feature
  - Estimate: 4-8 hours
  - Acceptance: Verify screenshot saved, S3 upload, correct linking in events

---

### 3.2 Graph Memory (B4 - Part 2) — 28 tasks

#### Neo4j Schema

- [ ] **[P1/M/Backend]** Design graph schema with node types (Concept, Entity, Claim, Source, Note)
  - Dependencies: Neo4j setup
  - Estimate: 4-8 hours
  - Acceptance: Define properties per node type, constraints, indexes

- [ ] **[P1/M/Backend]** Design edge types (SUPPORTED_BY, ABOUT, RELATED_TO, CONTRADICTS, CITES)
  - Dependencies: Schema design
  - Estimate: 4-8 hours
  - Acceptance: Define properties (weight, confidence, timestamp), directionality

- [ ] **[P1/M/Backend]** Create Neo4j constraints and indexes
  - Dependencies: Schema design
  - Estimate: 4-8 hours
  - Acceptance: Unique constraints on IDs, full-text indexes on text properties

#### Claim Extraction

- [ ] **[P1/L/Backend]** Build claim extractor with LLM-based parsing
  - Dependencies: LLM integration
  - Estimate: 8-16 hours
  - Acceptance: Extract atomic claims from text, link to source spans with char offsets

- [ ] **[P1/M/Backend]** Implement entity linker for concepts
  - Dependencies: Claim extractor
  - Estimate: 4-8 hours
  - Acceptance: Link entities to existing Concept nodes, create new if needed

- [ ] **[P1/M/Backend]** Add confidence scoring for extracted claims
  - Dependencies: Claim extractor
  - Estimate: 4-8 hours
  - Acceptance: Use LLM self-consistency or multiple models, score [0,1]

- [ ] **[P1/M/Backend]** Detect claim contradictions using NLI model
  - Dependencies: Claim extractor
  - Estimate: 4-8 hours
  - Acceptance: Compare claim pairs, create CONTRADICTS edges when entailment = contradiction

#### Graph Merge API

- [ ] **[P1/L/Backend]** Implement batch merge with MERGE clauses
  - Dependencies: Schema, claim extraction
  - Estimate: 8-16 hours
  - Acceptance: Upsert nodes/edges, handle duplicates, transactional batches

- [ ] **[P1/M/Backend]** Build POST /graph/merge API endpoint
  - Dependencies: Batch merge
  - Estimate: 4-8 hours
  - Acceptance: Accept {batch: [{nodes, edges}]}, return {created, updated}, ≤200ms P95

- [ ] **[P1/M/Backend]** Add merge conflict resolution (timestamp-based)
  - Dependencies: Batch merge
  - Estimate: 4-8 hours
  - Acceptance: On conflict, keep newer claim or merge metadata

- [ ] **[P1/S/Backend]** Emit graph.merge events with details
  - Dependencies: Merge API
  - Estimate: 2-4 hours
  - Acceptance: Log node/edge counts, affected concepts, merge conflicts

#### Graph Query API

- [ ] **[P1/M/Backend]** Create Cypher query templates for common patterns
  - Dependencies: Schema
  - Estimate: 4-8 hours
  - Acceptance: Templates for shortest path, neighbors, subgraph, community detection

- [ ] **[P1/M/Backend]** Build POST /graph/query API endpoint
  - Dependencies: Cypher templates
  - Estimate: 4-8 hours
  - Acceptance: Accept {cypher|template, params}, return {records}, ≤400ms P95

- [ ] **[P1/M/Backend]** Add query result caching
  - Dependencies: Query API
  - Estimate: 4-8 hours
  - Acceptance: Cache by query hash, 10-minute TTL, invalidate on merges

#### Community Detection

- [ ] **[P1/L/Backend]** Implement Louvain algorithm for community detection
  - Dependencies: Graph query API
  - Estimate: 8-16 hours
  - Acceptance: Run periodically, assign community IDs to nodes, emit community.detected

- [ ] **[P1/M/Backend]** Generate community summaries with LLM
  - Dependencies: Community detection
  - Estimate: 4-8 hours
  - Acceptance: Summarize claims/concepts per community, store in Community nodes

- [ ] **[P1/M/Backend]** Link communities with cross-community edges
  - Dependencies: Community summaries
  - Estimate: 4-8 hours
  - Acceptance: Create RELATED_TO edges between communities, weight by edge density

#### Origin Path Calculation

- [ ] **[P1/M/Backend]** Build origin path calculator using shortestPath
  - Dependencies: Graph query API
  - Estimate: 4-8 hours
  - Acceptance: Find shortest citation/CITES path to origin sources, cache results

- [ ] **[P1/S/Backend]** Add origin path to Claim/Source nodes as property
  - Dependencies: Origin path calculator
  - Estimate: 2-4 hours
  - Acceptance: Store path length, update on graph changes

#### GraphRAG Retrieval

- [ ] **[P1/L/Backend]** Implement graph-guided retrieval with neighbor expansion
  - Dependencies: Hybrid retrieval, graph query API
  - Estimate: 8-16 hours
  - Acceptance: Start with hybrid results, expand to neighbors, re-rank with graph context

- [ ] **[P1/M/Backend]** Add community summary injection for context
  - Dependencies: Community summaries, retrieval
  - Estimate: 4-8 hours
  - Acceptance: Include relevant community summaries in retrieval results

- [ ] **[P1/M/Backend]** Build RRF fusion with graph scores
  - Dependencies: Graph-guided retrieval
  - Estimate: 4-8 hours
  - Acceptance: Fuse BM25 + vector + graph centrality with RRF

- [ ] **[P1/M/Backend]** Create POST /search/graphrag API endpoint
  - Dependencies: GraphRAG retrieval
  - Estimate: 4-8 hours
  - Acceptance: Accept query, return ranked results with graph context, ≤600ms P95

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for claim extraction
  - Dependencies: Claim extractor
  - Estimate: 4-8 hours
  - Acceptance: Test atomic claims, entity linking, confidence scoring

- [ ] **[P2/M/QA]** Write integration tests for graph merge
  - Dependencies: Merge API
  - Estimate: 4-8 hours
  - Acceptance: Test upsert, duplicates, conflicts, transactionality

- [ ] **[P2/M/QA]** Test community detection on synthetic graphs
  - Dependencies: Community detection
  - Estimate: 4-8 hours
  - Acceptance: Verify correct clustering, summary quality, edge linking

- [ ] **[P2/L/QA]** Create GraphRAG retrieval evaluation set
  - Dependencies: GraphRAG retrieval
  - Estimate: 8-16 hours
  - Acceptance: 20+ queries with expected results, measure recall improvement vs hybrid alone

- [ ] **[P2/M/QA]** Test origin path calculation correctness
  - Dependencies: Origin path calculator
  - Estimate: 4-8 hours
  - Acceptance: Test with known citation graphs, verify shortest paths, handle disconnected nodes

---

### 3.3 Pilot View - Frontier Graph (B5 - Part 3) — 18 tasks

#### Graph Visualization

- [ ] **[P1/L/Frontend]** Integrate WebGL graph library (react-force-graph or Sigma.js)
  - Dependencies: React setup
  - Estimate: 8-16 hours
  - Acceptance: Render 1000+ nodes at 60fps, zoom/pan, click interactions

- [ ] **[P1/M/Frontend]** Implement force-directed layout with clustering
  - Dependencies: Graph library
  - Estimate: 4-8 hours
  - Acceptance: Cluster by community, prevent overlap, configurable physics

- [ ] **[P1/M/Frontend]** Add node/edge styling based on type and properties
  - Dependencies: Graph visualization
  - Estimate: 4-8 hours
  - Acceptance: Color by node type, edge width by weight, dashed for CONTRADICTS

#### Interactive Features

- [ ] **[P1/M/Frontend]** Implement node click → detail panel
  - Dependencies: Graph visualization
  - Estimate: 4-8 hours
  - Acceptance: Show node properties, connected edges, supporting claims

- [ ] **[P1/M/Frontend]** Add edge click → relationship details
  - Dependencies: Graph visualization
  - Estimate: 4-8 hours
  - Acceptance: Show edge type, confidence, source claims

- [ ] **[P1/M/Frontend]** Implement search within graph
  - Dependencies: Graph visualization
  - Estimate: 4-8 hours
  - Acceptance: Fuzzy search nodes, highlight matches, zoom to result

- [ ] **[P1/M/Frontend]** Add graph filtering by node/edge types
  - Dependencies: Graph visualization
  - Estimate: 4-8 hours
  - Acceptance: Checkboxes to show/hide types, re-layout on filter

#### Frontier Overlays

- [ ] **[P1/L/Frontend]** Build overlay system with selectable metrics
  - Dependencies: Graph visualization
  - Estimate: 8-16 hours
  - Acceptance: Toggle overlays (core proximity, disagreement, freshness, memory writes)

- [ ] **[P1/M/Frontend]** Implement core proximity overlay with color gradient
  - Dependencies: Overlay system, core proximity API
  - Estimate: 4-8 hours
  - Acceptance: Color nodes by distance to origin (green → red), legend

- [ ] **[P1/M/Frontend]** Implement disagreement overlay with edge highlights
  - Dependencies: Overlay system, contradiction detection
  - Estimate: 4-8 hours
  - Acceptance: Highlight CONTRADICTS edges in red, node intensity by # contradictions

- [ ] **[P1/M/Frontend]** Implement freshness overlay with timestamp heatmap
  - Dependencies: Overlay system
  - Estimate: 4-8 hours
  - Acceptance: Color by recency (new → old), time decay visualization

- [ ] **[P1/M/Frontend]** Implement memory writes overlay with animation
  - Dependencies: Overlay system, graph merge events
  - Estimate: 4-8 hours
  - Acceptance: Animate new nodes/edges, pulse on write, fade over time

#### Performance Optimization

- [ ] **[P2/M/Frontend]** Implement progressive rendering for large graphs
  - Dependencies: Graph visualization
  - Estimate: 4-8 hours
  - Acceptance: Render high-centrality nodes first, stream in rest, LOD

- [ ] **[P2/M/Frontend]** Add graph clustering with detail-on-demand
  - Dependencies: Graph visualization
  - Estimate: 4-8 hours
  - Acceptance: Show clusters as meta-nodes, expand on click, collapse others

#### Testing

- [ ] **[P2/M/QA]** Write tests for graph rendering performance
  - Dependencies: Graph visualization
  - Estimate: 4-8 hours
  - Acceptance: Test 1K, 5K, 10K nodes, measure FPS, identify bottlenecks

- [ ] **[P2/M/QA]** Test graph interactions (click, search, filter)
  - Dependencies: Interactive features
  - Estimate: 4-8 hours
  - Acceptance: E2E tests with Playwright, verify detail panels, search results

- [ ] **[P2/M/QA]** Test overlay rendering correctness
  - Dependencies: Overlays
  - Estimate: 4-8 hours
  - Acceptance: Verify color gradients, edge highlights, legend accuracy

- [ ] **[P2/M/QA]** Test progressive rendering and LOD
  - Dependencies: Progressive rendering
  - Estimate: 4-8 hours
  - Acceptance: Verify rendering order, frame drops, detail-on-demand

---

### 3.4 Reading Queue & Video Pipeline (B7) — 15 tasks

#### Origin Detection

- [ ] **[P1/L/Backend]** Build origin source detector using citation analysis
  - Dependencies: Graph memory, citation graph
  - Estimate: 8-16 hours
  - Acceptance: Identify earliest highly-cited works, store as origin set per topic

- [ ] **[P1/M/Backend]** Implement citation-weighted PageRank for origin scoring
  - Dependencies: Origin detector
  - Estimate: 4-8 hours
  - Acceptance: Rank sources by citation influence, normalize scores

#### Queue Building

- [ ] **[P1/M/Backend]** Enhance queue builder with origin prioritization
  - Dependencies: Origin detector, queue builder
  - Estimate: 4-8 hours
  - Acceptance: Place origin sources first in L0, enforce min origin quota

- [ ] **[P1/M/Backend]** Implement gap detection for missing origin sources
  - Dependencies: Queue builder, origin detector
  - Estimate: 4-8 hours
  - Acceptance: Flag "No origin paper found", suggest searches

- [ ] **[P1/M/Backend]** Add audit trail for queue overrides
  - Dependencies: Queue builder
  - Estimate: 4-8 hours
  - Acceptance: Log user overrides with timestamp/reason, revert option

#### Video Pipeline

- [ ] **[P1/L/Backend]** Build video caption fetcher with multi-language support
  - Dependencies: YouTube API
  - Estimate: 8-16 hours
  - Acceptance: Fetch auto/manual captions, handle unavailable captions, cache results

- [ ] **[P1/M/Backend]** Implement auto-transcription fallback (Whisper API)
  - Dependencies: Caption fetcher
  - Estimate: 4-8 hours
  - Acceptance: Transcribe when captions unavailable, opt-in, configurable quality

- [ ] **[P1/L/Backend]** Build claim-to-caption alignment with semantic search
  - Dependencies: Caption fetcher, claim extraction
  - Estimate: 8-16 hours
  - Acceptance: Match claim text to caption snippets, return timestamps

- [ ] **[P1/M/Backend]** Add video metadata to rank cards
  - Dependencies: Video pipeline, rank card API
  - Estimate: 4-8 hours
  - Acceptance: Include channel, views, duration, claim-linked timestamps

#### UI Integration

- [ ] **[P2/M/Frontend]** Build video preview player with timestamp jump
  - Dependencies: Video metadata
  - Estimate: 4-8 hours
  - Acceptance: Embed YouTube player, click timestamp → jump to claim

- [ ] **[P2/M/Frontend]** Add caption display with claim highlights
  - Dependencies: Video player, caption alignment
  - Estimate: 4-8 hours
  - Acceptance: Show synchronized captions, highlight matching claims

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for origin detection
  - Dependencies: Origin detector
  - Estimate: 4-8 hours
  - Acceptance: Test with synthetic citation graphs, verify origin identification

- [ ] **[P2/L/QA]** Test caption alignment accuracy
  - Dependencies: Caption alignment
  - Estimate: 8-16 hours
  - Acceptance: Manual evaluation on 20+ videos, >80% correct timestamp matches

- [ ] **[P2/M/QA]** Test video player interactions
  - Dependencies: Video player
  - Estimate: 4-8 hours
  - Acceptance: E2E tests with Playwright, verify timestamp jump, caption sync

- [ ] **[P2/M/QA]** Test gap detection with missing origin scenarios
  - Dependencies: Gap detection
  - Estimate: 4-8 hours
  - Acceptance: Verify gap flags for topics without origin sources

---

### 3.5 Advanced Orchestrator Scheduling (B1 - Part 2) — 10 tasks

#### Task Scheduling

- [ ] **[P2/M/Backend]** Implement adaptive scheduling based on resource availability
  - Dependencies: Task executor
  - Estimate: 4-8 hours
  - Acceptance: Adjust parallelism based on CPU/memory, avoid overload

- [ ] **[P2/M/Backend]** Add task priority queuing with preemption
  - Dependencies: Task executor
  - Estimate: 4-8 hours
  - Acceptance: High-priority tasks can preempt low-priority, fair scheduling

- [ ] **[P2/M/Backend]** Implement task retry with exponential backoff
  - Dependencies: Task executor
  - Estimate: 4-8 hours
  - Acceptance: Retry failed tasks, exponential delays, max retries

#### Frontier Advanced Features

- [ ] **[P2/M/Backend]** Add diversity scorer to prevent echo chambers
  - Dependencies: Frontier scoring
  - Estimate: 4-8 hours
  - Acceptance: Penalize concepts similar to recently explored, enforce diversity quota

- [ ] **[P2/M/Backend]** Implement user interest scorer from click/dwell signals
  - Dependencies: Frontier scoring, UI events
  - Estimate: 4-8 hours
  - Acceptance: Boost concepts related to user-clicked sources, decay over time

- [ ] **[P2/M/Backend]** Build frontier visualization API with graph layout
  - Dependencies: Frontier, graph memory
  - Estimate: 4-8 hours
  - Acceptance: GET /frontier/graph returns nodes/edges with positions for rendering

#### Testing

- [ ] **[P2/M/QA]** Write unit tests for adaptive scheduling
  - Dependencies: Adaptive scheduling
  - Estimate: 4-8 hours
  - Acceptance: Test resource-based throttling, preemption, fairness

- [ ] **[P2/M/QA]** Test diversity scoring effectiveness
  - Dependencies: Diversity scorer
  - Estimate: 4-8 hours
  - Acceptance: Measure exploration breadth, verify quota enforcement

- [ ] **[P2/M/QA]** Test user interest scoring from interactions
  - Dependencies: User interest scorer
  - Estimate: 4-8 hours
  - Acceptance: Verify boost from clicks, decay over time, privacy preservation

- [ ] **[P2/M/QA]** Integration test for full orchestrator workflow
  - Dependencies: All orchestrator features
  - Estimate: 4-8 hours
  - Acceptance: Test query → plan → execute → frontier → synthesis, verify determinism

---

## Phase 4: Review + Eval (Weeks 10-12) — 82 Tasks

### 4.1 Review Mode UI (B6) — 32 tasks

#### Snapshot System

- [ ] **[P1/M/Backend]** Design snapshot schema with frontier/queue/graph states
  - Dependencies: Event schema
  - Estimate: 4-8 hours
  - Acceptance: Schema includes run_id/timestamp/knobs/frontier/queue/graph_diff/metrics

- [ ] **[P1/L/Backend]** Build snapshot generator from event stream
  - Dependencies: Snapshot schema, event storage
  - Estimate: 8-16 hours
  - Acceptance: Generate snapshots at key landmarks (first core, contradiction spike, etc.)

- [ ] **[P1/M/Backend]** Implement delta compression for snapshots
  - Dependencies: Snapshot generator
  - Estimate: 4-8 hours
  - Acceptance: Store only diffs from previous snapshot, reduce storage 80%+

- [ ] **[P1/M/Backend]** Add snapshot retention policy
  - Dependencies: Snapshot generator
  - Estimate: 4-8 hours
  - Acceptance: Keep all for 7 days, thin to hourly for 30 days, monthly after

#### Timeline Player

- [ ] **[P1/L/Frontend]** Build timeline scrubber component with landmarks
  - Dependencies: React setup, snapshot API
  - Estimate: 8-16 hours
  - Acceptance: Scrub through run, jump to landmarks, display timestamp/metrics

- [ ] **[P1/M/Frontend]** Implement playback controls (play, pause, speed)
  - Dependencies: Timeline scrubber
  - Estimate: 4-8 hours
  - Acceptance: Auto-advance through snapshots, configurable speed (1x-10x)

- [ ] **[P1/M/Frontend]** Add landmark markers (first core, cost inflection, etc.)
  - Dependencies: Timeline scrubber
  - Estimate: 4-8 hours
  - Acceptance: Visual markers on timeline, click to jump, tooltip descriptions

- [ ] **[P1/L/Backend]** Create GET /run/:id/snapshots API endpoint
  - Dependencies: Snapshot generator
  - Estimate: 8-16 hours
  - Acceptance: Return snapshots with pagination, accept landmark filter, ≤2s P95

#### KPI Dashboard

- [ ] **[P1/L/Backend]** Implement TTFC calculator from event stream
  - Dependencies: Event schema
  - Estimate: 8-16 hours
  - Acceptance: Find first fetch.complete for L0/L1 source, emit metric

- [ ] **[P1/M/Backend]** Implement Authority Mix calculator
  - Dependencies: Queue builder, events
  - Estimate: 4-8 hours
  - Acceptance: Calculate % of consumed sources in each L0-L4 tier

- [ ] **[P1/M/Backend]** Implement Evidence Robustness scorer
  - Dependencies: Claim extraction, graph
  - Estimate: 4-8 hours
  - Acceptance: Count independent sources per claim, average across claims

- [ ] **[P1/M/Backend]** Implement Frontier Entropy calculator
  - Dependencies: Frontier scoring
  - Estimate: 4-8 hours
  - Acceptance: Shannon entropy of concept scores, track changes over time

- [ ] **[P1/M/Backend]** Implement Contradiction Density metric
  - Dependencies: Contradiction detection, graph
  - Estimate: 4-8 hours
  - Acceptance: # CONTRADICTS edges / total edges, highlight spikes

- [ ] **[P1/M/Backend]** Implement operational metrics (latency, tokens, %JS, cache hit)
  - Dependencies: Cost tracker, cache metrics
  - Estimate: 4-8 hours
  - Acceptance: Aggregate from events, P50/P95 latencies, totals

- [ ] **[P1/L/Backend]** Create GET /run/:id/metrics API endpoint
  - Dependencies: All KPI calculators
  - Estimate: 8-16 hours
  - Acceptance: Return all metrics, accept time range, pre-computed for speed

- [ ] **[P1/L/Frontend]** Build KPI dashboard with time-series charts
  - Dependencies: Metrics API
  - Estimate: 8-16 hours
  - Acceptance: Line charts for TTFC/entropy/etc., bar chart for Authority Mix, Recharts/D3

- [ ] **[P1/M/Frontend]** Add KPI comparison view (actual vs. target)
  - Dependencies: KPI dashboard
  - Estimate: 4-8 hours
  - Acceptance: Show target thresholds, color-code pass/fail, % delta

#### Evidence Ledger

- [ ] **[P1/L/Frontend]** Build evidence ledger table with claims
  - Dependencies: Claim extraction, graph
  - Estimate: 8-16 hours
  - Acceptance: Table with claim/confidence/sources/quotes, sortable, filterable

- [ ] **[P1/M/Frontend]** Add source drilldown with quote highlighting
  - Dependencies: Evidence ledger
  - Estimate: 4-8 hours
  - Acceptance: Click source → modal with full text, highlight quoted spans

- [ ] **[P1/M/Frontend]** Show claim confidence with visual indicators
  - Dependencies: Evidence ledger
  - Estimate: 4-8 hours
  - Acceptance: Color-coded confidence (red/yellow/green), tooltip with reasoning

- [ ] **[P1/M/Frontend]** Add claim filtering by topic/confidence/source count
  - Dependencies: Evidence ledger
  - Estimate: 4-8 hours
  - Acceptance: Multi-select filters, instant search, URL sync

#### Learning Map

- [ ] **[P1/L/Backend]** Calculate graph diff between run start and end
  - Dependencies: Graph memory
  - Estimate: 8-16 hours
  - Acceptance: Compute added/removed/changed nodes/edges, summary stats

- [ ] **[P1/M/Backend]** Generate community summary diffs
  - Dependencies: Community detection, graph diff
  - Estimate: 4-8 hours
  - Acceptance: Show new communities, changed summaries, highlight key changes

- [ ] **[P1/L/Frontend]** Build learning map visualization with diff highlighting
  - Dependencies: Graph diff API
  - Estimate: 8-16 hours
  - Acceptance: Graph with added nodes in green, removed in red, changed in yellow

- [ ] **[P1/M/Frontend]** Add timeline slider for learning map
  - Dependencies: Learning map
  - Estimate: 4-8 hours
  - Acceptance: Scrub through run to see graph growth, synchronized with timeline player

#### Run Summary

- [ ] **[P1/L/Backend]** Build LLM-based run summarizer
  - Dependencies: Event stream, graph diff, metrics
  - Estimate: 8-16 hours
  - Acceptance: Generate 1-2 page narrative summary, key findings, recommendations

- [ ] **[P1/M/Backend]** Create POST /run/:id/summarize API endpoint
  - Dependencies: Run summarizer
  - Estimate: 4-8 hours
  - Acceptance: Accept run_id, return markdown summary, cache result

- [ ] **[P1/M/Frontend]** Display run summary with markdown rendering
  - Dependencies: Summary API
  - Estimate: 4-8 hours
  - Acceptance: Render with react-markdown, sections for findings/metrics/recommendations

#### Exports

- [ ] **[P1/M/Backend]** Build JSONL export with full event stream
  - Dependencies: Event storage
  - Estimate: 4-8 hours
  - Acceptance: Download all events as .jsonl, gzipped, checksum included

- [ ] **[P1/M/Backend]** Build CSV export for claims and sources
  - Dependencies: Graph memory
  - Estimate: 4-8 hours
  - Acceptance: Export claims with sources/confidence/timestamps as .csv

- [ ] **[P1/M/Backend]** Build GraphML export for graph visualization tools
  - Dependencies: Graph memory
  - Estimate: 4-8 hours
  - Acceptance: Export graph in GraphML format, importable to Gephi/Cytoscape

- [ ] **[P1/L/Backend]** Build PDF export with executive brief
  - Dependencies: Run summary, metrics
  - Estimate: 8-16 hours
  - Acceptance: Generate PDF with summary/charts/ledger, branded template

#### A/B Comparator

- [ ] **[P1/L/Frontend]** Build A/B comparison view with synchronized timelines
  - Dependencies: Timeline player
  - Estimate: 8-16 hours
  - Acceptance: Side-by-side run playback, synchronized scrubbing

- [ ] **[P1/M/Frontend]** Add metric delta highlighting in comparison
  - Dependencies: A/B view, metrics
  - Estimate: 4-8 hours
  - Acceptance: Show % difference for TTFC/Authority Mix/etc., color-coded improvement

---

### 4.2 Evaluation Framework (B11) — 20 tasks

#### Golden Tasks

- [ ] **[P1/L/QA]** Create golden task corpus with 50+ queries
  - Dependencies: Project setup
  - Estimate: 8-16 hours
  - Acceptance: Diverse topics, expected sources/claims, difficulty levels

- [ ] **[P1/M/QA]** Annotate golden tasks with relevance labels (0-3)
  - Dependencies: Golden corpus
  - Estimate: 4-8 hours
  - Acceptance: Human ratings for source relevance, claim correctness

- [ ] **[P1/M/Backend]** Build golden task runner with automated evaluation
  - Dependencies: Golden corpus
  - Estimate: 4-8 hours
  - Acceptance: Run tasks end-to-end, compare results to expected, emit scores

#### RAGAS Evaluation

- [ ] **[P1/L/Backend]** Integrate RAGAS library for RAG evaluation
  - Dependencies: Project setup
  - Estimate: 8-16 hours
  - Acceptance: Calculate faithfulness, answer relevancy, context precision/recall

- [ ] **[P1/M/Backend]** Implement faithfulness scorer with quote verification
  - Dependencies: RAGAS integration
  - Estimate: 4-8 hours
  - Acceptance: Check synthesis quotes exist in sources, no hallucinations

- [ ] **[P1/M/Backend]** Implement context precision scorer
  - Dependencies: RAGAS integration
  - Estimate: 4-8 hours
  - Acceptance: Measure % relevant chunks in retrieved context

- [ ] **[P1/M/Backend]** Implement context recall scorer
  - Dependencies: RAGAS integration
  - Estimate: 4-8 hours
  - Acceptance: Measure % ground truth info present in retrieved context

- [ ] **[P1/M/Backend]** Implement answer relevancy scorer
  - Dependencies: RAGAS integration
  - Estimate: 4-8 hours
  - Acceptance: Measure synthesis relevance to original query

#### Claim-Level Evaluation

- [ ] **[P1/L/Backend]** Build LLM-as-judge for claim verification
  - Dependencies: Claim extraction
  - Estimate: 8-16 hours
  - Acceptance: Judge if claim is supported by linked source, score 0-1

- [ ] **[P1/M/Backend]** Implement evidence link checker
  - Dependencies: Claim extraction, graph
  - Estimate: 4-8 hours
  - Acceptance: Verify SUPPORTED_BY edges point to valid source spans

- [ ] **[P1/M/Backend]** Build claim contradiction detector
  - Dependencies: Claim extraction, NLI model
  - Estimate: 4-8 hours
  - Acceptance: Find contradicting claims, verify CONTRADICTS edges

#### A/B Testing Infrastructure

- [ ] **[P1/L/Backend]** Build A/B experiment framework with run variants
  - Dependencies: Orchestrator, run context
  - Estimate: 8-16 hours
  - Acceptance: Configure variants (knobs, components), assign runs to variants

- [ ] **[P1/M/Backend]** Implement statistical significance testing
  - Dependencies: A/B framework
  - Estimate: 4-8 hours
  - Acceptance: T-tests for metric deltas, confidence intervals, p-values

- [ ] **[P1/M/Backend]** Build Pareto front calculator for multi-objective optimization
  - Dependencies: A/B framework
  - Estimate: 4-8 hours
  - Acceptance: Find non-dominated variants on quality/cost/speed axes

- [ ] **[P1/L/Frontend]** Build A/B experiment dashboard
  - Dependencies: A/B framework, metrics
  - Estimate: 8-16 hours
  - Acceptance: Show variants, metrics, significance, Pareto front visualization

#### CI Integration

- [ ] **[P1/M/Backend]** Integrate evaluation into CI pipeline
  - Dependencies: Golden task runner, RAGAS
  - Estimate: 4-8 hours
  - Acceptance: Run evals on PR, block merge if regression, post results as comment

- [ ] **[P1/M/Backend]** Set regression thresholds for key metrics
  - Dependencies: CI integration
  - Estimate: 4-8 hours
  - Acceptance: Fail if RAGAS score drops >5%, TTFC increases >20%

#### Reporting

- [ ] **[P1/M/Backend]** Build weekly evaluation report generator
  - Dependencies: All evaluation components
  - Estimate: 4-8 hours
  - Acceptance: Email/Slack summary of metrics, regressions, A/B results

- [ ] **[P1/S/Backend]** Add alert system for evaluation failures
  - Dependencies: CI integration
  - Estimate: 2-4 hours
  - Acceptance: Slack/PagerDuty alert on regression, include failed task details

#### Testing

- [ ] **[P2/M/QA]** Test golden task runner with known-good tasks
  - Dependencies: Golden task runner
  - Estimate: 4-8 hours
  - Acceptance: Verify scoring accuracy, handle edge cases, performance

---

### 4.3 Security & Compliance (B9) — 18 tasks

#### Robots.txt & ToS Compliance

- [ ] **[P1/M/Backend]** Enhance robots.txt parser with crawl-delay enforcement
  - Dependencies: Robots parser (Phase 1)
  - Estimate: 4-8 hours
  - Acceptance: Respect all robots.txt rules, log violations, configurable strict mode

- [ ] **[P1/M/Backend]** Build domain policy registry (allowed/blocked/rate limits)
  - Dependencies: Robots parser
  - Estimate: 4-8 hours
  - Acceptance: Per-domain rules, override robots.txt if stricter, audit log

- [ ] **[P1/M/Backend]** Implement User-Agent identification in all requests
  - Dependencies: HTTP client
  - Estimate: 4-8 hours
  - Acceptance: Custom User-Agent with contact email, version, respect site-specific UA rules

#### PII Minimization

- [ ] **[P1/M/Backend]** Build PII detector for content screening
  - Dependencies: Extraction pipeline
  - Estimate: 4-8 hours
  - Acceptance: Detect emails/phone/SSN/credit cards, redact or flag, configurable sensitivity

- [ ] **[P1/M/Backend]** Implement PII redaction in storage
  - Dependencies: PII detector, storage
  - Estimate: 4-8 hours
  - Acceptance: Auto-redact before storing, maintain redaction audit log

- [ ] **[P1/M/Backend]** Add consent tracking for user data
  - Dependencies: Project setup
  - Estimate: 4-8 hours
  - Acceptance: Store consent preferences, enforce data usage restrictions

#### Encryption & Secrets

- [ ] **[P1/M/Backend]** Implement encryption at rest for sensitive data
  - Dependencies: Storage
  - Estimate: 4-8 hours
  - Acceptance: Encrypt user data, PII, API keys with AES-256, key rotation

- [ ] **[P1/M/Backend]** Set up secrets vault (AWS Secrets Manager / HashiCorp Vault)
  - Dependencies: Project setup
  - Estimate: 4-8 hours
  - Acceptance: Store API keys in vault, auto-rotation, access logging

- [ ] **[P1/S/Backend]** Enforce TLS 1.3 for all external connections
  - Dependencies: HTTP client
  - Estimate: 2-4 hours
  - Acceptance: Reject TLS <1.3, verify certificates, pin critical CAs

#### RBAC & Multi-Tenancy

- [ ] **[P1/L/Backend]** Design role-based access control schema
  - Dependencies: Project setup
  - Estimate: 8-16 hours
  - Acceptance: Roles (Admin/Researcher/Viewer), permissions matrix, workspace isolation

- [ ] **[P1/M/Backend]** Implement authentication middleware with JWT
  - Dependencies: RBAC schema
  - Estimate: 4-8 hours
  - Acceptance: Validate JWT on all protected endpoints, refresh token support

- [ ] **[P1/M/Backend]** Build authorization checks for all API endpoints
  - Dependencies: RBAC, auth middleware
  - Estimate: 4-8 hours
  - Acceptance: Check permissions before action, return 403 on unauthorized, audit log

- [ ] **[P1/M/Backend]** Implement workspace isolation with row-level security
  - Dependencies: RBAC
  - Estimate: 4-8 hours
  - Acceptance: Users see only their workspace data, enforce in DB queries

#### Audit Logging

- [ ] **[P1/M/Backend]** Build comprehensive audit log for all actions
  - Dependencies: Event schema
  - Estimate: 4-8 hours
  - Acceptance: Log user/action/resource/timestamp, immutable append-only, tamper detection

- [ ] **[P1/M/Backend]** Implement audit log viewer with filtering
  - Dependencies: Audit log
  - Estimate: 4-8 hours
  - Acceptance: Search by user/action/time, export, retention policy enforcement

#### Data Retention & Deletion

- [ ] **[P1/M/Backend]** Implement configurable data retention policies
  - Dependencies: Storage
  - Estimate: 4-8 hours
  - Acceptance: Auto-delete after TTL, preserve audit logs, configurable per data type

- [ ] **[P1/M/Backend]** Build user data export API (GDPR compliance)
  - Dependencies: Storage
  - Estimate: 4-8 hours
  - Acceptance: Export all user data in portable format, checksum verification

- [ ] **[P1/M/Backend]** Build user data deletion API (right to be forgotten)
  - Dependencies: Storage
  - Estimate: 4-8 hours
  - Acceptance: Hard delete all user data, cascade to related records, confirmation email

#### Testing

- [ ] **[P2/M/QA]** Test RBAC with permission matrix scenarios
  - Dependencies: RBAC
  - Estimate: 4-8 hours
  - Acceptance: Test all role/permission combos, verify 403s, audit log correctness

---

### 4.4 Cost & Performance (B10 - Part 2) — 12 tasks

#### Budget Enforcement

- [ ] **[P1/M/Backend]** Implement soft stop at 80% budget
  - Dependencies: Budget tracker
  - Estimate: 4-8 hours
  - Acceptance: Warn user, show cost breakdown, option to continue or stop

- [ ] **[P1/M/Backend]** Implement hard stop at 100% budget
  - Dependencies: Budget tracker
  - Estimate: 4-8 hours
  - Acceptance: Block new tasks, complete in-progress, generate actionable summary

- [ ] **[P1/M/Backend]** Add budget projection based on current trajectory
  - Dependencies: Budget tracker
  - Estimate: 4-8 hours
  - Acceptance: Estimate final cost if run continues, show in UI, update every 30s

#### Advanced Caching

- [ ] **[P1/M/Backend]** Implement query result materialization for common queries
  - Dependencies: Hybrid retrieval
  - Estimate: 4-8 hours
  - Acceptance: Pre-compute and cache popular queries, refresh nightly

- [ ] **[P1/M/Backend]** Build adaptive TTL based on access patterns
  - Dependencies: Multi-tier cache
  - Estimate: 4-8 hours
  - Acceptance: Increase TTL for frequently accessed items, decrease for cold items

- [ ] **[P1/M/Backend]** Implement cache prewarming on deployment
  - Dependencies: Multi-tier cache
  - Estimate: 4-8 hours
  - Acceptance: Load hot data into cache on startup, minimize cold start latency

#### Performance Tuning

- [ ] **[P1/M/Backend]** Optimize database queries with EXPLAIN analysis
  - Dependencies: PostgreSQL/Neo4j
  - Estimate: 4-8 hours
  - Acceptance: Identify slow queries, add indexes, rewrite for efficiency

- [ ] **[P1/M/Backend]** Implement query batching for graph operations
  - Dependencies: Graph memory
  - Estimate: 4-8 hours
  - Acceptance: Batch merge/query operations, reduce round trips

- [ ] **[P1/M/Backend]** Add request coalescing for duplicate in-flight requests
  - Dependencies: Fetch coordinator
  - Estimate: 4-8 hours
  - Acceptance: Deduplicate concurrent requests, share result, reduce load

#### Monitoring Enhancements

- [ ] **[P2/M/Backend]** Add detailed latency breakdowns per pipeline stage
  - Dependencies: Event schema, metrics
  - Estimate: 4-8 hours
  - Acceptance: Measure fetch/extract/index/retrieve/synthesize separately

- [ ] **[P2/M/Backend]** Build slow query log and automatic alerting
  - Dependencies: Monitoring
  - Estimate: 4-8 hours
  - Acceptance: Log queries >1s, alert on patterns, include EXPLAIN plans

#### Testing

- [ ] **[P2/L/QA]** Run stress tests with high concurrency
  - Dependencies: All systems
  - Estimate: 8-16 hours
  - Acceptance: Test 50 concurrent runs, measure degradation, identify bottlenecks

---

## Cross-Cutting Concerns (45+ tasks)

### Testing Strategy — 15 tasks

#### Unit Testing

- [ ] **[P1/L/QA]** Achieve >80% unit test coverage for backend
  - Dependencies: All backend features
  - Estimate: 8-16 hours
  - Acceptance: Jest/Vitest coverage report, focus on business logic

- [ ] **[P1/L/QA]** Achieve >70% unit test coverage for frontend
  - Dependencies: All frontend features
  - Estimate: 8-16 hours
  - Acceptance: React Testing Library, test components and hooks

- [ ] **[P2/M/QA]** Write property-based tests for critical algorithms
  - Dependencies: Scoring, ranking, extraction
  - Estimate: 4-8 hours
  - Acceptance: Use fast-check/jsverify, test invariants and edge cases

#### Integration Testing

- [ ] **[P1/L/QA]** Build integration test suite for API endpoints
  - Dependencies: All API endpoints
  - Estimate: 8-16 hours
  - Acceptance: Test happy paths and error cases, use test database

- [ ] **[P1/L/QA]** Write integration tests for pipeline workflows
  - Dependencies: Fetch, extract, index, retrieve pipelines
  - Estimate: 8-16 hours
  - Acceptance: Test end-to-end data flow, verify events emitted

- [ ] **[P2/M/QA]** Test external integrations with mocks and contract tests
  - Dependencies: External API clients
  - Estimate: 4-8 hours
  - Acceptance: Use Pact/WireMock, verify API contracts, isolate failures

#### E2E Testing

- [ ] **[P1/L/QA]** Build E2E test suite with Playwright
  - Dependencies: Full UI + backend
  - Estimate: 8-16 hours
  - Acceptance: Test user journeys (run, review, export), visual regression

- [ ] **[P2/M/QA]** Add cross-browser testing (Chrome, Firefox, Safari)
  - Dependencies: E2E suite
  - Estimate: 4-8 hours
  - Acceptance: Run E2E on all browsers, fix compatibility issues

- [ ] **[P2/M/QA]** Test accessibility with axe-core
  - Dependencies: E2E suite
  - Estimate: 4-8 hours
  - Acceptance: Verify WCAG 2.1 AA compliance, fix violations

#### Performance Testing

- [ ] **[P2/L/QA]** Build load testing suite with k6
  - Dependencies: All APIs
  - Estimate: 8-16 hours
  - Acceptance: Test 10/50/100 concurrent users, measure latency/throughput

- [ ] **[P2/M/QA]** Run soak tests for memory leaks
  - Dependencies: Load testing
  - Estimate: 4-8 hours
  - Acceptance: 24-hour test run, monitor memory/CPU, no degradation

- [ ] **[P2/M/QA]** Test cache warming effectiveness
  - Dependencies: Caching layers
  - Estimate: 4-8 hours
  - Acceptance: Measure cold vs warm start latency, >50% improvement

#### Chaos Testing

- [ ] **[P2/L/QA]** Implement chaos engineering scenarios (service failures)
  - Dependencies: All services
  - Estimate: 8-16 hours
  - Acceptance: Test graceful degradation, circuit breakers, retries

- [ ] **[P2/M/QA]** Test database failover and recovery
  - Dependencies: PostgreSQL/Neo4j/OpenSearch
  - Estimate: 4-8 hours
  - Acceptance: Simulate failures, verify auto-recovery, no data loss

#### Test Automation

- [ ] **[P1/M/QA]** Set up CI for automated test execution on PRs
  - Dependencies: Test suites
  - Estimate: 4-8 hours
  - Acceptance: Run unit/integration/E2E on every PR, block merge on failures

---

### Documentation — 15 tasks

#### API Documentation

- [ ] **[P1/L/Docs]** Generate OpenAPI spec for all REST endpoints
  - Dependencies: All API endpoints
  - Estimate: 8-16 hours
  - Acceptance: Complete OpenAPI 3.0 spec, types, examples, error codes

- [ ] **[P1/M/Docs]** Build interactive API docs with Swagger UI / Redoc
  - Dependencies: OpenAPI spec
  - Estimate: 4-8 hours
  - Acceptance: Hosted docs, try-it-out functionality, examples

- [ ] **[P1/M/Docs]** Document event schema with examples
  - Dependencies: Event schema
  - Estimate: 4-8 hours
  - Acceptance: Markdown doc with all event types, fields, sample JSONs

#### Developer Guides

- [ ] **[P1/L/Docs]** Write architecture overview document
  - Dependencies: System design
  - Estimate: 8-16 hours
  - Acceptance: Diagrams, component descriptions, data flows, design decisions

- [ ] **[P1/M/Docs]** Create development setup guide
  - Dependencies: Project setup
  - Estimate: 4-8 hours
  - Acceptance: Step-by-step setup, prerequisites, troubleshooting, Docker Compose

- [ ] **[P1/M/Docs]** Write contribution guidelines
  - Dependencies: Project setup
  - Estimate: 4-8 hours
  - Acceptance: Code style, PR process, testing requirements, review checklist

- [ ] **[P2/M/Docs]** Document all configuration options
  - Dependencies: Config system
  - Estimate: 4-8 hours
  - Acceptance: Markdown table with env vars, defaults, validation, examples

#### User Guides

- [ ] **[P1/L/Docs]** Write user manual for Pilot View
  - Dependencies: Pilot View UI
  - Estimate: 8-16 hours
  - Acceptance: Step-by-step workflows, screenshots, tooltips, FAQs

- [ ] **[P1/M/Docs]** Write user manual for Review Mode
  - Dependencies: Review Mode UI
  - Estimate: 4-8 hours
  - Acceptance: Replay guide, metric explanations, export formats

- [ ] **[P1/M/Docs]** Create video tutorials for key workflows
  - Dependencies: UI complete
  - Estimate: 4-8 hours
  - Acceptance: 5-10 min screencasts for onboarding, advanced features

#### Operational Guides

- [ ] **[P1/M/Docs]** Write deployment runbook
  - Dependencies: DevOps setup
  - Estimate: 4-8 hours
  - Acceptance: Step-by-step deployment, rollback, scaling, monitoring

- [ ] **[P1/M/Docs]** Create incident response playbook
  - Dependencies: Monitoring, alerting
  - Estimate: 4-8 hours
  - Acceptance: Triage steps, common issues, escalation paths, contacts

- [ ] **[P1/M/Docs]** Document backup and recovery procedures
  - Dependencies: Backup setup
  - Estimate: 4-8 hours
  - Acceptance: Backup schedule, restore steps, disaster recovery, RTO/RPO

#### Compliance Documentation

- [ ] **[P1/M/Docs]** Write data processing agreement (DPA)
  - Dependencies: Security implementation
  - Estimate: 4-8 hours
  - Acceptance: Legal-reviewed DPA, GDPR compliance, data retention policies

- [ ] **[P1/M/Docs]** Create Terms of Service for platform usage
  - Dependencies: Security implementation
  - Estimate: 4-8 hours
  - Acceptance: Legal-reviewed ToS, rate limits, acceptable use, liability

---

### DevOps & Deployment — 15 tasks

#### Containerization

- [ ] **[P1/L/DevOps]** Create production Dockerfiles for all services
  - Dependencies: All backend services
  - Estimate: 8-16 hours
  - Acceptance: Multi-stage builds, minimal images, security scanning

- [ ] **[P1/M/DevOps]** Build Docker Compose for local development
  - Dependencies: Dockerfiles
  - Estimate: 4-8 hours
  - Acceptance: All services orchestrated, hot reload, persistent volumes

- [ ] **[P1/M/DevOps]** Set up container registry (ECR / GCR / Docker Hub)
  - Dependencies: Dockerfiles
  - Estimate: 4-8 hours
  - Acceptance: Automated image builds, tagging, vulnerability scanning

#### Kubernetes Deployment

- [ ] **[P1/L/DevOps]** Create Kubernetes manifests (Deployments, Services, ConfigMaps)
  - Dependencies: Dockerfiles
  - Estimate: 8-16 hours
  - Acceptance: K8s yamls for all services, resource limits, health checks

- [ ] **[P1/M/DevOps]** Set up Helm charts for parameterized deployments
  - Dependencies: K8s manifests
  - Estimate: 4-8 hours
  - Acceptance: Helm charts with values for dev/staging/prod

- [ ] **[P1/M/DevOps]** Configure Ingress for external access
  - Dependencies: K8s setup
  - Estimate: 4-8 hours
  - Acceptance: NGINX Ingress with TLS, rate limiting, path routing

- [ ] **[P1/M/DevOps]** Set up persistent volumes for databases
  - Dependencies: K8s setup
  - Estimate: 4-8 hours
  - Acceptance: StatefulSets for Neo4j/PostgreSQL, backup snapshots

#### CI/CD Pipeline

- [ ] **[P1/L/DevOps]** Build CI/CD pipeline with GitHub Actions / GitLab CI
  - Dependencies: Dockerfiles, tests
  - Estimate: 8-16 hours
  - Acceptance: Automated build/test/deploy on PR/merge, environment promotion

- [ ] **[P1/M/DevOps]** Implement blue-green deployment strategy
  - Dependencies: K8s setup, CI/CD
  - Estimate: 4-8 hours
  - Acceptance: Zero-downtime deployments, instant rollback

- [ ] **[P1/M/DevOps]** Add database migration automation to CI/CD
  - Dependencies: CI/CD pipeline
  - Estimate: 4-8 hours
  - Acceptance: Run migrations on deploy, rollback on failure

#### Monitoring & Logging

- [ ] **[P1/L/DevOps]** Deploy centralized logging with ELK / Loki
  - Dependencies: K8s setup
  - Estimate: 8-16 hours
  - Acceptance: Aggregate logs from all pods, searchable, retention policy

- [ ] **[P1/M/DevOps]** Set up distributed tracing with Jaeger
  - Dependencies: OpenTelemetry integration
  - Estimate: 4-8 hours
  - Acceptance: Visualize traces across services, identify bottlenecks

- [ ] **[P1/M/DevOps]** Configure alerting with PagerDuty / Opsgenie
  - Dependencies: Prometheus, alerting rules
  - Estimate: 4-8 hours
  - Acceptance: Route alerts to on-call, escalation policies, acknowledgment

#### Backup & DR

- [ ] **[P1/M/DevOps]** Implement automated database backups
  - Dependencies: Databases
  - Estimate: 4-8 hours
  - Acceptance: Daily backups to S3, 30-day retention, encrypted

- [ ] **[P1/M/DevOps]** Test disaster recovery procedures
  - Dependencies: Backups
  - Estimate: 4-8 hours
  - Acceptance: Restore from backup, verify data integrity, document RTO/RPO

---

## Exit Criteria Checklist

### MVP Exit Criteria (Phases 1-2)

- [ ] **TTFC** ≤ 120s P95 for core-first runs
- [ ] **Authority Mix** ≥ 50% L0/L1 sources consumed
- [ ] **Non-JS pipeline** operational with Trafilatura + Turndown
- [ ] **Basic Pilot View** with controls, live log, reading queue
- [ ] **Event logging** functional with durable storage
- [ ] **Hybrid retrieval** with BM25 + dense vectors
- [ ] **Ranking system** with why-ranked explanations
- [ ] **Cost tracking** with budget warnings
- [ ] **Caching layers** with ≥40% hit rate
- [ ] **Unit test coverage** ≥80% for critical paths

### V1 Exit Criteria (Phases 1-4)

- [ ] **TTFC** ≤ 90s P95
- [ ] **Authority Mix** ≥ 60% L0/L1
- [ ] **Evidence Robustness** ≥ 2.0 independent sources per claim
- [ ] **JS path** operational with ≤25% usage
- [ ] **Full Review Mode** with timeline replay, KPI dashboard, exports
- [ ] **Graph memory** with GraphRAG retrieval
- [ ] **Community detection** and summaries
- [ ] **Reading queue** with L0-L4 classification and gap detection
- [ ] **Evaluation framework** with golden tasks and RAGAS
- [ ] **RBAC** and audit logging
- [ ] **Production deployment** with monitoring and backups

### V1.5 Roadmap (Future)

- [ ] Watch the Act pipeline with caption alignment
- [ ] A/B comparator with synchronized timelines
- [ ] Attribution analytics and citation provenance
- [ ] Advanced macros (Contradiction Hunt, Origin Trace)
- [ ] Multi-language support for captions
- [ ] Failure autopsy with root cause analysis

### V2 Roadmap (Future)

- [ ] Advanced GraphRAG with hierarchical reasoning
- [ ] Team multi-tenancy with workspace isolation
- [ ] Real-time collaboration features
- [ ] Mobile-optimized UI
- [ ] Plugin system for custom extractors/rankers
- [ ] Federated search across external sources

---

## Risk Mitigation Tasks

### Over-Rendering Mitigation (B2, B10)

- [ ] **[P1/M/Backend]** Enforce JS budget with hard caps
- [ ] **[P1/M/Backend]** Optimize router to prefer basic fetch
- [ ] **[P2/M/Backend]** Add JS cost alerts and dashboards

### Source Bias Mitigation (B3)

- [ ] **[P1/M/Backend]** Implement diversity weighting in ranking
- [ ] **[P1/M/Backend]** Add independence scorer to penalize overlaps
- [ ] **[P2/M/Backend]** Monitor Authority Mix distribution

### Fragile Extraction Mitigation (B2)

- [ ] **[P1/M/Backend]** Build playbook registry for common sites
- [ ] **[P1/M/Backend]** Implement retry with fallback extractors
- [ ] **[P2/M/Backend]** Add extraction quality monitoring

### LLM Hallucination Mitigation (B4, B11)

- [ ] **[P1/M/Backend]** Use strict evidence-first prompting
- [ ] **[P1/M/Backend]** Implement quote hashing for verification
- [ ] **[P1/M/Backend]** Add contradiction checks between claims
- [ ] **[P2/L/QA]** Build faithfulness evaluation with RAGAS

---

## Open Questions & Investigation Tasks

### Architecture Decisions

- [ ] **[P1/M/Backend]** Evaluate Neo4j vs Memgraph for graph memory
  - Estimate: 4-8 hours
  - Acceptance: Performance benchmarks, cost comparison, recommendation

- [ ] **[P1/M/Backend]** Evaluate OpenSearch vs Elasticsearch vs Qdrant
  - Estimate: 4-8 hours
  - Acceptance: Feature comparison, licensing, hybrid search performance

- [ ] **[P1/M/Backend]** Decide on monolith vs microservices architecture
  - Estimate: 4-8 hours
  - Acceptance: Pros/cons analysis, team size consideration, recommendation

### Performance Unknowns

- [ ] **[P2/M/Backend]** Benchmark hybrid retrieval at scale (1M+ docs)
  - Estimate: 4-8 hours
  - Acceptance: Latency and recall measurements, index optimization recommendations

- [ ] **[P2/M/Backend]** Test graph query performance with 100K+ nodes
  - Estimate: 4-8 hours
  - Acceptance: Cypher query optimization, index tuning, sharding strategy

### Integration Unknowns

- [ ] **[P2/M/Backend]** Verify Browserbase rate limits and pricing
  - Estimate: 2-4 hours
  - Acceptance: Documented limits, cost model, alert thresholds

- [ ] **[P2/M/Backend]** Test Stagehand reliability on difficult sites
  - Estimate: 4-8 hours
  - Acceptance: Failure rate analysis, fallback strategies, playbook priorities

---

**End of TODO List**

**Summary:**
- **Total Tasks**: 406
- **Phases**: 4 (Foundations, Core Search + Ranking, Graph + JS Path, Review + Eval)
- **Estimated Duration**: 7-28 weeks (team size dependent)
- **Coverage**: All 12 feature PRDs (B1-B12), infrastructure, testing, documentation, operations

**Next Steps:**
1. Review and prioritize tasks based on team capacity
2. Assign owners to Phase 1 foundation tasks
3. Set up project tracking (Jira, Linear, GitHub Projects)
4. Begin Phase 1 implementation with MVP exit criteria as target

---

*Generated from docs/PRD/PRD.md using strategic-planning agent*