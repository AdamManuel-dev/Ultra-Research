# Feature PRD — Fetch & Extraction Pipeline (Non‑JS + JS)

**Product**: Deep Research Cockpit  
**Feature**: Fetch & Extraction Pipeline (Non‑JS + JS)  
**Owner**: Acquisition & Parsing Team  
**Status**: Draft v1.0  
**Last Updated**: {{auto-fill on save}}

---

## Table of Contents
1. [Summary](#summary)
2. [Objectives & Success Metrics](#objectives--success-metrics)
3. [Scope & Non‑Scope](#scope--non-scope)
4. [Personas & Use Cases](#personas--use-cases)
5. [Assumptions & Dependencies](#assumptions--dependencies)
6. [Architecture & Components](#architecture--components)
7. [Functional Requirements](#functional-requirements)
8. [Non‑Functional Requirements](#non-functional-requirements)
9. [Routing Heuristics & Decision Logic](#routing-heuristics--decision-logic)
10. [Extraction Strategies](#extraction-strategies)
11. [Markdown Reduction & Chunking](#markdown-reduction--chunking)
12. [Normalization, Fingerprinting & Caching](#normalization-fingerprinting--caching)
13. [Compliance & Ethics](#compliance--ethics)
14. [Security & Privacy](#security--privacy)
15. [Observability & Replay](#observability--replay)
16. [Acceptance Criteria & Test Plan](#acceptance-criteria--test-plan)
17. [Implementation Plan & DAG](#implementation-plan--dag)
18. [Risks & Mitigations](#risks--mitigations)
19. [Open Questions](#open-questions)
20. [Appendix A — Pseudocode](#appendix-a--pseudocode)
21. [Appendix B — Example Payloads](#appendix-b--example-payloads)
22. [Appendix C — Error Taxonomy](#appendix-c--error-taxonomy)
23. [Appendix D — Config & Tuning Keys](#appendix-d--config--tuning-keys)

---

## Summary
The **Fetch & Extraction Pipeline** acquires web content efficiently and ethically, preferring **Non‑JS** HTTP fetch with robust main‑content extraction, and escalating to **JS rendering** (Browserbase + Stagehand + Playwright) only when necessary. All HTML is normalized, reduced to compact **Markdown** (Turndown), and segmented into heading‑aware chunks for indexing and graph enrichment. The pipeline emits a complete, queryable event log and deterministic artifacts for replay.

---

## Objectives & Success Metrics
### Objectives
1. **Minimize cost/latency** via Non‑JS by default; escalate to JS only when rendering is required.
2. Produce **clean, evidence‑ready** text (quotes, code blocks, figures/tables) with high main‑content precision.
3. Provide **structured metadata** (title, author, date, language, canonical URL, license, robots) and optional **structured fields** (tables, lists, schema.org microdata) for ranking and synthesis.
4. Guarantee **deterministic replay** with cached artifacts and event logs.

### Success Metrics (P95 unless noted)
- Basic fetch total time ≤ **600 ms**; JS fetch ≤ **3.0 s**.  
- JS Escalation Rate ≤ **25%** on general topics; ≤ **10%** for news/docs domains.  
- Extraction precision (main content vs boilerplate) ≥ **0.9** on golden set.  
- Markdown token reduction ≥ **40%** vs raw HTML.  
- Deterministic replay equivalence: **100%** on golden runs.

---

## Scope & Non‑Scope
**In Scope**
- HTTP fetching (redirects, compression, charset, cookies scoping) and robust error handling.
- JS rendering using **Browserbase + Stagehand + Playwright** with site playbooks.
- Main‑content extraction (Trafilatura/Readability) and **HTML→Markdown** reduction (Turndown service).
- Structured extraction hooks (title/author/date, tables, code blocks, OpenGraph/Schema.org, canonical link).
- Media handling: image alt text, figure captions, video transcript URLs (no media downloading by default).
- Compliance: robots.txt, meta robots, X‑Robots‑Tag, ToS‑aware rate limiting.
- Caching & deduplication; content fingerprinting; retries, backoff.

**Out of Scope**
- Bypassing paywalls or access controls.
- Opinionated summarization (handled by Synthesis).
- Ranking and reading‑queue policy (handled by RSP).

---

## Personas & Use Cases
- **Research Analyst**: wants fast, readable text and citations without UI cruft.
- **Retrieval Engineer**: needs stable chunks and consistent metadata for indexing.
- **Compliance Officer**: needs proof of robots/ToS adherence and fetch lineage.

Use cases: literature reviews, spec hunts, contradiction checks, code/API doc capture, dataset card ingestion, video transcript retrieval (via captions endpoints).

---

## Assumptions & Dependencies
- **Browserbase + Stagehand** available for JS rendering with session replay.
- **Turndown** service for HTML→Markdown; **Trafilatura** and **Readability‑lxml** available for main‑content extraction.
- **Event Store** for JSONL logs; **Object Storage** (e.g., S3/Azure Blob) for artifacts.
- **Robots/ToS Policy** enforced centrally; per‑domain rate limits configured.

---

## Architecture & Components
```mermaid
flowchart LR
  subgraph Router
    H[Heuristic Detector] --> R[Route Decision]
  end
  subgraph NonJS[Non‑JS Path]
    FB[Fetch Basic (HTTPX)] --> MC[Main Content (Trafilatura/Readability)]
  end
  subgraph JS[JS Path]
    BB[Browserbase Session] --> ST[Stagehand Actions] --> PC[Page Content]
  end
  R -->|SSR/Static| FB
  R -->|SPA/Dynamic| BB
  MC --> TD[Turndown (HTML→MD)]
  PC --> TD
  TD --> CH[Chunker]
  CH --> OUT[Artifacts: MD, Meta, Events]
  OUT --> IDX[Index & Graph]
  OUT --> LOG[Event Log]
```

---

## Functional Requirements
**FEP‑FR‑01**: **Router** must classify a URL as Non‑JS or JS based on signals (see Routing section) and per‑run **JS policy** and budget caps.

**FEP‑FR‑02**: **Fetch Basic** supports HTTP/2, gzip/br, redirects, cookies (scoped), **ETag/Last‑Modified**; obeys robots.txt; sets appropriate headers (UA, Accept‑Language, Accept, From).

**FEP‑FR‑03**: **JS Fetch** uses Browserbase + Stagehand to load, wait (DOMContentLoaded/network‑idle), optionally scroll, expand “read more,” dismiss consent banners, and capture the fully hydrated DOM; records a session link for replay.

**FEP‑FR‑04**: **Main‑Content Extraction** removes boilerplate (nav/footers/ads), retains headings, lists, tables, code blocks, and figure captions.

**FEP‑FR‑05**: **HTML→Markdown** reduction preserves headings (#..######), fenced code, tables, blockquotes, links, images (alt text), footnotes; rewrites relative links to absolute.

**FEP‑FR‑06**: **Structured Metadata** extraction: title, author(s), published/updated date (with timezone), canonical URL, language, license, robots directives, OpenGraph/Twitter cards, schema.org Article/Report.

**FEP‑FR‑07**: **Chunking** creates heading‑aware segments (600–1,000 tokens) with minimal overlap; embeds anchor context (H1→H3 trail) in each chunk.

**FEP‑FR‑08**: **Fingerprinting**: compute content hash (SHA‑256), SimHash for dedup/novelty, and stable canonical URL.

**FEP‑FR‑09**: **Caching**: HTTP cache (ETag/If‑None‑Match), content cache (HTML/MD), and enrichment cache; TTLs configurable; respect `Cache‑Control`.

**FEP‑FR‑10**: **Error Handling**: typed errors with retry/backoff; graceful partial results (e.g., metadata only) and rich diagnostics.

**FEP‑FR‑11**: **Internationalization**: detect language/script; normalize encodings; preserve Unicode and RTL where appropriate.

**FEP‑FR‑12**: **PDF & Non‑HTML**: detect and extract text (pdfminer/tika), retain headings/bookmarks, convert to Markdown; capture page numbers for citations.

**FEP‑FR‑13**: **Feeds**: optional RSS/Atom fetch for freshness tracking and incremental updates.

---

## Non‑Functional Requirements
- **Latency**: P95 end‑to‑end (Non‑JS) ≤ 600 ms; (JS) ≤ 3.0 s.
- **Throughput**: ≥ 150 Non‑JS pages/sec/node; ≥ 15 JS pages/sec/node with concurrency 4.
- **Reliability**: 99.5% availability; at‑least‑once logging.
- **Determinism**: Replay produces identical artifacts given same inputs.
- **Politeness**: Per‑domain concurrency & delay; honor robots, rate limits.
- **Resource Limits**: Max HTML size 6 MB; max DOM nodes 5e5 (JS path) with early abort.

---

## Routing Heuristics & Decision Logic
**Signals (Non‑JS vs JS escalation)**
- **Script/Text ratio** > threshold (e.g., 0.35) and **low visible text density**.
- Presence of SPA markers (`id="root"`, `data‑reactroot`, `ng‑app`, `__NEXT_DATA__`).
- Empty main content or placeholder skeleton classes.
- Blocks behind client‑side navigation/consent modals.
- Repeatedly missing content after Non‑JS fetch (heuristic counter).

**Policy Controls**
- `js_policy`: `auto | conservative | aggressive`.
- `%js_budget`: cap of pages/bytes/time allowed on JS path per run.

**Decision Tree (simplified)**
1. HEAD/GET Non‑JS; parse; if main content ≥ threshold → accept.
2. If not, check signals; if any strong signal and budget allows → JS path.
3. If JS path fails or budget exceeded → return Non‑JS artifacts with `partial=true` + reason.

---

## Extraction Strategies
### Non‑JS Path
- Fetch with `Accept: text/html,*/*` and language preference.
- Decode charset (Content‑Type or chardet fallback); unify to UTF‑8.
- Run Trafilatura; if confidence < threshold, fallback to Readability‑lxml.
- Parse metadata from `<title>`, `<meta>` (og:, twitter:), `<link rel=canonical>`, `<html lang>`, schema.org JSON‑LD.
- Preserve code blocks (`<pre><code>`), tables (`<table>`), math (`<span class="math">`/`<script type=math/tex>`), figure captions.

### JS Path (Browserbase + Stagehand + Playwright)
- Launch session; set viewport; navigate with retries.
- Wait strategy: `domcontentloaded` then `networkidle` (configurable); progressive snapshots.
- **Actions**: scroll to bottom; expand accordions; click "read more"; dismiss cookie/consent banners; paginate if infinite scroll (cap pages and height).
- **Extraction Hooks**: `page.extract({schema: ...})` for title/date/author, `page.content()` for full DOM.
- Save session replay link + HAR (where available).
- Capture **blocked reasons** (paywall/interstitial) without bypassing.

---

## Markdown Reduction & Chunking
- Turndown with presets: `headingStyle: 'atx'`, `codeBlockStyle: 'fenced'`, `bulletListMarker: '-'`.
- Plugins: tables, strikethrough, task lists, math passthrough, footnotes.
- Link rewriting: relative→absolute; preserve anchors; annotate with `[text](url)` and inline title when available.
- Image handling: keep `![alt](url)` if alt present; omit huge data‑URIs.
- Footnote normalization; blockquote fidelity.
- **Chunking**: heading‑aware; include breadcrumb (H1→H3) header inside each chunk; token target 600–1,000; overlap ≤ 10%.

---

## Normalization, Fingerprinting & Caching
- **Canonicalization**: use `<link rel=canonical>`; strip UTM/query noise; normalize trailing slashes.
- **Fingerprinting**: SHA‑256 of normalized HTML; **SimHash** for near‑duplicate detection; content versioning per ETag/Last‑Modified.
- **Caching**: layered (HTTP cache → HTML cache → Markdown cache); TTL defaults (e.g., 24h news, 7d docs); revalidation on access.
- **Sitemaps/Feeds**: optional for delta discovery; store last‑seen checkpoint.

---

## Compliance & Ethics
- Respect `robots.txt`, `meta robots`, `X‑Robots‑Tag` (e.g., `noindex`, `noarchive`).
- Adhere to site Terms of Service; no circumvention of paywalls or access controls.
- Identify via descriptive User‑Agent; provide contact email in `From` header.
- Honor robots crawl‑delay and per‑domain concurrency caps.

---

## Security & Privacy
- **Cookies**: scope to session; do not persist outside run; mask in logs.
- **Headers**: redact auth tokens; never log bearer/API keys.
- **Data**: PII minimization; allow domain‑level redaction policies; encryption at rest/in transit.
- **Sandboxing**: JS sessions isolated; disable dangerous APIs; download prompts blocked.

---

## Observability & Replay
- **Events**: `fetch.start`, `fetch.success`, `fetch.error`, `route.escalate`, `extract.main`, `reduce.md`, `chunk.write` (with sizes and timings).
- **Artifacts**: store raw HTML (optional), Markdown, metadata JSON, screenshot (JS optional), and hash values.
- **Replay**: load artifacts by `content_hash` and re‑emit events; Stagehand session URL for visual playback.
- **KPIs**: latency histograms, escalation rate, extraction precision, token reduction, cache hit rate.

---

## Acceptance Criteria & Test Plan
**AC‑1**: Router chooses Non‑JS for SSR pages and JS for SPAs with ≥95% accuracy on golden set.

**AC‑2**: P95 latency within budgets (Non‑JS ≤600 ms; JS ≤3.0 s) over benchmark corpus.

**AC‑3**: Main‑content extraction preserves headings, code, tables, captions; boilerplate ≤10% of tokens.

**AC‑4**: Markdown reduction achieves ≥40% token savings without losing quoted spans used in synthesis.

**AC‑5**: Deterministic replay reproduces artifacts and event sequence exactly for golden runs.

**AC‑6**: Robots/ToS compliance logged for every fetch; violations prevented by policy engine.

**Test Plan**
- **Golden Corpus**: 200 URLs (SSR news/docs, SPA blogs, infinite scroll, cookie banners, GitHub repos, arXiv PDFs, W3C specs, StackOverflow, vendor forums, JS‑rendered doc sites, math heavy pages).
- **Metrics**: extraction precision/recall via labeled DOM regions; token counts; diff of quotes.
- **Chaos**: induced network failures, timeouts, flaky JS loads; ensure retries/backoff and partial results.
- **I18N**: pages in 10 languages, RTL included; encodings (UTF‑8, ISO‑8859‑1, Shift‑JIS).

---

## Implementation Plan & DAG
1. **Event Schema & Logging** → validators; stream endpoints.
2. **Fetch Basic Service** → HTTPX client; redirects; compression; charset; robots.
3. **Main‑Content Extractors** → Trafilatura + Readability fallback; confidence scoring.
4. **Turndown Microservice** → HTML→MD; plugins; link rewriting.
5. **Router Heuristics** → signals; policy controls; unit tests.
6. **Browserbase + Stagehand Integration** → session lifecycle; actions; extraction hooks; screenshots.
7. **Chunker** → heading‑aware segmentation; breadcrumbs; overlap.
8. **Fingerprinting & Caching** → SHA‑256, SimHash; layered caches; TTLs; revalidation.
9. **PDF/Non‑HTML Handler** → pdfminer/tika; page/figure mapping.
10. **Observability Dashboards** → latency, escalation, precision, token reduction.
11. **Hardening** → rate limits, circuit breakers, memory guards; compliance gates.

**Exit Criteria (Feature‑Complete)**: All Acceptance Criteria met; golden runs stable; dashboards operational.

---

## Risks & Mitigations
- **Anti‑bot/Interstitals**: Use polite crawling; respect consent flows; do not bypass; surface partials with reasons.
- **Infinite Scroll Costs**: Cap scroll depth/time; require explicit allow‑list for pagination.
- **Extraction Drift**: Sites change markup → add per‑domain playbooks and auto‑tests.
- **Charset/Encoding Issues**: Central decoder with heuristics; test matrix across encodings.
- **Replay Nondeterminism (JS)**: Pin versions; deterministic waits; disable animations where possible; capture HAR.

---

## Open Questions
1. Should we persist per‑domain **playbooks** (selectors/actions) and auto‑learn them via feedback?  
2. What is the default **scroll budget** for infinite scroll (time/height/pages)?  
3. Do we store raw HTML by default or behind a debug flag for cost/privacy?

---

## Appendix A — Pseudocode
```python
# Router (simplified)

def route(url, html_sniff, js_budget_left, policy):
    signals = detect_signals(html_sniff)
    if policy == 'conservative':
        if signals['spa'] or signals['empty_main']:
            return 'js' if js_budget_left else 'basic-partial'
        return 'basic'
    if policy == 'aggressive':
        return 'js' if js_budget_left else 'basic'
    # auto
    if signals['spa'] or signals['empty_main'] or signals['script_ratio'] > 0.35:
        return 'js' if js_budget_left else 'basic-partial'
    return 'basic'
```

```python
# Non‑JS fetch → extract → reduce

def fetch_basic(url):
    r = httpx.get(url, headers=UA, follow_redirects=True, timeout=20)
    html, meta = decode(r), read_meta(r)
    main, conf = trafilatura.extract(html, with_metadata=True), confidence(html)
    if conf < 0.6: main = readability(html)
    md = turndown(main.html or html)
    chunks = chunk(md)
    return artifacts(md, chunks, meta)
```

```ts
// JS fetch via Browserbase + Stagehand (sketch)
const session = await bb.sessions.create({ projectId })
const browser = await chromium.connectOverCDP(session.connectUrl)
const page = browser.contexts()[0].pages()[0]
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await clickReadMores(); await dismissConsent();
const meta = await page.extract({ schema: metaSchema })
const html = await page.content()
const md = await turndownSvc(html)
const chunks = chunk(md)
return { md, chunks, meta, sessionUrl: session.viewerUrl }
```

---

## Appendix B — Example Payloads
**/fetch/basic (response)**
```json
{
  "url": "https://example.com/article",
  "status": 200,
  "headers": {"content-type": "text/html; charset=utf-8"},
  "meta": {"title": "...", "lang": "en", "canonical": "https://example.com/a"},
  "html_hash": "sha256:...",
  "markdown": "# Title\n...",
  "chunks": [
    {"id": "c1", "breadcrumb": ["Title", "Sub"], "text": "..."}
  ],
  "partial": false,
  "robots": {"allowed": true, "directives": ["index"]},
  "timings_ms": {"fetch": 210, "extract": 80, "reduce": 45}
}
```

**/fetch/js (response)**
```json
{
  "url": "https://spa.example/app",
  "status": 200,
  "session": {"viewer": "https://browserbase/session/abc"},
  "meta": {"title": "...", "date": "2024-10-02"},
  "markdown": "# App Doc\n...",
  "chunks": [{"id":"c1","breadcrumb":["Doc"],"text":"..."}],
  "partial": false,
  "timings_ms": {"render": 1150, "content": 220, "reduce": 60}
}
```

---

## Appendix C — Error Taxonomy
- `FEP-001` Network timeout
- `FEP-002` DNS/Connect failure
- `FEP-003` HTTP 4xx (client policy)
- `FEP-004` HTTP 5xx (server)
- `FEP-005` Robots disallow / ToS block
- `FEP-006` JS budget exceeded
- `FEP-007` Extraction failure (non‑JS)
- `FEP-008` Render failure (JS)
- `FEP-009` Content too large
- `FEP-010` Unsupported MIME type

Include `reason`, `retryable`, `policy_action` in the payload.

---

## Appendix D — Config & Tuning Keys
- `router.script_text_ratio_threshold` (default 0.35)
- `router.text_density_threshold` (default 500 visible chars)
- `router.js_budget_pct` (default 0.25)
- `router.max_scroll_pages` (default 3)
- `router.max_dom_nodes` (default 500000)
- `extractor.trafilatura_confidence_min` (default 0.6)
- `turndown.table_support` (on)
- `chunk.tokens_target` (default 800)
- `chunk.tokens_overlap` (default 0.1)
- `cache.ttl.html` (24h), `cache.ttl.md` (7d)
- `http.timeout_ms` (20000)
- `http.max_size_mb` (6)

