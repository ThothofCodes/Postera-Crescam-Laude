# Staging Environment

## Overview

The staging environment is a complete replica of production used for testing, QA, and validation before deploying to production. It includes:

- **Isolated MongoDB instance** (port 27018)
- **Separate Redis instance** (port 6380)
- **Independent backend, frontend, and tech hub services**
- **Monitoring with Prometheus and Grafana**
- **Automatic deployments from develop branch**

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Staging Environment                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Nginx (8080)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Backend   │  │   Frontend  │  │   Tech Hub  │            │
│  │   (5010)    │  │   (3010)    │  │   (4330)    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MongoDB (27018) + Redis (6380)              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Monitoring (Prometheus + Grafana)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Port Allocation

| Service | Port | Description |
|---------|------|-------------|
| Backend | 5010 | API server |
| Frontend | 3010 | React application |
| Tech Hub | 4330 | Astro blog |
| MongoDB | 27018 | Database |
| Redis | 6380 | Cache & sessions |
| Nginx | 8080 | Reverse proxy |
| Grafana | 3002 | Monitoring dashboards |
| Prometheus | 9090 | Metrics collection |

## Quick Start

### Initial Setup

```bash
# Navigate to staging directory
cd deployment/staging

# Run setup script
./deploy-staging.sh setup

# Edit environment variables
nano .env.staging

# Start all services
./deploy-staging.sh start
```

### Access URLs

- **Frontend**: http://localhost:3010
- **Backend API**: http://localhost:5010/api/health
- **Tech Hub**: http://localhost:4330
- **Grafana**: http://localhost:3002 (admin/admin)
- **Prometheus**: http://localhost:9090

## Commands

### Service Management

```bash
# Start all services
./deploy-staging.sh start

# Stop all services
./deploy-staging.sh stop

# Restart all services
./deploy-staging.sh restart

# Check status
./deploy-staging.sh status

# View logs (all services)
./deploy-staging.sh logs

# View logs (specific service)
./deploy-staging.sh logs backend-staging
```

### Database Operations

```bash
# Run migrations
./deploy-staging.sh migrate

# Seed database with test data
./deploy-staging.sh seed

# Reset database (WARNING: destroys data)
./deploy-staging.sh reset
```

### Deployment

```bash
# Deploy new version
./deploy-staging.sh deploy

# Check health
./deploy-staging.sh health
```

## CI/CD Integration

### Automatic Deployments

The staging environment automatically deploys when:
- Code is pushed to the `develop` branch
- Pull requests are created targeting `main`

### Manual Deployments

```bash
# Via GitHub Actions
# 1. Go to Actions → Staging Deployment
# 2. Click "Run workflow"
# 3. Select action (deploy/seed/reset/status)
# 4. Click "Run workflow"
```

## Environment Variables

Copy `.env.staging` to `.env.staging.local` and configure:

```bash
# Required
MONGO_URI=mongodb://mongo-staging:27017/pcl_staging
JWT_SECRET=your-staging-jwt-secret
CLIENT_URL=http://localhost:3010

# M-Pesa (Sandbox)
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret

# Africa's Talking (Sandbox)
AT_ENV=sandbox
AT_USERNAME=your-username
AT_API_KEY=your-api-key
```

## Monitoring

### Prometheus Metrics

- **Backend Metrics**: http://localhost:5010/metrics
- **Prometheus UI**: http://localhost:9090

### Grafana Dashboards

- **URL**: http://localhost:3002
- **Login**: admin/admin
- **Pre-configured dashboards**:
  - Backend API metrics
  - Database performance
  - System resources

## Database

### Connection

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27018/pcl_staging

# Or via Docker
docker exec -it mongo-staging mongosh
```

### Migrations

```bash
# Check migration status
cd backend && node migrations/migrate.js status

# Run pending migrations
node migrations/migrate.js up

# Rollback last migration
node migrations/migrate.js down
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker status
docker-compose -f deployment/staging/docker-compose.staging.yml ps

# View logs
docker-compose -f deployment/staging/docker-compose.staging.yml logs

# Check port conflicts
netstat -tulpn | grep -E '5010|3010|4330|27018|6380'
```

### Database Connection Issues

```bash
# Check MongoDB status
docker exec -it mongo-staging mongosh --eval "db.adminCommand('ping')"

# Check connection from backend
curl http://localhost:5010/api/health
```

### Memory Issues

```bash
# Check container resources
docker stats

# Restart with more memory
docker-compose -f deployment/staging/docker-compose.staging.yml down
docker-compose -f deployment/staging/docker-compose.staging.yml up -d
```

## Differences from Production

| Aspect | Staging | Production |
|--------|---------|------------|
| Database | Isolated MongoDB | Shared MongoDB |
| Caching | Isolated Redis | Shared Redis |
| M-Pesa | Sandbox | Production |
| Africa's Talking | Sandbox | Production |
| Logging | Debug level | Info/Error level |
| Monitoring | Full stack | Production stack |
| SSL | Optional | Required |

## Best Practices

1. **Always test in staging before production**
2. **Use staging for QA and client demos**
3. **Keep staging data fresh** (reset periodically)
4. **Monitor staging metrics** before production deployment
5. **Use feature flags** for gradual rollouts
6. **Document all changes** in deployment records
