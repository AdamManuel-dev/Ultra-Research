# Deep Research Cockpit

## Steerable AI Research Platform for Mapping Knowledge in Real Time

An AI-powered research cockpit that explores web knowledge with real-time controls, prioritizes primary sources, and builds a verifiable graph of insights. Built for technical professionals who demand transparency and control: research engineers, PMs, data analysts, and tech leads.

> 🚧 **Project Status**: Deep Research Cockpit is under active development (Alpha - Phase 3: Advanced Features). Core research pipeline is functional, with Phase 1 (Foundations) and Phase 2 (Ranking & Core-First) complete. Currently implementing advanced features including graph memory and JS rendering.

---

## Table of Contents

- [Why This Matters](#why-this-matters)
- [Key Concepts](#key-concepts)
- [Core Features](#core-features)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Core Metrics & Performance](#core-metrics--performance)
- [Documentation Map](#documentation-map)
- [Roadmap & Status](#roadmap--status)
- [Contributing](#contributing)
- [Glossary](#glossary)
- [License & Support](#license--support)

---

## Why This Matters

### The Problem

Traditional research and search tools fall short for knowledge work:

- **Aggregation over exploration**: Search results are ranked lists, not maps of adjacent concepts
- **Black-box prioritization**: You don't know why one source ranked above another
- **Lost provenance**: Claims are divorced from original sources and extraction context
- **No steering**: Once a search is launched, you can't adjust depth, breadth, or source priority mid-flight
- **Opacity**: No audit trail of how conclusions were reached

### The Deep Research Cockpit Difference

**1. Real-Time Steering**
Adjust depth, breadth, source priority, verification intensity, and comparison scope *live* with immediate visual feedback. Every control change shows previewed impact within 400ms.

**2. Core-First Architecture**
Automatically prioritizes papers, specifications, and repositories (L0/L1) over blogs and forums (L3/L4). Enforce reading order with transparent reasoning for each ranking decision.

**3. Graph Memory**
Concepts, claims, and relationships guide exploration. Every discovered fact is linked to sources and previous findings. The knowledge graph evolves with your session, enabling discovery of contradictions and novel connections.

**4. Complete Verifiable Lineage**
Every claim has:

- The exact source document with URL
- Character span of the extracted evidence
- Timestamp of when it was discovered
- Why-ranked explanation of source prioritization
- Independent corroborating sources

**5. Deterministic Replay & Analysis**
Replay any session exactly as it happened. Analyze how strategy changes affected outcomes. Compare A/B runs with synchronized timelines and metric deltas. Export complete evidence ledgers.

### Use Cases

- **Literature reviews** with primary source emphasis and contradiction detection
- **Technology spec hunts** with origin tracing and related standards mapping
- **Controversy analysis** with evidence clustering and disagreement discovery
- **Vendor comparison** with specification matching and bias detection
- **Learning paths** with curated reading queues and prerequisite ordering

---

## Key Concepts

### Source Tiers (L0 → L4)

Understanding source classification is central to Deep Research Cockpit's core-first approach:

| Tier | Classification | Examples |
|------|---|---|
| **L0** | Foundational artifacts | Academic papers, technical specifications, official standards (RFCs, ISO), core repositories |
| **L1** | Primary sources | Conference talks, official documentation, white papers, working groups |
| **L2** | Informed secondary | Technical blogs, tutorials, conference proceedings, theses |
| **L3** | Practitioner knowledge | StackOverflow, MathOverflow, professional forums, product docs |
| **L4** | General discussion | Twitter, Reddit, general forums, unvetted blogs |

### The Frontier

A priority queue of concepts, pages, and claims the system recommends exploring next. Scored by:

- **Novelty**: How new this information is relative to existing memory
- **Centrality**: How connected to core concepts
- **Disagreement**: Potential contradictions with existing claims
- **Recency**: When the source was published
- **User interest**: Explicit knob adjustments

### Strategy Controls (The Knobs)

Real-time parameters that steer exploration:

- **Depth** ↔ **Breadth**: Focus on depth (following chains of logic) vs. breadth (exploring diverse angles)
- **Core-First**: Enforce reading order from L0→L4 vs. treat all sources equally
- **Verify**: High corroboration requirements vs. accept single-source claims
- **Compare**: Find contradicting sources and alternative viewpoints
- **Pivot**: Jump to adjacent concepts vs. stay focused on current topic

### GraphRAG (Graph-guided Retrieval)

Hybrid retrieval combining:

- **Text search**: BM25 for keyword matching
- **Vector search**: Dense embeddings for semantic similarity
- **Graph-guided**: Follow edges in the knowledge graph to discover related claims
- **Community summaries**: Each cluster of related concepts has an AI-generated summary

### Event Stream & Replay

Every action—search, fetch, extract, rank, think, decide—emits a JSONL event with:

- Timestamp and run ID
- Action type and agent responsible
- Input parameters and decision rationale
- Output summary and cost (tokens, time, money)
- Artifacts created

Full replay determinism enables exact reproduction of any session.

---

## Core Features

### 🎮 Run Mode — "Pilot View"

Real-time research exploration with full agency:

- **Command Palette**: Macros for common patterns (Survey, Spec Hunt, Contradiction Hunt, Origin Trace, Video-First)
- **Strategy Compass**: Adjustable control knobs with what-if previews (ghost re-ranking)
- **Frontier Map**: Interactive concept graph with overlays showing:
  - Core proximity (distance to foundational sources)
  - Disagreement (potential contradictions)
  - Freshness (recent discoveries)
  - Memory writes (new concepts added this session)
- **Evidence & Reading Queue**: L0→L4 columns with rank cards showing:
  - Why-ranked breakdown (relevance, authority, core proximity, recency, independence)
  - Source metadata (venue, citations, OA status)
  - Confidence scores and contradiction flags
- **Live Log**: Filterable event stream grouped by decision phases
- **Status Strip**: Real-time operational metrics
  - Latency, token usage, %JS renders, diversity index, contradiction density

### 📊 Review Mode — "Black-Box Recorder"

After-the-fact analysis of any completed research session:

- **Timeline Replay**: Scrub through session snapshots; jump to landmarks
  - First core source discovered
  - Contradiction spike events
  - Cost inflection points
  - Strategy control changes
- **Effectiveness Dashboard**: Key Performance Indicators
  - TTFC (Time-to-First-Core source)
  - Authority Mix (% L0/L1 sources)
  - Evidence Robustness (independent sources per claim)
  - Frontier Entropy (breadth measurement)
  - Operational metrics (latency, cost, cache hits)
- **Evidence Ledger**: Complete claim inventory with
  - Confidence scores
  - Supporting sources and quotes
  - Timestamps and extraction spans
  - Contradiction flags and corrections
- **Learning Map**: Diff of graph memory
  - New concepts and entities discovered
  - New relationships and claims added
  - Summary changes and retractions
- **Session Summary**: Machine-generated brief with key findings
- **A/B Run Comparator**: Compare two sessions side-by-side
  - Synchronized timelines
  - Metric deltas
  - Frontier divergence analysis
- **Exports**: Multiple output formats
  - JSONL (complete event stream)
  - CSV (claims and sources)
  - GraphML (knowledge graph structure)
  - PDF (formatted research brief)

### 🔗 Orchestrator & Strategy Controller

Central planning brain that decomposes research goals into exploration task graphs:

- **Task Decomposition**: Break objectives into search → fetch → extract → index → retrieve → synthesize tasks
- **Frontier Scoring**: Maintain a priority queue of what to explore next using multi-factor scoring
- **Strategy Application**: Apply user control changes to re-weight scoring and branching
- **Decision Logging**: Every decision includes inputs, score vector, and outcomes
- **Deterministic Replay**: Same inputs always produce same decisions (seeded randomness)
- **Budget Enforcement**: Hard caps on tokens, time, domains, and JS renders

**Response Times (P95)**:

- Knob change → preview: ≤400ms
- Knob change → scheduler impact: ≤800ms

### 🌐 Fetch & Extraction Pipeline

Cost-aware content acquisition with intelligent routing:

- **Non-JS Fetch** (Default): HTTP with redirects, charset detection, robots.txt compliance via Trafilatura
- **Smart Router**: Escalates to JS rendering when detected:
  - Placeholder/empty DOM
  - SPA patterns (React, Vue, Angular)
  - Interstitial content gates
  - Dynamic loading patterns
- **JS Fetch Path**: Browserbase + Stagehand + Playwright with
  - Site-specific playbooks for reliable extraction
  - Structured extraction hooks for tables, lists, metadata
  - Session management for multi-step authentication
- **HTML→Markdown Normalization**: Turndown service with
  - Heading hierarchy preservation
  - Code block and table fidelity
  - Figure captions and link preservation
  - Boilerplate removal
- **Smart Caching**: Idempotent by URL+ETag with configurable TTLs
- **Compliance**: Robots.txt respect, rate limiting, user-agent identification

**Performance (P95)**:

- Basic fetch: ≤600ms
- JS fetch: ≤3s
- Cache hit rate target: ≥40%

### 🎯 Source Ranking & Core-First Prioritization

Multi-factor scoring with transparent reasoning:

- **Source Classification**: Automatic categorization into tiers
  - Paper/spec/repo detection via metadata and URL patterns
  - Academic vs. practitioner vs. general source
  - Authority level via venue, citation count, DOI presence
- **Metadata Enrichment**: Integration with scholarly databases
  - Crossref (DOI, venue, citations)
  - OpenAlex (comprehensive metadata)
  - Semantic Scholar (citation context)
  - Unpaywall (open access links)
  - Retraction Watch (correction flags)
- **Normalized Scoring**: Combine factors with user-tunable weights
  - Text relevance (BM25 similarity)
  - Authority (venue rank, citation count, L-tier)
  - Core proximity (citation-graph distance to origins)
  - Recency (publish date with time decay)
  - Independence (avoiding duplication and bias)
  - Penalties for retractions/corrections
- **Why-Ranked Explanations**: Human-readable breakdown showing
  - Which factors helped (green)
  - Which factors hurt (red)
  - What-if previews when knobs adjust
- **Reading Queue Builder**: Enforce L0→L4 reading order
  - Quota per tier
  - Gap detection (e.g., missing specification)
  - Drag-to-override with audit trail

**Performance (P95)**:

- Enrichment latency: ≤1.5s (batched)
- Scoring with explanations: ≤200ms

### 📈 Graph Memory & GraphRAG Retrieval

Persistent knowledge graph with intelligent exploration:

- **Schema**: Typed nodes and edges
  - **Nodes**: Concept, Entity, Claim, Source, Note
  - **Edges**: SUPPORTED_BY, ABOUT, RELATED_TO, CONTRADICTS, CITES
- **Merge Operations**: Upsert claims with automatic deduplication
  - Concept linking
  - Source attribution
  - Relationship creation
  - ≤200ms per claim (P95)
- **Community Detection**: Automatic clustering and summarization
  - Identify dense clusters of related concepts
  - Generate community-level summaries
  - Measure cluster coherence
- **Origin Path Calculation**: Shortest path from any claim to foundational sources
  - Enables "why should I trust this?" answers
  - Visualize citation chains
  - Detect chain-of-logic breaks
- **Hybrid Retrieval**: Combine multiple strategies
  - BM25 (keyword matching)
  - Dense vectors (semantic similarity)
  - Neural sparse (entity-aware keyword search)
  - Graph-guided expansion (follow edges to neighbors)
  - RRF (reciprocal rank fusion) to combine signals
- **Query Subgraph Latency**: ≤400ms P95

### 📚 Reading Queue & "Watch the Act" Pipeline

Core-first reading order with integrated video/talk content:

- **Origin Detection**: Identify earliest highly-cited foundational works
  - Patent searches
  - Spec document discovery
  - GitHub repository analysis
  - Academic paper citation trails
- **L0→L4 Queue Building**: Enforce reading order with
  - Tier quotas (e.g., 40% L0, 30% L1, 20% L2, 10% L3/L4)
  - Gap marking (missing prerequisites or standards)
  - Override capability with full audit trail
- **Video Pipeline**:
  - Fetch captions (auto-transcription as fallback)
  - Align snippets to extracted claims
  - Add jump-to timestamps in UI
  - ≤3s per video with caching

### 📡 Observability & Event Schema

Complete audit trail enabling transparency and replay:

- **Event Stream**: JSONL format with core fields
  - `ts` (ISO timestamp), `run_id`, `step_id`
  - `agent` (which component), `action` (operation type)
  - `input`, `output_summary`, `artifacts`
  - `source` (document URL or system)
  - `cost_ms`, `tokens_in`, `tokens_out`, `decision`
- **Real-Time Streaming**: SSE/WebSocket for live views
- **Durable Storage**: Object store + indexed queryable database
- **Snapshot Generator**: Pre-computed snapshots for ≤2s replay load times
- **Queryable**: By run ID, time range, action, agent, decision type
- **Deterministic**: Same inputs always produce same decision log

### 🔒 Security, Privacy & Compliance

Enterprise-grade safety:

- **Site Compliance**
  - Robots.txt and Terms of Service respect
  - Per-domain rate limiting
  - Appropriate user-agent identification
  - Retraction/correction flagging
- **Data Protection**
  - PII minimization in storage
  - Encryption at rest and in transit
  - Secret vault for API keys and credentials
  - Data retention policies with automatic cleanup
- **Access Control**
  - Role-based access (viewer, editor, admin)
  - Workspace isolation for teams
  - Audit logs for all actions
  - Export & deletion endpoints
- **Compliance Documentation**
  - DPA/Terms of Service summaries
  - Opt-in for auto-transcription features
  - GDPR-ready data handling

### 💰 Cost & Performance Management

Predictable operational costs:

- **JS Rendering Budget**: Policy enforcement
  - Auto/Conservative/Aggressive modes
  - Percentage-of-run caps
  - Fallback to cached content when budget exceeded
- **Per-Run Caps**: Configurable limits
  - Token budget (input + output)
  - Time budget (wall-clock duration)
  - Domain count limit
  - JS render count limit
- **Caching Layers**: Reduce redundant work
  - HTTP cache (ETag-aware)
  - HTML→Markdown reduction cache
  - Embeddings cache
  - Metadata cache (scholarly API results)
- **Batching & Optimization**
  - Batch API requests to scholarly databases
  - Circuit breakers for failing services
  - Adaptive backoff and retry logic

### 🧪 Evaluation & QA Framework

Continuous quality assurance:

- **Golden Tasks**: Reference queries with expected findings
  - Known sources to discover
  - Claims to validate
  - Contradictions to surface
- **Automated Scoring**: RAGAS-style metrics
  - Faithfulness (claims match sources)
  - Answer relevancy (retrieved content answers question)
  - Context precision (no irrelevant sources)
  - Context recall (all relevant sources found)
- **Claim-Level Judgment**: LLM-as-judge with evidence links
- **A/B Testing Infrastructure**:
  - Vary knobs and component configurations
  - Track outcome differences
  - Pareto front analysis for trade-offs
- **Automated Reporting**:
  - Weekly quality reports
  - Regression thresholds with alerts
  - Component performance breakdown

### 🔬 External Scholarly Integrations

Authority-based metadata and enrichment:

- **Integrated APIs**:
  - **Crossref**: DOI lookup, venue metadata, citation counts
  - **OpenAlex**: Comprehensive scholarly metadata
  - **Semantic Scholar**: Citation context and author information
  - **Unpaywall**: Open access link discovery
  - **Venue Databases**: Journal/conference impact rankings
  - **Video Caption APIs**: YouTube, Vimeo, etc.
- **Normalized Schema**: Consistent "source profile" structure across providers
- **Caching Strategy**: Local caching with periodic refresh
- **Rate Limit & Retry**: Respectful API usage with exponential backoff
- **95%+ Enrichment Target**: Scholarly metadata available for 95%+ of academic sources

---

## Architecture Overview

### System Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│         User UI (Run Mode / Review Mode)                    │
│     (Pilot View / Black-Box Recorder)                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
        SSE/WebSocket ↔ Real-time Control
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  Orchestrator (Planner + Strategy Controller)               │
│  - Task decomposition                                       │
│  - Frontier scoring & prioritization                        │
│  - Budget enforcement                                       │
│  - Decision logging                                         │
└──────┬──────────────────────────────────┬───────────────────┘
       │                                  │
       ▼                                  ▼
┌──────────────────┐          ┌──────────────────┐
│  Fetch Basic     │          │  Fetch JS        │
│  (httpx +        │          │  (Browserbase +  │
│   Trafilatura)   │          │   Stagehand)     │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         └──────────────┬──────────────┘
                        ▼
          ┌─────────────────────────────┐
          │ Turndown (HTML → Markdown)  │
          └────────────┬────────────────┘
                       ▼
          ┌──────────────────────────────┐
          │ Indexer (Hybrid OpenSearch)  │
          │ - BM25 (keyword)             │
          │ - Dense vectors (semantic)   │
          │ - Neural sparse (entities)   │
          └────────┬─────────────────────┘
                   │
       ┌───────────┴──────────┐
       ▼                      ▼
┌─────────────────┐  ┌──────────────────────┐
│ Claim/Entity    │  │ Graph Memory         │
│ Extractor       │  │ (Neo4j/Memgraph)     │
│ (w/ citations)  │  │ - Concepts/Entities  │
└────────┬────────┘  │ - Claims/Sources     │
         │           │ - Relationships      │
         └──────┬────┤ - Community summaries│
                ▼    └──────────────────────┘
         ┌──────────────────────────┐
         │ Retrieval (Hybrid +      │
         │ Graph-Guided)            │
         └──────┬───────────────────┘
                ▼
      ┌─────────────────────┐
      │ Synthesis           │
      │ (Notes/Reports)     │
      └─────────────────────┘
                │
         ┌──────┴──────────┐
         ▼                 ▼
    ┌─────────┐      ┌──────────────┐
    │ Events  │      │ Snapshots    │
    │ (JSONL) │      │ (for replay) │
    └─────────┘      └──────────────┘
```

### Key Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Graph Database** | Neo4j / Memgraph | Knowledge graph storage |
| **Search Index** | OpenSearch | Hybrid retrieval (BM25 + vector) |
| **Content Fetch** | httpx + Trafilatura | Non-JS content acquisition |
| **JS Rendering** | Browserbase + Stagehand | Dynamic site rendering |
| **HTML→Markdown** | Turndown | Content normalization |
| **Embedding Model** | (Configurable) | Semantic search vectors |
| **Event Streaming** | SSE / WebSocket | Real-time client updates |
| **Event Storage** | Object store (S3/GCS) + OpenSearch | Queryable audit trail |
| **Scheduling** | (DAG-based task runner) | Orchestration engine |
| **API Clients** | Scholarly integrations | Metadata enrichment |

### Design Principles

**Cost-Aware**: Non-JS fetch by default; JS rendering only when necessary and within budget
**Verifiable**: Every claim links to source spans with timestamps and confidence
**Deterministic**: Exact replay of sessions with seeded randomness
**Transparent**: All decisions include reasoning; users see trade-offs
**Scalable**: Horizontal scaling of components; streaming architecture
**Compliant**: Respect robots.txt, TOS, rate limits, and privacy regulations

---

## Quick Start

> **📚 Complete Setup Guide**: For detailed installation instructions, troubleshooting, and verification steps, see the [Getting Started Guide](docs/guides/GETTING_STARTED.md) (30-45 minutes).

### Prerequisites

**System Requirements**:
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Docker Desktop** (or Docker Engine + Docker Compose v2.0+)
- **8GB RAM** minimum (16GB recommended)
- **20GB disk space** for Docker volumes

**Optional**:
- API keys for LLM providers (OpenAI, Anthropic) - for future integrations

### Installation

**5-Minute Setup**:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/deep-research-cockpit.git
cd deep-research-cockpit

# 2. Install dependencies
npm install

# 3. Start infrastructure services (Neo4j, OpenSearch, Redis, MinIO)
npm run docker:up

# 4. Wait for services to be healthy (~1-2 minutes)
docker-compose ps  # All services should show "healthy"

# 5. Start development servers (backend + frontend)
npm run dev
```

**Access the Application**:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Verify Installation

```bash
# Check backend health
curl http://localhost:3001/health | jq

# Expected output:
{
  "status": "healthy",
  "services": {
    "neo4j": { "status": "connected", "latency_ms": 12 },
    "opensearch": { "status": "connected", "latency_ms": 45 },
    "redis": { "status": "connected", "latency_ms": 3 }
  },
  "uptime_seconds": 42,
  "version": "0.1.0"
}
```

### First Research Session

> **Note**: In the current pre-alpha phase, many UI features are still in development. The backend event system and storage are functional.

1. **Open the UI** at http://localhost:3000
2. **Create a new research session** (when UI is ready)
3. **Monitor events in real-time**:
   ```bash
   # Watch event stream
   curl -N http://localhost:3001/events/stream
   ```
4. **Check stored events**:
   - OpenSearch Dashboards: http://localhost:5601
   - MinIO Console: http://localhost:9001

### Troubleshooting

**Services won't start?**
```bash
# Check Docker is running
docker ps

# Check port conflicts
lsof -i :7474  # Neo4j
lsof -i :9200  # OpenSearch

# View logs
npm run docker:logs
```

**Need more help?**
- See comprehensive [Getting Started Guide](docs/guides/GETTING_STARTED.md) with detailed troubleshooting
- Check [Getting Started - Troubleshooting](docs/guides/GETTING_STARTED.md#troubleshooting) for common issues
- Review [Development Guide](docs/guides/DEVELOPMENT.md) for development workflow
- Open an issue on GitHub

### Next Steps

**For Users**:
- Explore the system as features are implemented
- Provide feedback on GitHub Discussions

**For Developers**:
- Read [Development Guide](docs/guides/DEVELOPMENT.md) - Workflow and standards
- Read [Architecture Overview](ARCHITECTURE.md) - System design
- Check [Contributing Guide](CONTRIBUTING.md) - How to contribute
- Review [Testing Guide](docs/guides/TESTING.md) - Testing practices

**Complete Documentation**:
- [Documentation Index](docs/INDEX.md) - All documentation organized by role and topic

---

## Core Metrics & Performance

### Key Performance Indicators

| Metric | Target | Purpose |
|--------|--------|---------|
| **TTFC** | ≤90s P95 | Time to First Core (L0/L1) source discovery |
| **Authority Mix** | ≥60% | Proportion of L0/L1 sources in core-first mode |
| **Evidence Robustness** | ≥2.0 | Independent sources per high-impact claim |
| **Control Responsiveness** | ≤400ms | Preview latency for knob changes |
| **Commit Latency** | ≤800ms | Strategy change application |
| **JS Render Rate** | ≤25% | Percentage JS for general topics |
| **Cache Hit Rate** | ≥40% | HTTP/metadata caching effectiveness |
| **Frontier Entropy** | Tunable | Breadth measurability |

### Operational Characteristics

- **Deterministic Replay**: 100% reproducibility of event sequence
- **Frontier Scoring**: Measurable changes when controls shift
- **Domain Diversity**: Tunable with visible impact on results
- **Contradiction Density**: Observable clustering of disagreements

### Success Criteria (MVP)

- TTFC ≤120s with Authority Mix ≥50% L0/L1
- Complete event logging and basic replay
- Evidence Robustness ≥2.0 independent sources per claim

---

## Documentation Map

> **📚 Complete Documentation Index**: See [docs/INDEX.md](docs/INDEX.md) for all documentation organized by role and topic

This README provides a high-level overview. For detailed information:

- **System-level docs**: See [docs/](docs/) directory for guides, architecture, and PRDs
- **Package-level docs**: Each package (`backend/`, `frontend/`, `shared/`) has its own detailed documentation in `packages/{name}/docs/`
- **API references**: Available in both root ARCHITECTURE.md and package-specific API.md files

### Quick Links by Role

#### 👨‍💻 For Developers

**Essential Guides**:

- **[Getting Started Guide](docs/guides/GETTING_STARTED.md)** - Setup and installation (30-45 min)
- **[Development Guide](docs/guides/DEVELOPMENT.md)** - Workflow and standards
- **[Testing Guide](docs/guides/TESTING.md)** - Testing strategy and practices
- **[Architecture Overview](ARCHITECTURE.md)** - System design and components
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute code

**Architecture Deep Dives**:

- [System Components](ARCHITECTURE.md#system-components) - Backend, frontend, services
- [Data Flow Architecture](ARCHITECTURE.md#data-flow-architecture) - Request/event flow
- [Event-Driven Architecture](ARCHITECTURE.md#event-driven-architecture) - Event sourcing
- [Database Schemas](ARCHITECTURE.md#database-schemas) - Neo4j, OpenSearch, Redis

#### 🔬 For Research Engineers & Analysts

**User Guides** (Coming Soon):

- Pilot View UI Guide - Master the live research interface
- Strategy Controls Guide - Steer exploration effectively
- Source Tiers & Core-First - Understanding authority ranking
- Reading Queue Management - Building optimal reading order
- Review Mode Deep Dive - Analyzing completed sessions

#### 🏢 For Technical Leaders & Product Managers

**Strategic Documentation**:

- **[Project Overview](README.md)** - Vision, features, and roadmap
- **[Architecture Overview](ARCHITECTURE.md)** - System design and scalability
- **[Complete PRD Suite](docs/PRD/PRD.md)** - Product requirements and specifications
- **[Deployment Guide](docs/guides/DEPLOYMENT.md)** - Deployment strategies and operations

**Future Documentation**:

- Evaluation Framework - Quality metrics and measurement
- Cost & Performance Management - Budget controls and optimization
- Security & Compliance - Privacy, compliance, and safety

#### 📊 For Data Scientists

**Technical Implementation** (Planned):

- GraphRAG Implementation - Graph-guided retrieval details
- Ranking Algorithms - Scoring function design
- Evaluation & Metrics - Measurement methodology
- Source Classification - L0-L4 detection algorithms

### Core Documentation

| Document | Description | Status |
|----------|-------------|--------|
| [README.md](README.md) | Project overview and quick start | ✅ Current |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Complete system architecture | ✅ Current |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines | ✅ Current |
| [Getting Started](docs/guides/GETTING_STARTED.md) | Setup and installation | ✅ Current |
| [Development Guide](docs/guides/DEVELOPMENT.md) | Development workflow | ✅ Current |
| [Testing Guide](docs/guides/TESTING.md) | Testing practices | ✅ Current |
| [Deployment Guide](docs/guides/DEPLOYMENT.md) | Deployment strategies | ✅ Current |
| [Documentation Index](docs/INDEX.md) | Complete documentation map | ✅ Current |

### Package Documentation

Each package has its own detailed documentation:

**Backend** (`packages/backend/docs/`):

- [Backend README](packages/backend/docs/README.md) - Backend overview and setup
- [Backend API](packages/backend/docs/API.md) - API endpoint reference
- [Services](packages/backend/docs/modules/services.md) - Service layer documentation
- [Middleware](packages/backend/docs/modules/middleware.md) - Express middleware
- [Utils](packages/backend/docs/modules/utils.md) - Utility functions

**Frontend** (`packages/frontend/docs/`):

- [Frontend Architecture](packages/frontend/docs/ARCHITECTURE.md) - Frontend design patterns
- [Frontend Development](packages/frontend/docs/DEVELOPMENT.md) - Development workflow
- [Components](packages/frontend/docs/COMPONENTS.md) - React component library
- [Hooks](packages/frontend/docs/modules/hooks.md) - Custom React hooks
- [State Management](packages/frontend/docs/modules/state.md) - Redux state structure

**Shared** (`packages/shared/docs/`):

- [Shared API](packages/shared/docs/API.md) - Shared utilities and types
- [Types](packages/shared/docs/types.md) - TypeScript type definitions
- [Validation](packages/shared/docs/validation.md) - Validation schemas

### Additional Resources

- **[Glossary](#glossary)** - Key terminology and concepts
- **[PRD Documents](docs/PRD/)** - Product requirements and specifications
- **[GitHub Issues](https://github.com/yourusername/deep-research-cockpit/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/yourusername/deep-research-cockpit/discussions)** - Questions and community

---

## Roadmap & Status

### Current Status

**Alpha - Phase 3** — Core research pipeline functional (Phases 1-2 complete); currently implementing advanced features (graph memory, JS rendering, video pipeline); evaluating user workflows and performance characteristics

### Rollout Phases

#### ✅ Phase 1: Foundations (Weeks 1–3)

- Event schema and bus
- Basic fetch + Turndown normalization
- Hybrid search index (OpenSearch)
- Orchestrator with frontier scoring
- Pilot View shell (layout, basic log, queue)

**Exit Criteria**: MVP research pipeline works end-to-end

#### ✅ Phase 2: Ranking & Core-First (Weeks 4–6)

- Source classification and metadata enrichment
- Multi-factor ranking with why-ranked explanations
- Reading queue builder with L0→L4 enforcement
- Router heuristics for JS escalation
- HTTP and metadata caching

**Exit Criteria**: Authority Mix ≥50%, TTFC ≤120s

#### 🚧 Phase 3: Advanced Features (Weeks 7–9)

- JS rendering path (Browserbase + Stagehand)
- Graph memory with community summaries
- Graph overlays in Pilot View
- Origin detection and reading queue optimization
- Video caption alignment

**Exit Criteria**: ≤25% JS renders for general topics; graph structure validated

#### 📅 Phase 4: Analysis & Exports (Weeks 10–12)

- Review Mode implementation
- Timeline replay with KPI dashboard
- Evidence ledger and learning map
- Export formats (JSONL, CSV, GraphML, PDF)
- A/B run comparison
- Evaluation framework and dashboards
- RBAC and audit logs

**Exit Criteria**: Full replay works; exports verified; team workflow tested

#### 📅 Phase 5 (V2): Advanced Analytics & Scaling

- Advanced attribution analytics
- Team multi-tenancy and shared workspaces
- Failure autopsy and automated debugging
- Extended scholarly integrations (arXiv, PubMed, etc.)
- Multi-language support
- Custom ranking rule builder

---

## Contributing

We welcome contributions! Here's how to get involved:

### Report Issues

Found a bug? Have a feature idea?
→ [Open an issue](https://github.com/yourusername/deep-research-cockpit/issues)

### Contribute Code

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our [style guide](CONTRIBUTING.md#code-style)
4. Add tests for new functionality
5. Submit a pull request

See [Contributing Guide](CONTRIBUTING.md) for detailed setup and process.

### Improve Documentation

- Clarify existing docs
- Add examples and tutorials
- Report broken links or unclear sections
- Translate documentation

### Share Use Cases

Tell us how you're using Deep Research Cockpit! We'd love to feature your research or workflow.

---

## Glossary

**Authority Mix**
Percentage of sources in L0/L1 tiers; target ≥60% for core-first runs.

**Core Proximity**
Citation-graph distance to foundational sources (papers, specs, repos).

**Frontier**
Priority queue of next concepts, pages, and claims to explore; scored by novelty, centrality, disagreement, and user interest.

**GraphRAG**
Retrieval Augmented Generation combined with graph structure; uses knowledge graph to guide discovery and provide context.

**L0 / L1 / L2 / L3 / L4**
Source tier classification from foundational (L0) to general discussion (L4).

**TTFC**
Time-to-First-Core source; how quickly the system discovers L0/L1 materials.

**Why-Ranked**
Human-readable breakdown of factors contributing to a source's rank; shows which factors helped (green) and hurt (red).

**Deterministic Replay**
Ability to reproduce any session exactly given same inputs; enabled by seeded randomness and event logging.

**Snapshot**
Pre-computed state capture of a research session at a point in time; enables fast review mode loading.

**Evidence Robustness**
Average number of independent sources supporting each high-impact claim; target ≥2.0.

**Frontier Entropy**
Measure of breadth in exploration; higher values indicate more diverse concept coverage.

---

## License & Support

### License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

### Support

- **Questions?** Check the [Getting Started Guide](docs/guides/GETTING_STARTED.md) and [Documentation Index](docs/INDEX.md)
- **Troubleshooting?** See [Getting Started - Troubleshooting](docs/guides/GETTING_STARTED.md#troubleshooting) section
- **Found a bug?** [Report it on GitHub](https://github.com/yourusername/deep-research-cockpit/issues)
- **Security issue?** Email [security@example.com](mailto:security@example.com) (do not open a public issue)
- **General discussion?** Join our community:
  - [GitHub Discussions](https://github.com/yourusername/deep-research-cockpit/discussions)
  - Discord community (link coming soon)

### Credits

Built with gratitude for these excellent projects:

- [OpenSearch](https://opensearch.org/) - Hybrid search engine
- [Neo4j](https://neo4j.com/) and [Memgraph](https://memgraph.com/) - Graph databases
- [Browserbase](https://browserbase.com/) - Browser automation
- [Stagehand](https://stagehand.dev/) - Structured web scraping
- [Trafilatura](https://trafilatura.readthedocs.io/) - Content extraction
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown
- [Crossref](https://www.crossref.org/), [OpenAlex](https://openalex.org/), [Semantic Scholar](https://www.semanticscholar.org/) - Scholarly metadata

---

## Quick Links

- 📚 [Documentation Index](docs/INDEX.md) - All docs organized by role
- 🚀 [Getting Started](docs/guides/GETTING_STARTED.md) - 30-minute setup guide
- 🏗️ [Architecture](ARCHITECTURE.md) - Complete system design
- 👨‍💻 [Development Guide](docs/guides/DEVELOPMENT.md) - Workflow and standards
- 🧪 [Testing Guide](docs/guides/TESTING.md) - Testing practices
- 🤝 [Contributing](CONTRIBUTING.md) - How to contribute
- 📋 [Roadmap](#roadmap--status) - Development phases
- 💬 [Discussions](https://github.com/yourusername/deep-research-cockpit/discussions) - Community Q&A

---

**Deep Research Cockpit** — Making research exploration transparent, verifiable, and steerable.
