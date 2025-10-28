# Deployment Guide

> **Last Updated**: 2025-10-28
> **Status**: Planning Phase - Production deployment not yet tested
> **Target Audience**: DevOps, System Administrators

## Table of Contents

- [Overview](#overview)
- [Development Deployment](#development-deployment)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Current Status**: Deep Research Cockpit is in pre-alpha phase. This guide outlines planned deployment strategies that will be tested and refined as the project matures.

### Deployment Environments

| Environment | Purpose | Infrastructure |
|-------------|---------|---------------|
| **Development** | Local development | Docker Compose |
| **Staging** | Pre-production testing | Cloud services (planned) |
| **Production** | Live system | Cloud services (planned) |

---

## Development Deployment

### Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose v2.0+
- 8GB+ RAM available
- 20GB+ disk space

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/deep-research-cockpit.git
cd deep-research-cockpit

# Install dependencies
npm install

# Start services
npm run docker:up

# Start development servers
npm run dev
```

### Services

Development environment includes:

```
Service           Port(s)          Purpose
───────────────────────────────────────────────────────
Backend API       3001            Express REST API
Frontend UI       3000            Vite dev server
Neo4j Browser     7474            Graph database UI
Neo4j Bolt        7687            Graph database protocol
OpenSearch        9200, 9600      Search engine
OpenSearch Dash   5601            Search UI
Redis             6379            Cache
MinIO Console     9001            Object storage UI
MinIO API         9000            Object storage API
```

### Configuration

**Environment Variables** (.env):
```bash
# Development defaults
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Service connections (Docker)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=research_password

OPENSEARCH_NODE=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=Admin@123

REDIS_HOST=localhost
REDIS_PORT=6379

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### Stopping Services

```bash
# Stop dev servers (Ctrl+C in terminal)

# Stop Docker services
npm run docker:down

# Remove volumes (WARNING: Deletes all data)
docker-compose down -v
```

---

## Staging Deployment

> **Status**: Planned - Configuration to be tested

### Architecture

**Planned staging setup**:
- Containerized services (Kubernetes or ECS)
- Managed databases (Neo4j Aura, Amazon OpenSearch)
- Cloud storage (S3)
- Load balancer for backend
- CDN for frontend static assets

### Prerequisites

- Cloud account (AWS, GCP, or Azure)
- Container registry access
- CI/CD pipeline configured
- Domain name and SSL certificates

### Build Process

```bash
# Build production images
npm run build

# Build Docker images
docker build -t deep-research-backend:latest packages/backend
docker build -t deep-research-frontend:latest packages/frontend

# Tag images
docker tag deep-research-backend:latest registry.example.com/backend:staging
docker tag deep-research-frontend:latest registry.example.com/frontend:staging

# Push to registry
docker push registry.example.com/backend:staging
docker push registry.example.com/frontend:staging
```

### Configuration

**Staging environment variables**:
```bash
NODE_ENV=staging
PORT=3001

# Managed services
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<strong-password>

OPENSEARCH_NODE=https://your-domain.region.es.amazonaws.com
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=<strong-password>

REDIS_HOST=your-cluster.region.cache.amazonaws.com
REDIS_PORT=6379
REDIS_TLS=true

S3_BUCKET=research-events-staging
S3_REGION=us-east-1

# External APIs (non-production keys)
OPENAI_API_KEY=<staging-key>
ANTHROPIC_API_KEY=<staging-key>
```

### Deployment Steps

**Using Kubernetes** (example):

1. **Create namespace**:
   ```bash
   kubectl create namespace deep-research-staging
   ```

2. **Create secrets**:
   ```bash
   kubectl create secret generic db-credentials \
     --from-literal=neo4j-password=<password> \
     --from-literal=opensearch-password=<password> \
     -n deep-research-staging
   ```

3. **Apply configurations**:
   ```bash
   kubectl apply -f k8s/staging/backend-deployment.yaml
   kubectl apply -f k8s/staging/backend-service.yaml
   kubectl apply -f k8s/staging/ingress.yaml
   ```

4. **Verify deployment**:
   ```bash
   kubectl get pods -n deep-research-staging
   kubectl logs -f deployment/backend -n deep-research-staging
   ```

---

## Production Deployment

> **Status**: Planned - Not yet deployed to production

### Architecture (Planned)

```
                    ┌──────────────┐
                    │   CloudFlare │
                    │   CDN + WAF  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Load Balancer│
                    │   (ALB/NLB)  │
                    └──────┬───────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
    ┌─────▼─────┐                    ┌─────▼─────┐
    │ Frontend  │                    │  Backend  │
    │ (Static)  │                    │  (ECS)    │
    │  S3+CF    │                    │  3 nodes  │
    └───────────┘                    └─────┬─────┘
                                           │
          ┌────────────────┬───────────────┼──────────────┐
          │                │               │              │
    ┌─────▼─────┐    ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
    │   Neo4j   │    │OpenSearch│   │  Redis  │   │   S3    │
    │   Aura    │    │  Service │   │ Cluster │   │ Bucket  │
    │  Cluster  │    │  Cluster │   └─────────┘   └─────────┘
    └───────────┘    └──────────┘
```

### Prerequisites

- Production cloud account with appropriate limits
- Container orchestration (ECS, EKS, GKE)
- Managed database services
- Monitoring and alerting configured
- Backup and disaster recovery plan
- Security audit completed

### Security Checklist

**Before production**:
- [ ] All secrets in secret manager (not environment variables)
- [ ] TLS/SSL certificates configured
- [ ] HTTPS enforced on all endpoints
- [ ] Database encryption at rest enabled
- [ ] Database encryption in transit enabled
- [ ] Network security groups configured
- [ ] WAF rules configured
- [ ] DDoS protection enabled
- [ ] Audit logging enabled
- [ ] Backup strategy tested
- [ ] Disaster recovery plan documented
- [ ] Security scanning in CI/CD
- [ ] Dependency vulnerability scanning
- [ ] Rate limiting configured
- [ ] CORS policies reviewed

### Configuration

**Production environment** (managed via secret manager):
```bash
NODE_ENV=production
PORT=3001

# Managed services with high availability
NEO4J_URI=neo4j+s://cluster.databases.neo4j.io
OPENSEARCH_NODE=https://vpc-cluster.region.es.amazonaws.com
REDIS_HOST=cluster.region.cache.amazonaws.com
S3_BUCKET=research-events-production

# Monitoring
SENTRY_DSN=<sentry-dsn>
DATADOG_API_KEY=<datadog-key>

# External APIs (production keys)
# Stored in AWS Secrets Manager/GCP Secret Manager/Azure Key Vault
```

### Deployment Process

**CI/CD Pipeline** (GitHub Actions example):

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY

      - name: Build and push images
        run: |
          docker build -t $ECR_REGISTRY/backend:$GITHUB_SHA packages/backend
          docker push $ECR_REGISTRY/backend:$GITHUB_SHA

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster production-cluster \
            --service backend-service \
            --force-new-deployment

      - name: Verify deployment
        run: |
          # Health check script
          ./scripts/verify-deployment.sh

      - name: Notify team
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
```

### Rollback Plan

**In case of deployment issues**:

1. **Immediate rollback**:
   ```bash
   # Rollback to previous ECS task definition
   aws ecs update-service \
     --cluster production-cluster \
     --service backend-service \
     --task-definition backend:previous-revision

   # Or use Kubernetes rollback
   kubectl rollout undo deployment/backend -n production
   ```

2. **Database rollback** (if schema changed):
   ```bash
   # Run migration rollback
   npm run migrate:down

   # Or restore from backup
   aws rds restore-db-instance-from-snapshot
   ```

3. **Notify team**:
   - Post incident in Slack/Discord
   - Update status page
   - Create incident report

---

## Monitoring & Maintenance

### Health Checks

**Application health**:
```bash
# Backend health endpoint
curl https://api.yourdomain.com/health

# Expected response
{
  "status": "healthy",
  "services": {
    "neo4j": { "status": "connected", "latency_ms": 12 },
    "opensearch": { "status": "connected", "latency_ms": 45 },
    "redis": { "status": "connected", "latency_ms": 3 }
  },
  "uptime_seconds": 86400,
  "version": "0.1.0"
}
```

### Monitoring Metrics

**Key metrics to monitor**:

**Application**:
- Request rate (req/sec)
- Error rate (%)
- Response time (P50, P95, P99)
- Active connections
- Memory usage
- CPU usage

**Databases**:
- Query latency
- Connection pool usage
- Disk usage
- Cache hit rate

**Business Metrics**:
- Active research sessions
- Events processed per minute
- Average session duration
- Error rate by endpoint

### Logging

**Structured logging** (JSON format):
```json
{
  "timestamp": "2025-10-28T13:21:12Z",
  "level": "info",
  "message": "Request completed",
  "run_id": "abc123",
  "step_id": "5",
  "duration_ms": 234,
  "status": 200,
  "path": "/events"
}
```

**Log aggregation**:
- Use CloudWatch Logs, Datadog, or ELK stack
- Set up alerts for error spikes
- Create dashboards for key metrics

### Alerting

**Critical alerts**:
- Error rate >5% (page immediately)
- Response time P95 >2s (page immediately)
- Database connection failures (page immediately)
- Disk usage >85% (warn)
- Memory usage >90% (warn)

**Configuration example** (CloudWatch Alarms):
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name high-error-rate \
  --alarm-description "Error rate exceeds 5%" \
  --metric-name ErrorRate \
  --namespace DeepResearch \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Backup Strategy

**Neo4j backups**:
```bash
# Daily automated backups
neo4j-admin dump --database=neo4j --to=/backups/neo4j-$(date +%Y%m%d).dump

# Retention: 7 daily, 4 weekly, 12 monthly
```

**OpenSearch snapshots**:
```bash
# Configure S3 snapshot repository
curl -X PUT "https://opensearch:9200/_snapshot/backup_repo" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "s3",
    "settings": {
      "bucket": "opensearch-backups",
      "region": "us-east-1"
    }
  }'

# Daily snapshots
curl -X PUT "https://opensearch:9200/_snapshot/backup_repo/snapshot_$(date +%Y%m%d)"
```

**Event storage** (already in S3):
- Enable versioning
- Configure lifecycle policies
- Cross-region replication

---

## Troubleshooting

### High Memory Usage

**Symptoms**: Backend containers restarting, OOM errors

**Investigation**:
```bash
# Check memory usage
docker stats

# Check Node.js heap
curl http://localhost:3001/metrics | grep heap

# Check for memory leaks
node --inspect packages/backend/dist/index.js
```

**Solutions**:
- Increase container memory limits
- Implement event buffer limits
- Add memory leak detection
- Profile and optimize hot paths

### Database Connection Issues

**Symptoms**: "Connection refused" or "Too many connections"

**Investigation**:
```bash
# Check Neo4j connections
MATCH (n) RETURN count(n);

# Check OpenSearch health
curl -k -u admin:password https://opensearch:9200/_cluster/health

# Check Redis connections
redis-cli INFO clients
```

**Solutions**:
- Increase connection pool size
- Implement connection retry logic
- Add circuit breakers
- Scale database resources

### Slow Query Performance

**Symptoms**: High P95 latency, slow endpoints

**Investigation**:
```bash
# Profile Neo4j queries
PROFILE MATCH (c:Claim)-[:SUPPORTED_BY]->(s:Source) RETURN c, s

# Check OpenSearch slow logs
curl https://opensearch:9200/_cluster/settings?include_defaults=true | grep slowlog

# Enable Node.js profiler
node --prof packages/backend/dist/index.js
```

**Solutions**:
- Add database indexes
- Optimize query patterns
- Implement caching
- Scale read replicas

### Frontend Not Loading

**Symptoms**: Blank page, API errors

**Investigation**:
- Check browser console for errors
- Verify backend health endpoint
- Check network tab for failed requests
- Verify CORS configuration

**Solutions**:
- Clear browser cache
- Check backend logs
- Verify environment variables
- Check CORS allowed origins

---

## Next Steps

- **[Getting Started Guide](GETTING_STARTED.md)** - Local setup
- **[Development Guide](DEVELOPMENT.md)** - Development workflow
- **[Architecture Overview](../../ARCHITECTURE.md)** - System design
- **[Contributing Guide](../../CONTRIBUTING.md)** - How to contribute

---

**Need help with deployment?**

- Check documentation
- Search GitHub issues
- Ask in community channels
- Contact maintainers

---

**Note**: This deployment guide will be updated as we progress through alpha and beta phases with real-world deployment experience.
