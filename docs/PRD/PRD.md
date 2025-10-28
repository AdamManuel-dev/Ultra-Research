# Deep Research Cockpit — Comprehensive PRD Suite

A complete PRD package for a real‑time AI research and concept‑space exploration platform. Includes an overarching plan and feature‑level PRDs with goals, scope, acceptance criteria, data contracts, metrics, risks, and DAG‑ordered implementation tasks.

---

## Table of Contents

- [Deep Research Cockpit — Comprehensive PRD Suite](#deep-research-cockpit--comprehensive-prd-suite)
  - [Table of Contents](#table-of-contents)
  - [A. Product PRD (Overarching)](#a-product-prd-overarching)
    - [1) Summary](#1-summary)
    - [2) Goals](#2-goals)
    - [3) Non‑Goals](#3-nongoals)
    - [4) Users \& Use Cases](#4-users--use-cases)
    - [5) System Overview (Conceptual)](#5-system-overview-conceptual)
    - [6) Success Metrics (Core KPIs)](#6-success-metrics-core-kpis)
    - [7) Constraints \& Policies](#7-constraints--policies)
    - [8) High‑Level Requirements](#8-highlevel-requirements)
    - [9) Risks](#9-risks)
    - [10) Mitigations](#10-mitigations)
    - [11) Rollout Phases](#11-rollout-phases)
  - [B. Feature PRDs](#b-feature-prds)
    - [B1) Orchestrator \& Strategy Controller](#b1-orchestrator--strategy-controller)
    - [B2) Fetch \& Extraction Pipeline (Non‑JS + JS)](#b2-fetch--extraction-pipeline-nonjs--js)
    - [B3) Ranking \& Source Prioritization (Core‑First)](#b3-ranking--source-prioritization-corefirst)
    - [B4) Graph Memory \& GraphRAG Retrieval](#b4-graph-memory--graphrag-retrieval)
    - [B5) Run Mode UI — “Pilot View”](#b5-run-mode-ui--pilot-view)
    - [B6) Review Mode UI — “Black‑box Recorder”](#b6-review-mode-ui--blackbox-recorder)
    - [B7) Reading Queue Builder \& “Watch the Act” Pipeline](#b7-reading-queue-builder--watch-the-act-pipeline)
    - [B8) Observability \& Event Schema](#b8-observability--event-schema)
    - [B9) Security, Privacy, Compliance](#b9-security-privacy-compliance)
    - [B10) Cost \& Performance Management](#b10-cost--performance-management)
    - [B11) Evaluation \& QA Framework](#b11-evaluation--qa-framework)
    - [B12) External Scholarly Integrations](#b12-external-scholarly-integrations)
  - [C. Cross‑Feature Program Plan \& Timeline](#c-crossfeature-program-plan--timeline)
    - [Milestones \& Dependencies (DAG‑ordered)](#milestones--dependencies-dagordered)
    - [Indicative Timeline](#indicative-timeline)
  - [D. Glossary](#d-glossary)

---

## A. Product PRD (Overarching)

### 1) Summary

A steerable AI research cockpit that explores web knowledge in real time, prioritizes primary sources, and writes structured insights into a graph memory. Users adjust **depth**, **breadth**, and **source priority** via visible controls; the system logs every step and can replay the entire session with metrics and a narrative summary.

### 2) Goals

* **Exploration over aggregation**: map adjacent concepts and reveal connections.
* **Steerable strategy**: live controls for depth/breadth/core‑first/verify/compare.
* **Verifiable lineage**: every claim has a source, span/timestamp, and extraction trace.
* **Efficient crawling**: non‑JS fetch by default; JS rendering only when required.
* **Structured memory**: concepts, claims, relationships guide the next search.

### 3) Non‑Goals

* General web browser replacement.
* Automated bypass of paywalls or restricted content.
* Fully automated decision‑making without human oversight for high‑risk domains.

### 4) Users & Use Cases

* Research engineers, PMs, analysts, and technical leaders performing literature reviews, technology scans, spec hunts, vendor comparisons, or controversy analysis.

### 5) System Overview (Conceptual)

```
User UI (Run/Review) ⇄ WebSocket/SSE ⇄ Orchestrator (Planner + Strategy Controller)
                ⇣                ⇣
   Fetch Basic (httpx + Trafilatura)        Fetch JS (Browserbase + Stagehand)
                ⇣                ⇣
            Turndown (HTML→MD)  →  Indexer (Hybrid: OpenSearch)
                ⇣                ⇣
          Claim/Entity Extractor → Graph Memory (Neo4j/Memgraph)
                ⇣                ⇣
                 Retrieval (Hybrid + Graph‑guided) → Synthesis → Notes/Reports
```

### 6) Success Metrics (Core KPIs)

* **TTFC** (Time‑to‑First‑Core source) ≤ 90s P95.
* **Authority Mix**: ≥60% of consumed sources are L0/L1 for “core‑first” runs.
* **Evidence Robustness**: ≥2 independent sources per high‑impact claim.
* **Frontier Entropy**: tunable breadth with measurable change when controls shift.
* **Operational**: ≤25% JS renders for general topics; cache hit ≥40%.

### 7) Constraints & Policies

* Respect robots.txt and Terms of Service.
* Store only necessary data; PII minimization; retention policies.
* Provide OA links when possible; mark paywalled content.
* Retraction/correction flags visible to the user.

### 8) High‑Level Requirements

* Real‑time control of strategy with immediate feedback.
* Hybrid retrieval (BM25 + vector) with graph‑guided expansion.
* Transparent ranking with “why‑ranked” explanations.
* Full event log (JSONL) and replay.
* Exportable knowledge artifacts (JSONL, CSV, GraphML, PDF brief).

### 9) Risks

* Over‑rendering with browser sessions → cost spikes.
* Source bias from a few high‑authority domains.
* Fragile extraction on dynamic sites.
* LLM hallucination in synthesis if evidence linkage is weak.

### 10) Mitigations

* Router prefers Basic fetch; JS policy caps.
* Diversity weighting + independence checks.
* Stagehand playbooks for difficult sites; retries/fallbacks.
* Strict evidence‑first prompting; quote hashing; contradiction checks.

### 11) Rollout Phases

1. **MVP**: Non‑JS pipeline, hybrid index, Pilot View basics, event log, simple graph memory.
2. **V1**: JS path, ranking reason cards, Review Mode replay & dashboard, reading queue.
3. **V1.5**: “Watch the Act” pipeline, A/B comparator, exports suite.
4. **V2**: Advanced GraphRAG, attribution analytics, failure autopsy, team multi‑tenancy.

---

## B. Feature PRDs

### B1) Orchestrator & Strategy Controller

**Summary**: Central brain that decomposes tasks, manages the frontier (what to read next), and applies user controls (depth/breadth/core‑first/verify/compare) to guide exploration.

**Functional Requirements**

* Plan sub‑goals and a task graph: `search`, `fetch`, `extract`, `index`, `retrieve`, `synthesize`, `graph.merge`.
* Maintain a **frontier** priority queue scored by novelty, centrality, disagreement, recency, user interest.
* Apply user commands to re‑weight scoring and branching factor.
* Emit decisions as events with inputs, scores, outcomes.

**Non‑Functional**

* Deterministic replays given the same inputs (seeded randomness).
* ≤100ms latency to acknowledge knob changes and show preview.

**Data Contracts**

* `POST /orchestrator/command {run_id, kind, params}` → `{ack: true}`
* `GET /frontier/state?run_id` → `[{concept_id, score, reason}]`

**Acceptance Criteria**

* Knob changes produce visible frontier & queue deltas within 500ms.
* Decision events include inputs, score vector, and next tasks.

**DAG (Implementation Order)**

1. Event bus & run context → 2. Planner skeleton → 3. Frontier scoring → 4. Command handlers → 5. Previews → 6. Tests & replay fixtures.

**Risks & Mitigations**

* Overfitting to knobs → Add sane bounds and presets (macros).

---

### B2) Fetch & Extraction Pipeline (Non‑JS + JS)

**Summary**: Cost‑aware, robust fetching. Non‑JS by default; JS rendering for SPA/interstitial pages. Normalize to Markdown via Turndown.

**Functional Requirements**

* Basic fetch: HTTP(S) with redirects, charset, robots checks, Trafilatura/Readability main‑content extraction.
* JS fetch: Browserbase + Stagehand + Playwright with site playbooks and structured extraction hooks.
* HTML→Markdown reduction (Turndown service) with heading/code block fidelity.
* Router chooses path based on heuristic signals; respect per‑run JS budget.

**Non‑Functional**

* P95 fetch: Basic ≤600ms, JS ≤3s.
* Idempotent caching by URL+ETag; configurable TTL.

**Data Contracts**

* `POST /fetch/basic {url}` → `{status, html, extracted, headers}`
* `POST /fetch/js {url}` → `{status, html, meta, session_id}`
* `POST /reduce/html2md {html}` → `{markdown}`

**Acceptance Criteria**

* Router escalates to JS when placeholder/empty DOM detected.
* Markdown preserves headings and code; removes boilerplate reliably.

**DAG**

1. Basic fetch + Trafilatura → 2. Turndown microservice → 3. Router heuristics → 4. JS path with Browserbase/Stagehand → 5. Caching & TTLs → 6. Playbook registry.

**Risks**

* Anti‑bot defenses → Respect rate limits, vary headers, exponential backoff.

---

### B3) Ranking & Source Prioritization (Core‑First)

**Summary**: Rank candidates by text relevance, authority, core proximity, recency, independence, with penalties for retractions; enforce L0→L4 reading order.

**Functional Requirements**

* Classify sources: paper/spec/repo/video/blog/stackoverflow/mathoverflow/forum.
* Enrich metadata via Crossref, OpenAlex, Semantic Scholar, Unpaywall, venue rankings; retraction flags.
* Compute normalized score; expose **why‑ranked** breakdown; support “what‑if” previews.
* Build L0→L4 reading queue with quotas; mark gaps (e.g., missing spec).

**Non‑Functional**

* Enrichment P95 latency ≤1.5s using batching and caching.

**Data Contracts**

* `POST /rank/score {doc_profile, knobs}` → `{score, breakdown}`
* `POST /queue/build {candidates, knobs}` → `{L0:[..],L1:[..]...}`

**Acceptance Criteria**

* Rank cards show breakdown and change when knobs adjusted.
* Reading queue prioritizes L0/L1 when core‑first enabled.

**DAG**

1. Type classification → 2. Metadata enrichment clients → 3. Scoring function → 4. Why‑ranked UI payload → 5. Queue builder.

**Risks**

* API rate limits → Local cache, adaptive backoff, mirror datasets where allowed.

---

### B4) Graph Memory & GraphRAG Retrieval

**Summary**: Persist concepts, claims, sources, and relationships; retrieval fuses hybrid search with graph‑guided expansion and community summaries.

**Functional Requirements**

* Nodes: `Concept`, `Entity`, `Claim`, `Source`, `Note`.
* Edges: `SUPPORTED_BY`, `ABOUT`, `RELATED_TO`, `CONTRADICTS`, `CITES`.
* Community summaries per cluster; shortest path to origin sources.
* Retrieval: RRF of BM25+dense (+neural sparse if present) + graph‑guided neighbors.

**Non‑Functional**

* Upsert ≤200ms per claim; query subgraph ≤400ms P95.

**Data Contracts**

* `POST /graph/merge {batch}` → `{created, updated}`
* `POST /graph/query {cypher|template}` → `{records}`

**Acceptance Criteria**

* New claims appear with linked sources and concept edges.
* Graph‑guided retrieval measurably improves recall (A/B ≥+10% RAGAS F1).

**DAG**

1. Schema & indices → 2. Merge API → 3. Community detection + summaries → 4. Origin path calculations → 5. Retrieval integration.

**Risks**

* Graph growth hot spots → Periodic pruning, edge weight decay, sharding strategy.

---

### B5) Run Mode UI — “Pilot View”

**Summary**: Real‑time steering with visible knobs, frontier map, ranked reading queue, live event log, and status strip.

**Functional Requirements**

* **Command Bar**: ⌘K palette; macros (Survey, Spec Hunt, Contradiction Hunt, Origin Trace, Video‑first).
* **Strategy Compass**: adjustable weights with immediate preview (ghost re‑rank).
* **Frontier Map**: interactive concept graph with overlays (core proximity, disagreement, freshness, memory writes).
* **Evidence & Reading Queue**: L0→L4 columns with rank cards; drag‑to‑override.
* **Live Log**: filterable event stream with decision groups.
* **Status strip**: latency, tokens, %JS, diversity, contradiction density.

**Non‑Functional**

* 60fps interactions; virtualized lists; WebGL graph.
* All control changes acknowledged <100ms; visual updates <500ms.

**Acceptance Criteria**

* Changing a knob updates queue and frontier preview without page reload.
* Opening a source shows why‑rank; opening a claim shows supporting spans.

**DAG**

1. Layout shell → 2. Event stream wiring → 3. Compass + previews → 4. Graph + overlays → 5. Queue + cards → 6. Log + decision groups → 7. Status strip.

**Risks**

* UI performance on large graphs → clustering, progressive rendering, detail on demand.

---

### B6) Review Mode UI — “Black‑box Recorder”

**Summary**: Time‑aligned replay of a run with KPIs, evidence ledger, learning map, narrative summary, and exports.

**Functional Requirements**

* **Timeline Replay**: scrub through snapshots; jump to landmarks (first core, contradiction spike, cost inflection).
* **Effectiveness Dashboard**: TTFC, Authority Mix, Independence, Contradiction Density, Frontier Entropy, Novelty, Ops.
* **Evidence Ledger**: claims with confidence, sources, quotes/timestamps.
* **Learning Map**: diff of memory (new nodes/edges, changed summaries).
* **Run Summary**: machine‑generated brief; export JSONL/CSV/GraphML/PDF.
* **Run Comparator**: A/B runs with synchronized timelines and metric deltas.

**Non‑Functional**

* Loading any run ≤2s P95 with pre‑computed snapshots.

**Acceptance Criteria**

* Replay reproduces control changes and queue/frontier at each step.
* Exports are complete and checksum‑verified.

**DAG**

1. Snapshot model → 2. Timeline player → 3. KPI calculators → 4. Ledger & map → 5. Exports → 6. A/B comparator.

**Risks**

* Snapshot bloat → delta encoding + compression; configurable retention.

---

### B7) Reading Queue Builder & “Watch the Act” Pipeline

**Summary**: Enforce core‑first reading order and surface author/maintainer talks with captions aligned to claims.

**Functional Requirements**

* Identify origin set (earliest highly‑cited works/specs/repos).
* Build L0→L4 queue; mark gaps; allow overrides with audit trail.
* Video pipeline: fetch captions; align snippets to extracted claims; add jump‑to timestamps.

**Non‑Functional**

* Caption fetch & alignment ≤3s per video with caching.

**Acceptance Criteria**

* L0/L1 prioritized in core‑first mode; “why‑ranked” cites venue/citations/proximity.
* Video cards show claim‑linked timestamps.

**DAG**

1. Origin detection → 2. Queue quotas & gaps → 3. Video captions → 4. Claim alignment → 5. UI integration.

**Risks**

* Missing captions → auto‑transcribe (opt‑in, configurable quality gates).

---

### B8) Observability & Event Schema

**Summary**: Unified JSONL event stream for everything; supports Run Mode live view and Review Mode replay/analytics.

**Event Schema (core fields)**

* `ts, run_id, step_id, agent, action, input, output_summary, artifacts, source, cost_ms, tokens_in, tokens_out, decision`.

**Functional Requirements**

* Real‑time streaming (SSE/WebSocket) + durable storage (object store + index).
* Queryable by run/time/action/agent.
* Snapshot generator for replay.

**Acceptance Criteria**

* Every UI element back‑links to the exact events that produced it.

**DAG**

1. Schema & validator → 2. Stream endpoint → 3. Storage & index → 4. Snapshot builder → 5. Analytics jobs.

---

### B9) Security, Privacy, Compliance

**Summary**: Respect site policies; protect user data; enable safe team usage.

**Requirements**

* Robots/ToS compliance; per‑domain rate limits; user‑agent identification.
* PII minimization; encrypted at rest/in transit; secret vault for API keys.
* Role‑based access; audit logs; workspace isolation.
* Data retention settings; export & deletion endpoints.

**Acceptance Criteria**

* External audit log covers all fetches with method, headers (scrubbed), and timeline.
* DPA/ToS documented; opt‑in for auto‑transcription.

**DAG**

1. Policy engine → 2. Secrets & KMS → 3. RBAC → 4. Audit & retention → 5. Compliance docs.

---

### B10) Cost & Performance Management

**Summary**: Keep latency and token spend predictable; cap expensive browser sessions.

**Requirements**

* JS policy: Auto/Conservative/Aggressive with %JS budget.
* Per‑run caps on tokens, time, domains.
* Caching layers (HTTP cache, HTML→MD cache, embeddings cache, metadata cache).
* Batching & circuit breakers; adaptive backoff.

**Acceptance Criteria**

* Budget guards trigger soft stops with actionable summaries.

**DAG**

1. Budget tracker → 2. Cache stack → 3. JS policy enforcement → 4. Circuit breakers.

---

### B11) Evaluation & QA Framework

**Summary**: Continuous evaluation of retrieval, ranking, synthesis, and UX effectiveness.

**Requirements**

* Golden tasks with expected sources/claims.
* RAGAS‑style scoring for faithfulness, answer relevancy, context precision/recall.
* Claim‑level LLM‑as‑judge with evidence links.
* A/B runs varying knobs and components; Pareto front dashboards.

**Acceptance Criteria**

* Weekly report with regression thresholds and auto‑alerts.

**DAG**

1. Golden set → 2. Scorers → 3. CI hooks → 4. A/B infra → 5. Dashboards.

---

### B12) External Scholarly Integrations

**Summary**: Metadata & authority providers for ranking and provenance.

**Requirements**

* Clients & caches for Crossref, OpenAlex, Semantic Scholar, Unpaywall, venue rankings, and video captions API.
* Normalized "source profile" schema.
* Rate‑limit & retry policies; offline cache refresh jobs.

**Acceptance Criteria**

* ≥95% of scholarly items enriched with DOI, venue, citation counts, OA link when available.

**DAG**

1. Schema → 2. Client wrappers → 3. Caching → 4. Batch updaters → 5. Health checks.

---

## C. Cross‑Feature Program Plan & Timeline

### Milestones & Dependencies (DAG‑ordered)

1. **Foundations**

   * Event schema & bus (B8) → Run context store.
   * Basic fetch + Turndown (B2) → Indexer bootstrap.
2. **Core Search**

   * Hybrid retrieval (B4) → Orchestrator frontier (B1).
   * Pilot View shell (B5: layout, log, basic queue).
3. **Ranking & Core‑First**

   * Source classification + enrichment (B12) → Scoring & queue builder (B3) → Rank cards UI (B5).
4. **Graph Memory**

   * Graph merge/query (B4) → Frontier graph overlays (B5) → Community summaries.
5. **JS Path**

   * Router heuristics (B2) → Browserbase/Stagehand integration (B2) → JS policy & budget (B10).
6. **Review Mode**

   * Snapshot generator (B8) → Timeline player (B6) → KPI dashboard (B6) → Exports (B6).
7. **Reading Queue & Videos**

   * Origin detection (B7) → Captions alignment (B7) → Queue gaps & macros (B5/B7).
8. **Evaluation & Controls**

   * Evals (B11) → A/B comparator (B6) → Attribution analytics (B6).
9. **Security & Cost**

   * RBAC, audit, retention (B9) → Budget & caching (B10).

### Indicative Timeline

* **Phase 1 (Weeks 1–3)**: B8, B2 (basic), B4 (index), B1 (frontier), B5 (shell).
* **Phase 2 (Weeks 4–6)**: B12, B3 (ranking), B5 (rank cards), B2 (router), B10 (caches).
* **Phase 3 (Weeks 7–9)**: B2 (JS), B5 (graph overlays), B4 (community summaries), B7 (origin/queue).
* **Phase 4 (Weeks 10–12)**: B6 (replay + KPIs + exports), B11 (evals), B9 (RBAC/audit).

**Exit Criteria**

* MVP: Phases 1–2 complete; TTFC ≤120s; Authority Mix ≥50% L0/L1.
* V1: Phases 1–4 complete; full replay + exports; Evidence Robustness ≥2.0.

---

## D. Glossary

* **L0/L1/L2/L3/L4**: Source tiers from primary artifacts to practitioner forums.
* **TTFC**: Time to first core source.
* **Frontier**: Priority queue of next concepts/pages to explore.
* **Core proximity**: Citation‑graph distance to origin sources.
* **GraphRAG**: Retrieval augmented with graph structure and community summaries.
* **Why‑ranked**: Human‑readable breakdown of factors that produced a rank.
