# Deep Research Cockpit - Documentation Index

> **Last Updated**: 2025-10-28
> **Version**: 0.1.0 (Pre-Alpha)
> **Project Status**: Foundation Phase

Welcome to the Deep Research Cockpit documentation! This index helps you find the right documentation for your needs.

---

## Quick Navigation by Role

### 👨‍💻 **For Developers**

**Getting Started**:
1. [Project README](../README.md) - Start here for project overview
2. [Getting Started Guide](guides/GETTING_STARTED.md) - Setup and installation
3. [Development Guide](guides/DEVELOPMENT.md) - Development workflow
4. [Architecture Overview](../ARCHITECTURE.md) - System design

**Deep Dives**:
- [Testing Guide](guides/TESTING.md) - Testing strategy and practices
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Deployment Guide](guides/DEPLOYMENT.md) - Deployment strategies

### 🔬 **For Researchers & Analysts**

**User Guides** (Coming Soon):
- Pilot View UI Guide - Master the live research interface
- Strategy Controls Guide - Steer exploration effectively
- Source Tiers & Core-First - Understanding authority ranking
- Reading Queue Management - Building optimal reading order
- Review Mode Deep Dive - Analyzing completed sessions

### 🏢 **For Technical Leaders & Product Managers**

**Strategic Documentation**:
- [Project README](../README.md) - Vision and key features
- [Architecture Overview](../ARCHITECTURE.md) - System design and components
- [PRD Suite](PRD/PRD.md) - Complete product requirements
- [Roadmap](../README.md#roadmap--status) - Development phases and timeline

**Evaluation**:
- Evaluation Framework (Coming Soon) - Quality metrics
- Cost & Performance Management (Coming Soon) - Budget controls
- Security & Compliance (Coming Soon) - Privacy and safety

---

## Documentation Structure

### 📁 Root Level

| Document | Description | Audience |
|----------|-------------|----------|
| [README.md](../README.md) | Project overview, features, quick start | Everyone |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System architecture and design | Developers, Tech Leads |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines | Contributors |
| [LICENSE](../LICENSE) | MIT License | Legal, Developers |

### 📚 Guides (docs/guides/)

| Guide | Description | Status |
|-------|-------------|--------|
| [GETTING_STARTED.md](guides/GETTING_STARTED.md) | Setup and installation | ✅ Complete |
| [DEVELOPMENT.md](guides/DEVELOPMENT.md) | Development workflow and standards | ✅ Complete |
| [TESTING.md](guides/TESTING.md) | Testing strategy and practices | ✅ Complete |
| [DEPLOYMENT.md](guides/DEPLOYMENT.md) | Deployment strategies | ✅ Complete |
| PILOT_VIEW.md | Run Mode UI guide | 🚧 Planned |
| REVIEW_MODE.md | Review Mode analysis guide | 🚧 Planned |
| STRATEGY_CONTROLS.md | Control system guide | 🚧 Planned |
| SOURCE_TIERS.md | Source classification guide | 🚧 Planned |

### 📋 Product Requirements (docs/PRD/)

| Document | Description | Status |
|----------|-------------|--------|
| [PRD.md](PRD/PRD.md) | Complete product requirements | ✅ Complete |
| Additional PRD Docs | Detailed specifications | ✅ Available |

### 🏗️ Architecture (Planned)

Future detailed architecture documentation:

| Document | Description | Status |
|----------|-------------|--------|
| EVENTS.md | Event schema and replay | 🚧 Planned |
| GRAPH.md | Neo4j schema and queries | 🚧 Planned |
| GRAPHRAG.md | Graph-guided retrieval | 🚧 Planned |
| SOURCE_CLASSIFICATION.md | L0-L4 detection | 🚧 Planned |
| RANKING_ALGORITHMS.md | Scoring function design | 🚧 Planned |

### 🔌 API Reference (Planned)

Future API documentation:

| Document | Description | Status |
|----------|-------------|--------|
| API_README.md | API overview | 🚧 Planned |
| ENDPOINTS.md | REST endpoint reference | 🚧 Planned |
| EVENTS_API.md | Event streaming API | 🚧 Planned |
| WEBSOCKET.md | WebSocket protocol | 🚧 Planned |

---

## Documentation by Topic

### Installation & Setup

**First time setup**:
1. [Prerequisites](guides/GETTING_STARTED.md#prerequisites) - Required software
2. [Installation](guides/GETTING_STARTED.md#installation) - Clone and install
3. [Configuration](guides/GETTING_STARTED.md#configuration) - Environment setup
4. [Starting System](guides/GETTING_STARTED.md#starting-the-system) - Launch services
5. [Verification](guides/GETTING_STARTED.md#verification) - Verify everything works

**Troubleshooting**:
- [Common Issues](guides/GETTING_STARTED.md#troubleshooting) - Solutions to common problems

### Development

**Workflow**:
1. [Development Loop](guides/DEVELOPMENT.md#development-workflow) - Daily workflow
2. [Project Structure](guides/DEVELOPMENT.md#project-structure) - Codebase organization
3. [Code Standards](guides/DEVELOPMENT.md#code-standards) - Style and conventions
4. [Git Workflow](guides/DEVELOPMENT.md#git-workflow) - Branches and commits

**Common Tasks**:
- [Adding API Endpoint](guides/DEVELOPMENT.md#adding-a-new-api-endpoint)
- [Adding Event Type](guides/DEVELOPMENT.md#adding-a-new-event-type)
- [Adding React Component](guides/DEVELOPMENT.md#adding-a-new-react-component)
- [Debugging](guides/DEVELOPMENT.md#debugging) - Debug backend and frontend

### Testing

**Test Types**:
- [Unit Tests](guides/TESTING.md#unit-tests) - Testing individual functions
- [Integration Tests](guides/TESTING.md#integration-tests) - Testing component interactions
- [E2E Tests](guides/TESTING.md#e2e-tests) - Testing user workflows (planned)

**Running Tests**:
- [All Tests](guides/TESTING.md#running-tests) - Run complete test suite
- [Specific Tests](guides/TESTING.md#specific-test-file) - Run individual tests
- [Coverage](guides/TESTING.md#coverage-reports) - Generate coverage reports

### Architecture

**System Design**:
- [System Overview](../ARCHITECTURE.md#system-overview) - High-level architecture
- [Components](../ARCHITECTURE.md#system-components) - Individual components
- [Data Flow](../ARCHITECTURE.md#data-flow-architecture) - How data flows through system
- [Technology Stack](../ARCHITECTURE.md#technology-stack) - Technologies used

**Deep Dives**:
- [Event-Driven Architecture](../ARCHITECTURE.md#event-driven-architecture)
- [Database Schemas](../ARCHITECTURE.md#database-schemas)
- [API Architecture](../ARCHITECTURE.md#api-architecture)
- [Security Architecture](../ARCHITECTURE.md#security-architecture)

### Deployment

**Environments**:
- [Development](guides/DEPLOYMENT.md#development-deployment) - Local Docker setup
- [Staging](guides/DEPLOYMENT.md#staging-deployment) - Pre-production (planned)
- [Production](guides/DEPLOYMENT.md#production-deployment) - Live system (planned)

**Operations**:
- [Monitoring](guides/DEPLOYMENT.md#monitoring--maintenance) - Health checks and metrics
- [Troubleshooting](guides/DEPLOYMENT.md#troubleshooting) - Common issues and solutions

### Contributing

**Getting Started**:
1. [Code of Conduct](../CONTRIBUTING.md#code-of-conduct) - Community guidelines
2. [Development Setup](../CONTRIBUTING.md#getting-started) - Fork and setup
3. [Finding Issues](../CONTRIBUTING.md#finding-issues-to-work-on) - What to work on

**Process**:
1. [Development Process](../CONTRIBUTING.md#development-process) - Creating issues and branches
2. [Pull Request Process](../CONTRIBUTING.md#pull-request-process) - Submitting changes
3. [Code Review](../CONTRIBUTING.md#pull-request-process) - Review expectations

---

## Learning Paths

### Path 1: New Contributor

**Goal**: Make your first contribution

1. Read [Project README](../README.md) - Understand the vision
2. Follow [Getting Started Guide](guides/GETTING_STARTED.md) - Setup locally
3. Review [Contributing Guide](../CONTRIBUTING.md) - Learn process
4. Check [Good First Issues](https://github.com/yourusername/deep-research-cockpit/labels/good%20first%20issue)
5. Make your contribution!

**Estimated time**: 2-3 hours

### Path 2: Understanding the System

**Goal**: Understand how Deep Research Cockpit works

1. Read [Project README](../README.md) - High-level overview
2. Review [Architecture Overview](../ARCHITECTURE.md) - System design
3. Explore [Event Schema](../ARCHITECTURE.md#event-driven-architecture) - Event structure
4. Study [Data Flow](../ARCHITECTURE.md#data-flow-architecture) - Request flow
5. Read [Graph Schema](../ARCHITECTURE.md#database-schemas) - Knowledge graph

**Estimated time**: 3-4 hours

### Path 3: Full Development Setup

**Goal**: Ready to develop features

1. Complete [Getting Started Guide](guides/GETTING_STARTED.md) - Installation
2. Read [Development Guide](guides/DEVELOPMENT.md) - Workflow
3. Review [Testing Guide](guides/TESTING.md) - Testing practices
4. Study [Code Standards](guides/DEVELOPMENT.md#code-standards) - Style guide
5. Practice with [Common Tasks](guides/DEVELOPMENT.md#common-tasks)
6. Review [Architecture](../ARCHITECTURE.md) - System understanding

**Estimated time**: 4-6 hours

### Path 4: System Administrator

**Goal**: Deploy and maintain the system

1. Read [Architecture Overview](../ARCHITECTURE.md) - Understand components
2. Review [Deployment Guide](guides/DEPLOYMENT.md) - Deployment strategies
3. Study [Monitoring](guides/DEPLOYMENT.md#monitoring--maintenance) - Observability
4. Learn [Troubleshooting](guides/DEPLOYMENT.md#troubleshooting) - Common issues
5. Setup [Health Checks](guides/DEPLOYMENT.md#health-checks) - Monitoring

**Estimated time**: 3-4 hours

---

## Frequently Asked Questions

### General

**Q: What is Deep Research Cockpit?**
A: A steerable AI research platform with real-time controls, graph memory, and verifiable lineage. See [README](../README.md) for details.

**Q: What's the current project status?**
A: Pre-Alpha, Foundation Phase. Core architecture implemented, features in development. See [Roadmap](../README.md#roadmap--status).

**Q: Can I use this in production?**
A: Not yet. The project is in early development. Follow progress on GitHub.

### Development

**Q: How do I get started developing?**
A: Follow the [Getting Started Guide](guides/GETTING_STARTED.md), then read [Development Guide](guides/DEVELOPMENT.md).

**Q: What programming languages are used?**
A: TypeScript (backend and frontend), with Node.js runtime. See [Technology Stack](../ARCHITECTURE.md#technology-stack).

**Q: How do I run tests?**
A: `npm run test` at root level. See [Testing Guide](guides/TESTING.md) for details.

**Q: How do I contribute?**
A: Read [Contributing Guide](../CONTRIBUTING.md) for the complete process.

### Architecture

**Q: What databases does it use?**
A: Neo4j (graph), OpenSearch (search), Redis (cache), MinIO (object storage). See [Architecture](../ARCHITECTURE.md).

**Q: How does event sourcing work?**
A: All actions emit immutable events stored in object storage and indexed in OpenSearch. See [Event-Driven Architecture](../ARCHITECTURE.md#event-driven-architecture).

**Q: How does graph memory work?**
A: Knowledge graph in Neo4j stores concepts, claims, sources, and relationships. See [Database Schemas](../ARCHITECTURE.md#database-schemas).

### Deployment

**Q: How do I deploy locally?**
A: Use Docker Compose. See [Development Deployment](guides/DEPLOYMENT.md#development-deployment).

**Q: Is cloud deployment supported?**
A: Planned but not yet tested. See [Production Deployment](guides/DEPLOYMENT.md#production-deployment).

**Q: How do I monitor the system?**
A: Health endpoints and structured logging. See [Monitoring](guides/DEPLOYMENT.md#monitoring--maintenance).

---

## Documentation Maintenance

### Updating Documentation

**When making changes**:
1. Update relevant documentation
2. Update `@lastmodified` date using system `date` command
3. Keep cross-references up to date
4. Add entries to this index if adding new docs

**Get current date**:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

### Documentation Standards

**File headers**:
```markdown
# Document Title

> **Last Updated**: 2025-10-28
> **Target Audience**: Developers, Users, etc.
> **Prerequisites**: Links to required reading (if any)
```

**Cross-references**:
- Use relative paths: `[Link](../ARCHITECTURE.md)`
- Include section anchors: `[Section](../ARCHITECTURE.md#section-name)`
- Verify links work after changes

### Documentation Roadmap

**Planned documentation**:
- [ ] User guides (Pilot View, Review Mode, Strategy Controls)
- [ ] API reference documentation
- [ ] Architecture deep dives (Events, Graph, GraphRAG)
- [ ] Video tutorials
- [ ] Interactive examples

---

## Getting Help

**Documentation Issues**:
- Found a broken link? [Report it](https://github.com/yourusername/deep-research-cockpit/issues/new)
- Documentation unclear? [Let us know](https://github.com/yourusername/deep-research-cockpit/issues/new)
- Want to improve docs? See [Contributing Guide](../CONTRIBUTING.md)

**Support Channels**:
- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - Questions and ideas
- Discord (Coming Soon) - Real-time chat

---

## Contributing to Documentation

We welcome documentation contributions!

**Ways to help**:
- Fix typos and grammatical errors
- Clarify confusing sections
- Add examples and code snippets
- Create diagrams and illustrations
- Write tutorials and how-tos
- Translate documentation (future)

See [Contributing Guide](../CONTRIBUTING.md) for the process.

---

**Last Updated**: 2025-10-28

This index is continuously updated as documentation evolves. Bookmark this page for easy navigation!
