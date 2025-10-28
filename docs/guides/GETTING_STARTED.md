# Getting Started with Deep Research Cockpit

> **Last Updated**: 2025-10-28
> **Target Audience**: Developers, Researchers, Analysts
> **Time to Complete**: 30-45 minutes

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Starting the System](#starting-the-system)
- [Verification](#verification)
- [First Research Session](#first-research-session)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

Before starting, ensure you have the following installed:

#### 1. Node.js and npm
```bash
# Check versions
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

**Installation**:
- macOS: `brew install node@18`
- Linux: Use [nvm](https://github.com/nvm-sh/nvm) or package manager
- Windows: Download from [nodejs.org](https://nodejs.org/)

#### 2. Docker and Docker Compose
```bash
# Check versions
docker --version         # Should be >= 20.10.0
docker-compose --version # Should be >= 2.0.0
```

**Installation**:
- macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
- Linux: [Docker Engine](https://docs.docker.com/engine/install/)
- Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)

#### 3. Git
```bash
# Check version
git --version  # Should be >= 2.30.0
```

### System Requirements

**Minimum**:
- 8GB RAM
- 20GB free disk space
- 2 CPU cores

**Recommended**:
- 16GB+ RAM (for smooth development)
- 50GB+ free disk space (for Docker volumes)
- 4+ CPU cores

---

## Installation

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/deep-research-cockpit.git
cd deep-research-cockpit

# Or if you already have it
cd /path/to/UltraResearch
```

### 2. Install Dependencies

```bash
# Install root dependencies and bootstrap packages
npm install

# This will:
# - Install Lerna and root devDependencies
# - Bootstrap all workspace packages (@deep-research/backend, frontend, shared)
# - Link internal package dependencies
```

**Expected output**:
```
lerna info bootstrap
lerna info Installing external dependencies
lerna info Symlinking packages and binaries
lerna success Bootstrapped 3 packages
```

### 3. Verify Installation

```bash
# Check that packages are linked correctly
npm run type-check

# Expected: TypeScript compilation succeeds for all packages
```

---

## Configuration

### 1. Environment Variables

Create environment configuration file:

```bash
# Copy example environment file
cp .env.example .env

# Open in editor
nano .env  # or vim, code, etc.
```

### 2. Required Configuration

Edit `.env` with the following values:

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=research_password

# OpenSearch Configuration
OPENSEARCH_NODE=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=Admin@123

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO (S3) Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=research-events

# API Keys (Optional - for development)
# Add these if you plan to test external integrations
# OPENAI_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here
```

### 3. Backend Package Configuration

```bash
# Backend-specific environment (optional overrides)
cp packages/backend/.env.example packages/backend/.env
```

---

## Starting the System

### 1. Start Infrastructure Services

Start Docker services (Neo4j, OpenSearch, Redis, MinIO):

```bash
# Start all services in detached mode
npm run docker:up

# Or use docker-compose directly
docker-compose up -d
```

**Services starting**:
- Neo4j (ports 7474, 7687)
- OpenSearch (ports 9200, 9600)
- OpenSearch Dashboards (port 5601)
- Redis (port 6379)
- MinIO (ports 9000, 9001)

**Wait for services to be healthy** (1-2 minutes):
```bash
# Watch service health
docker-compose ps

# All services should show "healthy" status
```

### 2. Initialize Databases

**Neo4j Setup**:
```bash
# Access Neo4j Browser
open http://localhost:7474

# Login credentials:
# Username: neo4j
# Password: research_password

# Run initial schema (optional - will be created automatically)
# But you can verify connection works
```

**OpenSearch Setup**:
```bash
# Verify OpenSearch is running
curl -k -u admin:Admin@123 https://localhost:9200

# Expected response: Cluster information JSON

# Access OpenSearch Dashboards (optional)
open http://localhost:5601
```

**MinIO Setup**:
```bash
# Access MinIO Console
open http://localhost:9001

# Login credentials:
# Username: minioadmin
# Password: minioadmin

# Create bucket (will be auto-created by backend, but you can do manually):
# 1. Navigate to "Buckets"
# 2. Click "Create Bucket"
# 3. Name: "research-events"
# 4. Click "Create"
```

### 3. Start Development Servers

```bash
# Start all packages in parallel (backend + frontend)
npm run dev

# This runs:
# - Backend: Express server on http://localhost:3001
# - Frontend: Vite dev server on http://localhost:3000
```

**Expected output**:
```
lerna info watch Package @deep-research/backend started
lerna info watch Package @deep-research/frontend started

[backend] Server listening on port 3001
[backend] Connected to Neo4j
[backend] Connected to OpenSearch
[frontend] VITE ready in 1234 ms
[frontend] http://localhost:3000
```

---

## Verification

### 1. Health Check

```bash
# Check backend health
curl http://localhost:3001/health

# Expected response:
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

### 2. Frontend Access

```bash
# Open frontend in browser
open http://localhost:3000

# You should see:
# - Deep Research Cockpit landing page
# - Navigation working
# - No console errors
```

### 3. Event Streaming Test

```bash
# Test SSE connection
curl -N http://localhost:3001/events/stream

# Should establish connection (will wait for events)
# Press Ctrl+C to stop
```

### 4. Database Connections

**Neo4j**:
```bash
# Test Cypher query
curl -X POST http://localhost:7474/db/data/transaction/commit \
  -H "Content-Type: application/json" \
  -u neo4j:research_password \
  -d '{"statements":[{"statement":"RETURN 1 as test"}]}'

# Should return result with "test": 1
```

**Redis**:
```bash
# Test Redis connection
docker exec research-redis redis-cli ping
# Expected: PONG
```

---

## First Research Session

Now that everything is running, let's create your first research session!

### 1. Navigate to Run Mode

1. Open http://localhost:3000
2. Click **"New Research Session"**
3. Enter a research query, for example:
   ```
   "How does Retrieval Augmented Generation (RAG) work?"
   ```

### 2. Explore the Interface

**Strategy Controls** (not fully functional yet in pre-alpha):
- Depth/Breadth slider
- Core-First toggle
- Verify intensity

**Live Log** (right panel):
- Watch events stream in real-time
- Events show: orchestrator planning, fetch operations, indexing

**Status Bar** (bottom):
- Connection status
- Event count
- Service health

### 3. Monitor Backend

In your terminal where `npm run dev` is running, you should see:

```
[backend] Event published: orchestrator:plan
[backend] Event published: fetch:http_start
[backend] Event published: fetch:http_complete
[backend] Event published: index:document
```

### 4. Check Storage

**Events in OpenSearch**:
```bash
# Query recent events
curl -k -u admin:Admin@123 -X GET \
  "https://localhost:9200/events/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{"query": {"match_all": {}}, "size": 5}'
```

**Events in MinIO**:
1. Open http://localhost:9001
2. Navigate to bucket `research-events`
3. You should see JSONL files organized by run_id

### 5. Stop the Session

- Click **"Stop"** button in UI
- Session complete!
- Events are persisted and queryable

---

## Troubleshooting

### Docker Services Won't Start

**Symptom**: `docker-compose up` fails or services show "unhealthy"

**Solutions**:

1. **Check port conflicts**:
   ```bash
   # Check if ports are already in use
   lsof -i :7474  # Neo4j HTTP
   lsof -i :7687  # Neo4j Bolt
   lsof -i :9200  # OpenSearch
   lsof -i :6379  # Redis
   lsof -i :9000  # MinIO

   # Kill conflicting processes or change ports in docker-compose.yml
   ```

2. **Increase Docker resources**:
   - Docker Desktop → Preferences → Resources
   - Increase RAM to at least 8GB
   - Increase disk space if needed

3. **Check Docker logs**:
   ```bash
   docker-compose logs neo4j
   docker-compose logs opensearch
   docker-compose logs redis
   ```

4. **Reset Docker volumes** (nuclear option):
   ```bash
   docker-compose down -v  # CAUTION: Deletes all data
   docker-compose up -d
   ```

### Backend Won't Connect to Services

**Symptom**: Health check fails, services show "disconnected"

**Solutions**:

1. **Verify service URLs in .env**:
   ```bash
   # Check that URLs match docker-compose ports
   cat .env | grep -E "(NEO4J|OPENSEARCH|REDIS|MINIO)"
   ```

2. **Test connectivity**:
   ```bash
   # Neo4j
   curl http://localhost:7474

   # OpenSearch
   curl -k -u admin:Admin@123 https://localhost:9200

   # Redis
   docker exec research-redis redis-cli ping

   # MinIO
   curl http://localhost:9000/minio/health/live
   ```

3. **Check backend logs**:
   ```bash
   # Look for connection errors
   # In npm run dev output, look for errors like:
   # "Failed to connect to Neo4j"
   # "OpenSearch connection refused"
   ```

### Port 3000 or 3001 Already in Use

**Symptom**: `EADDRINUSE: address already in use :::3000`

**Solutions**:

1. **Find and kill process**:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   ```

2. **Change ports**:
   ```bash
   # Edit .env
   PORT=3002  # Backend will use 3002 instead

   # Edit packages/frontend/vite.config.ts
   # Change server.port to different value
   ```

### TypeScript Errors

**Symptom**: Type check fails, IDE shows errors

**Solutions**:

1. **Rebuild packages**:
   ```bash
   npm run clean
   npm install
   npm run build
   ```

2. **Verify shared package is built**:
   ```bash
   ls packages/shared/dist
   # Should contain compiled .js and .d.ts files
   ```

3. **Restart TypeScript server** (in VS Code):
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "TypeScript: Restart TS Server"

### Frontend Shows Blank Page

**Symptom**: Browser shows blank page or errors in console

**Solutions**:

1. **Check browser console** (F12):
   - Look for network errors
   - Check if backend API is reachable

2. **Verify backend is running**:
   ```bash
   curl http://localhost:3001/health
   # Should return JSON health status
   ```

3. **Clear browser cache**:
   - Hard refresh: `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows/Linux)
   - Or clear cache in DevTools → Application → Clear Storage

4. **Check Vite dev server**:
   ```bash
   # In npm run dev output, look for:
   # [frontend] VITE ready in X ms
   # [frontend] http://localhost:3000
   ```

---

## Next Steps

Congratulations! You have Deep Research Cockpit running locally. 🎉

### Learn More

1. **[Development Guide](DEVELOPMENT.md)** - Development workflow and best practices
2. **[Testing Guide](TESTING.md)** - Running and writing tests
3. **[Architecture Overview](../../ARCHITECTURE.md)** - System design and components
4. **[Contributing Guide](../../CONTRIBUTING.md)** - How to contribute

### Explore the System

1. **Try different queries**:
   - Technical topics (RAG, transformers, vector databases)
   - Research questions (climate change, quantum computing)
   - Comparison queries (React vs Vue, SQL vs NoSQL)

2. **Experiment with controls** (when fully implemented):
   - Adjust Depth/Breadth slider
   - Toggle Core-First mode
   - Change verification intensity

3. **Explore storage**:
   - OpenSearch Dashboards: http://localhost:5601
   - Neo4j Browser: http://localhost:7474
   - MinIO Console: http://localhost:9001

4. **Review event logs**:
   - Watch real-time SSE stream
   - Query events via API
   - Download JSONL files from MinIO

### Development Tasks

Ready to contribute? Pick a task:

- Implement missing features (see `docs/PRD/`)
- Add tests for existing components
- Improve error handling
- Optimize performance
- Enhance documentation

---

## Quick Reference

### Common Commands

```bash
# Start everything
npm run docker:up && npm run dev

# Stop everything
docker-compose down
# Press Ctrl+C in terminal running npm run dev

# Restart backend only
# Press Ctrl+C in dev terminal, then:
cd packages/backend && npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check

# View Docker logs
npm run docker:logs

# Clean everything
npm run clean
docker-compose down -v  # WARNING: Deletes all data
```

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:3001 | - |
| Neo4j Browser | http://localhost:7474 | neo4j / research_password |
| OpenSearch | https://localhost:9200 | admin / Admin@123 |
| OpenSearch Dashboards | http://localhost:5601 | admin / Admin@123 |
| Redis | localhost:6379 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |

---

**Need Help?**

- Check [Troubleshooting section](#troubleshooting)
- Review [Architecture docs](../../ARCHITECTURE.md)
- Open an issue on GitHub
- Ask in community channels

Happy researching! 🚀
