# Feature PRD — Graph Memory & GraphRAG Retrieval

**Product**: Deep Research Cockpit  
**Feature**: Graph Memory & GraphRAG Retrieval (GMG)  
**Owner**: Knowledge Graph & Retrieval Team  
**Status**: Draft v1.0  
**Last Updated**: {{auto-fill on save}}

---

## Table of Contents
1. [Summary](#summary)
2. [Objectives & Success Metrics](#objectives--success-metrics)
3. [Scope & Non‑Scope](#scope--non-scope)
4. [Personas & Use Cases](#personas--use-cases)
5. [Assumptions & Dependencies](#assumptions--dependencies)
6. [Architecture & Data Flow](#architecture--data-flow)
7. [Knowledge Model (Schema)](#knowledge-model-schema)
8. [Ingestion & Canonicalization](#ingestion--canonicalization)
9. [GraphRAG Retrieval Pipeline](#graphrag-retrieval-pipeline)
10. [Community Detection & Summarization](#community-detection--summarization)
11. [Contradiction & Evidence Handling](#contradiction--evidence-handling)
12. [Data Model & API Contracts](#data-model--api-contracts)
13. [Observability, Lineage & Replay](#observability-lineage--replay)
14. [Non‑Functional Requirements](#non-functional-requirements)
15. [Acceptance Criteria & Test Plan](#acceptance-criteria--test-plan)
16. [Implementation Plan & DAG](#implementation-plan--dag)
17. [Risks & Mitigations](#risks--mitigations)
18. [Open Questions](#open-questions)
19. [Appendix A — Algorithms & Pseudocode](#appendix-a--algorithms--pseudocode)
20. [Appendix B — Example Payloads](#appendix-b--example-payloads)
21. [Appendix C — Indices & Tuning](#appendix-c--indices--tuning)

---

## Summary
The **Graph Memory & GraphRAG Retrieval (GMG)** feature stores and exploits structured knowledge to guide retrieval and synthesis. It persists **Concepts, Claims, Sources, Entities, and Relations** in a graph database and uses that structure to produce **graph‑guided retrieval**: queries are expanded with community summaries, origin‑proximity, and relationship cues (broader/narrower/analogy/contrast). GMG returns ranked contexts with explicit **provenance** and supports **determinstic replay**.

---

## Objectives & Success Metrics
### Objectives
1. Persist a durable **knowledge graph** that improves retrieval quality and exploration guidance.
2. Provide **graph‑guided retrieval** that fuses hybrid search (BM25 + dense/neural sparse) with graph context.
3. Maintain **community summaries** and **origin traces** to prioritize core sources and reveal adjacent concepts.
4. Expose **claim‑level evidence maps** (supports/contradicts) for use in synthesis and verification.

### Success Metrics (P95 unless noted)
- **Recall@k** on benchmark tasks: **+10%** vs hybrid‑only baseline.
- **TTFC** improvement from graph‑guided queries: **≥15%**.
- **Contradiction Surface Rate** (proportion of runs where a non‑trivial contradiction is surfaced): **≥25%** on contested topics.
- **Community Summary Freshness**: ≤ **5 min** lag after threshold updates.
- **Replay Equivalence**: **100%** on golden runs.

---

## Scope & Non‑Scope
**In Scope**
- Graph schema (nodes/edges), merge/upsert APIs, canonicalization/dedup.
- Graph‑guided retrieval (local subgraph + global context) with fusion.
- Community detection, summary nodes, and refresh policies.
- Origin set detection and citation‑distance calculations.
- Evidence/contradiction modeling and exposure.

**Out of Scope**
- Raw content fetching and Markdown reduction (handled by Fetch Pipeline).
- Document ranking policy details (handled by RSP); GMG provides features and expansions.
- UI components; GMG returns payloads consumed by Run/Review views.

---

## Personas & Use Cases
- **Research Engineer/Analyst**: needs adjacency exploration, origin tracing, contradiction surfacing.
- **Retrieval Engineer**: needs higher recall with fewer tokens via guided expansion.
- **Compliance/QA**: needs provenance and lineage of claims.

Use cases: literature reviews, spec hunts, controversy analysis, technology scans, dependency/impact mapping, update monitoring.

---

## Assumptions & Dependencies
- Graph DB: **Neo4j** or **Memgraph** with Cypher support; APOC available.
- Hybrid index: **OpenSearch** (BM25 + dense vectors; neural sparse optional).
- Claim/entity extraction available from upstream pipelines.
- Event store persists JSONL logs; object store persists artifacts.

---

## Architecture & Data Flow
```mermaid
flowchart LR
  F[Chunks+Metadata] --> IE[Claim/Entity Extractor]
  IE --> GM[Graph Merge]
  GM --> GC[Graph (Neo4j/Memgraph)]
  subgraph Retrieval
    Q[User Query] --> EX[Expansion Builder]
    EX --> HR[Hybrid Search]
    GC --> EX
    HR --> FU[Fusion & Rerank]
  end
  FU --> OUT[Contexts+Provenance]
  GC --> CS[Community Summarizer]
  CS --> SUM[Summary Notes]
  SUM --> EX
```

---

## Knowledge Model (Schema)
### Node Labels
- **Concept** `{id, name, aliases[], description, created_at, updated_at}`
- **Entity** `{id, canonical, types[], external_ids{}}`
- **Claim** `{id, text, stance: ('+','-','0'), confidence:0..1, extracted_at, hash}`
- **Source** `{url, domain, publisher, title, published_at, oa:boolean, retracted:boolean, paywalled:boolean, quality_score:0..1}`
- **Note** `{id, level: ('passage'|'doc'|'cluster'|'global'), md, created_at}`
- **Community** `{id, label, method: ('louvain'|'leiden'), size, updated_at}`
- **Author** `{id, name, affiliations[], h_index?, reputation?}` (optional)
- **Venue/Org** `{id, name, rank?, type}` (optional)

### Edge Types (with representative properties)
- `(Claim)-[:ABOUT]->(Concept|Entity)`
- `(Claim)-[:SUPPORTED_BY {span, quote_hash, date}]->(Source)`
- `(Claim)-[:CONTRADICTS {strength:0..1}]->(Claim)`
- `(Concept)-[:RELATED_TO {relation:'analogy'|'contrast'|'broader'|'narrower'|'cause'|'mitigates', weight:0..1}]->(Concept)`
- `(Source)-[:CITES {date}]->(Source)`
- `(Source)-[:AUTHORED_BY]->(Author)` ; `(Author)-[:AFFILIATED_WITH]->(Venue/Org)`
- `(Community)-[:CONTAINS]->(Concept|Claim|Source)`
- `(Note)-[:SUMMARIZES]->(Community)`

### Indices & Constraints (examples)
- `CONSTRAINT UniqueConcept IF NOT EXISTS ON (c:Concept) ASSERT c.id IS UNIQUE`
- `INDEX concept_name IF NOT EXISTS FOR (c:Concept) ON (c.name)`
- `CONSTRAINT UniqueClaim ON (cl:Claim) ASSERT cl.id IS UNIQUE`
- `INDEX claims_text_fts` (vendor‑specific FTS)
- `INDEX source_url UNIQUE`

---

## Ingestion & Canonicalization
1. **Extraction**: From reduced Markdown + metadata, identify claim sentences with quoted spans and map to Concepts/Entities.
2. **Canonicalization**: Compute `claim.hash` (e.g., MinHash/SimHash of normalized text); cluster near‑duplicates; prefer canonical form.
3. **Merge Policy**: Upsert nodes/edges; increment weights and timestamps; maintain `visit_count` and `last_seen` on Sources.
4. **Alias Handling**: For Concepts, merge on case‑insensitive name or explicit alias; maintain alias table.
5. **Edge Weighting**: Decay weights over time unless reaffirmed; configurable half‑lives.
6. **Validation**: Reject merges missing provenance; log incomplete records as `quarantine` for later triage.

---

## GraphRAG Retrieval Pipeline
**Inputs**: user query `q`, strategy knobs, graph, hybrid index.

### Steps
1. **Seed Identification**: Map `q` to Concepts via name/alias match and embedding similarity; if none, fall back to hybrid search only.
2. **Subgraph Extraction**: Collect k‑hop neighborhood around seeds (Concepts, top Claims, high‑quality Sources). Apply filters: recency, origin proximity, diversity.
3. **Query Expansion**:
   - Build **community summaries** (short synthetic descriptors) and use them as additional queries.
   - Add aliases/synonyms from Concepts; add top Claim keyphrases; add cited titles from core Sources.
4. **Hybrid Retrieval**: Issue RRF@k queries to the text index using: `{q}`, `{community summaries}`, `{concept aliases}`, `{claim keyphrases}`.
5. **Fusion & Rerank**: Merge results; apply graph priors: origin proximity, support/contradiction density, domain diversity; demote retracted sources; return final ranked contexts with provenance.
6. **Frontier Update (to Orchestrator)**: Suggest new Concepts to explore based on uncovered communities and contradictions.

### Fallbacks
- If no seeds match, run hybrid retrieval only; create tentative Concepts from high‑confidence results and retry steps 2–5.

---

## Community Detection & Summarization
- **Detection**: Periodic (and on thresholds) run of Louvain/Leiden over Concept+Claim subgraph (edge weights from RELATED_TO + SUPPORT/CONTRADICT counts).
- **Summaries**: For each Community, generate:
  - Title (short label), description (2–4 sentences), top Concepts/Claims/Sources, known controversies, origin Sources, open questions.
- **Refresh Policy**: Trigger when community size or edge weights change by δ% or on time interval (e.g., 15 min) during active runs.
- **Storage**: Persist as `Note(level:'cluster')` and link via `[:SUMMARIZES]`.

---

## Contradiction & Evidence Handling
- **Claim Polarity**: `stance` set to positive/negative/neutral; align contradictory pairs via textual entailment checks.
- **Evidence Density**: For each Claim, track count of independent supporting Sources; report independence score (domain/affiliation diversity).
- **Contradiction Surfacing**: During retrieval, promote neighborhoods with high `CONTRADICTS` density; return side‑by‑side context bundles.
- **Origin Traces**: For any Source, compute shortest citation paths to origin Sources; expose distance and path for ranking and UI.

---

## Data Model & API Contracts
### Merge / Upsert
- `POST /graph/merge`
  - **Req** `{nodes:[...], edges:[...]}` (batched; up to 5k items)
  - **Res** `{created:{nodes:n,edges:n}, updated:{nodes:n,edges:n}, skipped:{...}}`

### Query & Subgraph
- `POST /graph/subgraph`
  - **Req** `{seeds:{concepts:[...], claims:[...], sources:[...]}, hops:2, filters:{recency_days:365, origin_max:2}}`
  - **Res** `{nodes:[...], edges:[...]}`

### Retrieval (GraphRAG)
- `POST /graphrag/retrieve`
  - **Req** `{q:"...", mode:"local|global", seeds?, knobs?, k:50}`
  - **Res** `{contexts:[{url, chunk_id, score, why:{graph_priors, rrf}}, provenance:{concepts:[...], claims:[...], sources:[...]}}]`

### Communities
- `GET /graph/communities?method=louvain&updated_since=...`
- `POST /graph/community/summarize {id}` → `{note_id}`

### Origin Paths
- `GET /graph/origin_path?source_url=...&max_len=5` → `{distance, path:[urls]}`

### Stats & Health
- `GET /graph/stats` → counts, index health, refresh times.

---

## Observability, Lineage & Replay
- **Event Types**: `graph.merge`, `graph.canon`, `graphrag.expand`, `graphrag.retrieve`, `graphrag.fuse`, `graph.community.update`, `graph.summarize`.
- **Lineage**: Each Claim retains `SUPPORTED_BY` edges with quote spans and content hashes; all expansions include source lists.
- **Snapshots**: Periodic graph footprint snapshots for replay; diff tools to compare before/after merges and community assignments.
- **KPIs**: recall deltas, TTFC deltas, contradiction density exposed, community freshness lag, merge throughput.

---

## Non‑Functional Requirements
- **Latency**: Graph expansion + hybrid retrieval fusion ≤ **600 ms** P95 for k=50.
- **Throughput**: Merge ≥ **5k nodes/edges/sec** sustained with batching.
- **Availability**: ≥ **99.5%**; degraded mode (hybrid‑only) when graph is down.
- **Storage**: Efficient pruning and decay; configurable retention windows.
- **Determinism**: Stable tie‑breakers; seeded summarization; replayable runs.

---

## Acceptance Criteria & Test Plan
**AC‑1**: Graph‑guided retrieval improves Recall@50 by ≥10% on benchmark tasks vs hybrid baseline.  
**AC‑2**: TTFC reduces by ≥15% on core‑first tasks with origin proximity enabled.  
**AC‑3**: Community summaries appear within ≤5 min after threshold changes.  
**AC‑4**: For any claim in answers, at least one `SUPPORTED_BY` edge with exact quote hash is present.  
**AC‑5**: Deterministic replay reproduces expansions and ranked contexts on golden runs.  
**AC‑6**: APIs handle batches and return consistent IDs; subgraph filters honored.

**Test Plan**
- Golden topics with known origin papers/specs; expected origin distances.
- Retrieval A/B: hybrid‑only vs GraphRAG; report recall, TTFC, diversity.
- Contradiction benchmarks: ensure surfacing of opposing claims.
- Load tests for merge throughput and retrieval latency with concurrent runs.
- Replay tests comparing event sequences and outputs.

---

## Implementation Plan & DAG
1. **Schema & Indices** → constraints, indices, FTS if available.
2. **Merge API** → upsert semantics, alias handling, decays.
3. **Origin Detection** → compute origin set from ranking metadata (earliest high‑impact sources).
4. **Subgraph & Expansion Builder** → seeds mapping, k‑hop extraction, filters.
5. **Fusion Layer** → RRF + graph priors; scoring and tie‑breakers.
6. **Community Detection** → periodic job; initial summaries.
7. **Summarization Service** → community/cluster notes; seeded for determinism.
8. **Contradiction Modeling** → entailment checks and edges.
9. **APIs & Observability** → endpoints, events, dashboards.
10. **Hardening** → pruning/decay jobs; dedup; backup/restore; SLA alarms.

**Exit Criteria (Feature‑Complete)**: All acceptance criteria met; dashboards live; golden benchmarks green.

---

## Risks & Mitigations
- **Graph Bloat/Drift** → decay/archival policies; dedup with SimHash; per‑domain caps.
- **Noisy Claims** → confidence thresholds; require multiple independent supports for promotion.
- **Community Instability** → hysteresis in assignments; minimum size thresholds; smoothing.
- **Latency Spikes** → cache expansions; precompute community summaries; limit k‑hop size.
- **Provider Data Changes** → periodic re‑enrichment and integrity checks.

---

## Open Questions
1. Should summarization lean on extractive or abstractive style by default for auditability?  
2. How often should origin sets be recomputed for evolving topics?  
3. Do we expose a public Cypher endpoint or only templated queries?  
4. What decay half‑life defaults fit our domains (e.g., 90d for news, 365d for standards)?

---

## Appendix A — Algorithms & Pseudocode
### A1. Merge (Upsert) Pseudocode
```python
# Simplified merge for Concept and Claim

def merge_concept(tx, concept):
    tx.run('MERGE (c:Concept {id:$id})\n'
           'ON CREATE SET c.name=$name, c.aliases=$aliases, c.created_at=timestamp()\n'
           'ON MATCH SET c.name=coalesce($name,c.name), c.updated_at=timestamp()', concept)


def merge_claim(tx, claim, source_id, concept_ids):
    tx.run('MERGE (cl:Claim {id:$id})\n'
           'ON CREATE SET cl.text=$text, cl.stance=$stance, cl.confidence=$confidence, cl.hash=$hash, cl.extracted_at=timestamp()\n'
           'WITH cl\n'
           'MATCH (s:Source {url:$url})\n'
           'MERGE (cl)-[:SUPPORTED_BY {span:$span, quote_hash:$qh, date:$date}]->(s)',
           {**claim, 'url': source_id})
    for cid in concept_ids:
        tx.run('MATCH (cl:Claim {id:$id}),(c:Concept {id:$cid})\nMERGE (cl)-[:ABOUT]->(c)', {'id': claim['id'], 'cid': cid})
```

### A2. Expansion & Fusion Pseudocode
```python
def expand_query(q, seeds, graph, k=2):
    subgraph = k_hop(graph, seeds, k)
    summaries = summarize_communities(subgraph)
    aliases = collect_aliases(subgraph.concepts)
    keyphrases = top_claim_phrases(subgraph.claims)
    expanded = [q] + summaries + aliases + keyphrases
    return expanded


def graphrag_retrieve(q, seeds, knobs, k=50):
    expanded = expand_query(q, seeds, graph)
    hybrid = hybrid_rrf_search(expanded, top=3*k)
    for r in hybrid:
        r.graph_prior = prior_score(r, graph)  # origin distance, contradictions, diversity
        r.final = 0.8*r.rrf + 0.2*r.graph_prior  # tunable
    ranked = sorted(hybrid, key=lambda x: (-x.final, -x.rrf, x.url))
    return ranked[:k]
```

### A3. Community Summarization Trigger
```python
if delta_nodes > THRESH_N or delta_edges > THRESH_E or now-last_update > T_MAX:
    run_community_detection()
    for c in changed_communities:
        write_summary_note(c)
```

---

## Appendix B — Example Payloads
**/graphrag/retrieve (response excerpt)**
```json
{
  "contexts": [
    {
      "url": "https://example.org/paper.pdf#p=3",
      "chunk_id": "ck_92f",
      "score": 0.91,
      "why": {
        "rrf": 0.77,
        "graph_priors": {"origin_distance": 1, "community": "C12", "contradiction_density": 0.08}
      },
      "provenance": {
        "concepts": ["graphRAG", "origin tracing"],
        "claims": ["cl_102"],
        "sources": ["https://example.org/paper.pdf"]
      }
    }
  ]
}
```

**/graph/subgraph (response excerpt)**
```json
{
  "nodes": [{"id":"c_graphrag","label":"Concept"},{"id":"cl_102","label":"Claim"}],
  "edges": [{"from":"cl_102","to":"c_graphrag","type":"ABOUT"}]
}
```

---

## Appendix C — Indices & Tuning
- **Graph Indices**: `:Concept(name)`, `:Concept(id)`, `:Claim(id)`, `:Source(url)`, `:Community(id)`.
- **FTS (if available)**: claim text, concept names/aliases, source titles.
- **Parameters**:
  - `expansion.k_hops` (default 2)
  - `expansion.max_nodes` (default 5k)
  - `prior.origin_weight` (default 0.4)
  - `prior.contradiction_weight` (0.2)
  - `prior.diversity_weight` (0.15)
  - `summary.refresh_minutes` (15)
  - `decay.half_life_days` (90)
  - `merge.min_confidence` (0.6)
  - `contradiction.min_strength` (0.4)

