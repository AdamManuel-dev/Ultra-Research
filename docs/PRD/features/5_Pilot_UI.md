# Feature PRD — Run Mode UI — “Pilot View”

**Product**: Deep Research Cockpit\
**Feature**: Run Mode UI — “Pilot View” (RMU)\
**Owner**: Experience & Research UX Team\
**Status**: Draft v1.0\
**Last Updated**: {{auto‑fill on save}}

---

## Table of Contents

1. [Summary](#summary)
2. [Objectives & Success Metrics](#objectives--success-metrics)
3. [Scope & Non‑Scope](#scope--non-scope)
4. [Personas & Use Cases](#personas--use-cases)
5. [Assumptions & Dependencies](#assumptions--dependencies)
6. [Information Architecture & Layout](#information-architecture--layout)
7. [Functional Requirements](#functional-requirements)
8. [Non‑Functional Requirements](#non-functional-requirements)
9. [UI Components & Interactions](#ui-components--interactions)
10. [Data Contracts (Consumed/Emitted)](#data-contracts-consumedemitted)
11. [State, Streaming & Error Handling](#state-streaming--error-handling)
12. [Accessibility, Intl & Theming](#accessibility-intl--theming)
13. [Observability & Telemetry](#observability--telemetry)
14. [Acceptance Criteria & Test Plan](#acceptance-criteria--test-plan)
15. [Implementation Plan & DAG](#implementation-plan--dag)
16. [Risks & Mitigations](#risks--mitigations)
17. [Open Questions](#open-questions)
18. [Appendix A — Wireframe Sketches](#appendix-a--wireframe-sketches)
19. [Appendix B — Example Payloads](#appendix-b--example-payloads)
20. [Appendix C — Keyboard Map](#appendix-c--keyboard-map)

---

## Summary

The **Run Mode UI — “Pilot View”** is the real‑time cockpit for steering research. It exposes strategy controls (depth, breadth, core‑first, verify, compare, pivot), visualizes the exploration frontier as a concept map, renders a **core‑first reading queue** (L0→L4), streams a live decision log, and surfaces operational status (latency, token spend, %JS, domain diversity, contradiction density). It supports **what‑if previews** for strategy tweaks and provides transparent **rank‑reason cards** for every source.

---

## Objectives & Success Metrics

### Objectives

1. Enable **in‑the‑moment steering** with visible, reversible changes and immediate previews.
2. Make ranking and scheduling **explainable** with per‑item “why‑ranked” breakdowns and decision groupings.
3. Reduce **TTFC** (Time‑to‑First‑Core) and increase **Authority Mix** during core‑first runs while preserving domain diversity.
4. Maintain **60fps** interactions on large graphs/lists via virtualization and progressive rendering.

### Success Metrics (P95 unless noted)

- Knob change → **preview** repaint ≤ **400 ms**; **commit** reflected in queue/frontier ≤ **800 ms**.
- **TTFC** improvement ≥ **20%** vs baseline (per program benchmarks).
- **Authority Mix** ≥ **60%** L0/L1 consumption for core‑first runs.
- **UI perf**: frame drops < **5%** during heavy streams; graph ops ≤ **16 ms**/frame.
- **Explainability coverage**: 100% of visible items have a rank‑reason card.

---

## Scope & Non‑Scope

**In Scope**

- Visual layout and interactions for Command Bar, Strategy Compass, Frontier Map, Reading Queue, Live Log, Status Strip.
- What‑if previews (client‑side) and result deltas (non‑destructive) with ability to commit.
- Rank‑reason breakdowns and action hints (open PDF, watch timestamps, etc.).
- Overrides (drag‑to‑reorder, pin concepts) with audit events.

**Out of Scope**

- Backend planning, ranking, fetching (owned by OSC/RSP/Fetch).
- Review Mode replay dashboards (separate feature).
- Team spaces/multi‑user cursors (future V2).

---

## Personas & Use Cases

- **Research Engineer/Analyst**: steers depth/breadth, prioritizes core sources, inspects contradictions.
- **Tech Lead/PM**: views costs, progress, and source quality; enforces core‑first gate.
- **Compliance/QA**: audits decisions and why‑rank; verifies robots/ToS adherence notices.

Use cases: rapid spec hunt, contested topic scan (contradictions), broad survey with diversity floor, author‑video first exploration.

---

## Assumptions & Dependencies

- **OSC** (Orchestrator & Strategy Controller) provides live events, frontier/plan snapshots, previews, commits.
- **RSP** (Ranking & Source Prioritization) provides ranked candidates, queue payloads, why‑rank breakdowns.
- **FEP** (Fetch Pipeline) provides artifact links and JS session replays.
- **GMG** (Graph Memory & GraphRAG) provides concept subgraphs, origin distances, contradictions, community summaries.
- SSE/WebSocket stream available; REST endpoints for snapshots.

---

## Information Architecture & Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Command Bar:  ⌘K  Depth ▢▢▢▢▢ | Breadth ▢▢▢ | Core‑first ⟲ | Verify ⟲ | Budget │
│  Strategy Compass • Source Filters • JS Policy                              │
├───────────────────┬───────────────────────────────┬────────────────────────┤
│ Frontier Map      │ Evidence & Reading Queue      │ Live Log & Decisions   │
│ (concept graph)   │ (L0→L4, rank cards, actions)  │ (events grouped by why)│
├───────────────────┴───────────────────────────────┴────────────────────────┤
│ Status: Latency • Tokens • %JS • Diversity • Contradiction Density ▲        │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Functional Requirements

**RMU‑FR‑01**: Display **Strategy Compass** with adjustable weights and immediate preview of predicted effects (L0/L1 share, TTFC estimate, cluster coverage).

**RMU‑FR‑02**: Render **Frontier Map** with clusters, centrality sizing, recency glow, contradiction halos, and exploration heat overlay (“agent is here”).

**RMU‑FR‑03**: Show **Reading Queue** lanes L0→L4; each item has type, score stack, why‑rank bullets, actions (open PDF/Watch/Read), and claim counts.

**RMU‑FR‑04**: Enable **drag‑to‑reorder** with override logging; allow **pinning** sources/concepts and **suppressing** items; reflect in OSC deltas.

**RMU‑FR‑05**: Stream **Live Log** with event filters (action/agent), decision groups (escalate to JS, breadth+2, pivot), and expandable inputs/scores/next tasks.

**RMU‑FR‑06**: Provide **Command Palette (⌘K)** with macros (Survey, Spec Hunt, Contradiction Hunt, Origin Trace, Video‑First) and quick actions (depth+/breadth+/pivot topic).

**RMU‑FR‑07**: Render **Status Strip** with gauges and alerts (L0/L1 quotas unmet, retraction flags, JS budget, budget risks) and tooltips linking to decision nodes.

**RMU‑FR‑08**: Support **What‑if Preview**: recompute visuals locally on cached candidates; on commit, send command to OSC and reconcile diffs.

**RMU‑FR‑09**: Provide **reason cards** for sources and decisions; allow “simulate alt weights” (ghost bars) for education without side effects.

**RMU‑FR‑10**: Persist **view state** (panel sizes, active filters, pinned items) per run; do not persist sensitive content.

**RMU‑FR‑11**: Offer **keyboard shortcuts** for all primary controls (see Appendix C) and full keyboard navigation.

**RMU‑FR‑12**: Include **search‑within‑run** across log entries, sources, and concepts.

**RMU‑FR‑13**: Provide **copy‑as‑citation** for selected claims with URL + quoted span hash.

---

## Non‑Functional Requirements

- **Performance**: 60fps target; graph render ≤16ms/frame; list virtualization for ≥10k rows; interaction latency ≤100ms for control feedback.
- **Resilience**: Continue rendering from local cache if stream hiccups; auto‑reconnect with backoff.
- **Compatibility**: Chromium/Firefox/Safari latest two versions; responsive down to 1280×800.
- **Security**: Sanitize all HTML; never execute third‑party scripts; CSP locked down.
- **Privacy**: No PII stored client‑side; redact tokens/headers in any displayed payloads.

---

## UI Components & Interactions

### 1) Command Bar

- **Controls**: Depth slider, Breadth slider, Core‑first toggle, Verify toggle, Compare (A vs B), Pivot (topic input), Source Filters (venue, OA, forums), JS Policy menu, Budget indicators.
- **Macros**: Survey, Spec Hunt, Contradiction Hunt, Origin Trace, Video‑First.
- **Feedback**: Inline badges show forecast deltas (TTFC, L0/L1%).

### 2) Strategy Compass

- Radar/polar chart of weights: Novelty, Centrality, Disagreement, Recency, Core‑Proximity, Diversity, User‑Interest.
- Drag handles or numeric inputs; makes **preview** calls to OSC or computes locally on cached set.
- **Ghost preview** overlays predicted changes.

### 3) Frontier Map (Graph)

- WebGL graph (Sigma.js/Cytoscape) with clustering; node size by centrality; color by community; glow by recency.
- Edge overlays: support/contradict density; core‑proximity contours.
- **Interactions**: hover summary; click focuses neighborhood; ALT‑click **pin**; SHIFT‑click **suppress**; marquee select to create **pivot**.

### 4) Evidence & Reading Queue

- Columns L0→L4 with per‑lane quotas; virtualized lists.
- **Rank card** contents: type badge, title, venue, OA, retraction flag, score stack (textrel/authority/coreprox/recency/indep/contentQ/type/penalties), actions, claims count.
- **Drag‑to‑reorder** with audit trail; **context menu** for “open best OA”, “watch timestamps”, “explain rank”, “simulate weights”.

### 5) Live Log & Decisions

- Streaming table with grouping headers for decision nodes.
- Filters: action, agent (osc, crawler/basic, crawler/js, ranker, graphrag, synthesizer), severity.
- **Expand** to see inputs, scores, chosen actions, next tasks, timings, token spend.

### 6) Status Strip

- Gauges: Latency, Tokens, %JS, Domain Diversity, Contradiction Density.
- Alerts: unmet L0/L1 quotas, retraction encountered, JS budget near limit, rate limit/backoff active.

### 7) Overlays & Tooltips

- All metrics have definitional tooltips; links jump to Review Mode documentation.

---

## Data Contracts (Consumed/Emitted)

### Consumed Streams (SSE/WS)

- `osc.decision`, `osc.frontier.update`, `osc.schedule`, `rsp.rank`, `rsp.queue`, `fetch.*`, `graphrag.*`, `synth.*`

**Event envelope**

```json
{ "ts": 173..., "run_id": "r-...", "type": "osc.decision", "payload": { ... } }
```

### Snapshot Endpoints (GET)

- `/osc/frontier/{run_id}` → frontier items + reasons
- `/osc/plan/{run_id}` → task graph
- `/rsp/queue/{run_id}` → L0→L4 queues
- `/graph/subgraph` (seeded by visible nodes)

### Preview/Commit (POST)

- `/osc/preview/{run_id}` `{knobs_delta}` → `{frontier_delta, queue_delta, eta_ms}`
- `/osc/commit/{run_id}` `{preview_id}` → `{committed: true}`

### UI‑Emitted Audit Events

- `ui.override.rank` (drag reorder), `ui.pin.concept`, `ui.suppress.item`, `ui.apply.macro`, `ui.preview`, `ui.commit`

---

## State, Streaming & Error Handling

- **Client Store**: run‑scoped state (Zustand/Redux); slices for compass, frontier, queue, log, status.
- \*\*Back‑pre
