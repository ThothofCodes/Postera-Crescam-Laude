# Blue-Green Deployment Strategy

## Overview

This document describes the blue-green deployment strategy for zero-downtime releases. Blue-green deployment maintains two identical production environments (blue and green) and switches traffic between them for deployments and rollbacks.

## Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │     (Nginx)     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │  Blue Environment│           │ Green Environment│
    │                  │           │                  │
    │ ┌──────────────┐ │           │ ┌──────────────┐ │
    │ │   Backend    │ │           │ │   Backend    │ │
    │ │   (5001)     │ │           │ │   (5002)     │ │
    │ └──────────────┘ │           │ └──────────────┘ │
    │ ┌──────────────┐ │           │ ┌──────────────┐ │
    │ │   Frontend   │ │           │ │   Frontend   │ │
    │ │   (3000)     │ │           │ │   (3001)     │ │
    │ └──────────────┘ │           │ └──────────────┘ │
    │ ┌──────────────┐ │           │ ┌──────────────┐ │
    │ │   Tech Hub   │ │           │ │   Tech Hub   │ │
    │ │   (4321)     │ │           │ │   (4322)     │ │
    │ └──────────────┘ │           │ └──────────────┘ │
    └─────────────────┘           └─────────────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                    ┌────────┴────────┐
                    │   Shared DB &   │
                    │     Redis       │
                    └─────────────────┘
```

## Environments

| Environment | Backend | Frontend | Tech Hub | Status |
|-------------|---------|----------|----------|--------|
| **Blue** | localhost:5001 | localhost:3000 | localhost:4321 | Active (default) |
| **Green** | localhost:5002 | localhost:3001 | localhost:4322 | Standby |

## Deployment Process

### 1. Pre-Deployment Checks

```bash
# Check current status
./deployment/deploy.sh status

# Run health checks
./deployment/deploy.sh health
```

### 2. Deploy New Version

```bash
# Deploy to inactive environment
./deployment/deploy.sh deploy v1.2.3

# This will:
# 1. Build new Docker images
# 2. Deploy to inactive environment (green if blue is active)
# 3. Run health checks
# 4. Switch traffic to new environment
```

### 3. Switch Traffic (Manual)

```bash
# Switch to specific environment
./deployment/deploy.sh switch green
./deployment/deploy.sh switch blue
```

### 4. Rollback

```bash
# Rollback to previous environment
./deployment/deploy.sh rollback
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/blue-green-deploy.yml`) automates:

1. **Pre-checks**: Detect current/active environment
2. **Build**: Build and push Docker images
3. **Deploy**: Deploy to inactive environment
4. **Verify**: Health checks on new environment
5. **Switch**: Update load balancer configuration
6. **Post-deploy**: Create deployment record

### Triggering Deployments

**Automatic (on push to main):**
```bash
git push origin main
```

**Manual (GitHub Actions):**
1. Go to Actions → Blue-Green Deployment
2. Click "Run workflow"
3. Select environment (auto/blue/green)
4. Enter version tag (optional)
5. Click "Run workflow"

## Health Checks

### Backend Health Check

```bash
curl http://localhost:5001/api/health
curl http://localhost:5002/api/health
```

### Readiness Check

```bash
curl http://localhost:5001/api/deployment/ready
curl http://localhost:5002/api/deployment/ready
```

### Deployment Status

```bash
curl http://localhost:5001/api/deployment/status
curl http://localhost:5002/api/deployment/status
```

## Configuration Files

| File | Purpose |
|------|---------|
| `deployment/blue-green.conf` | Nginx configuration for traffic routing |
| `deployment/docker-compose.blue.yml` | Blue environment services |
| `deployment/docker-compose.green.yml` | Green environment services |
| `deployment/deploy.sh` | Deployment orchestrator script |
| `.github/workflows/blue-green-deploy.yml` | CI/CD pipeline |

## Environment Variables

```bash
# Required for deployment
MONGO_URI=mongodb://...
JWT_SECRET=your-secret
CLIENT_URL=http://yourdomain.com

# Optional
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=production
DEPLOY_HOST=your-server
DEPLOY_KEY=your-ssh-key
```

## Rollback Procedures

### Automatic Rollback

If health checks fail after deployment, the system automatically switches back to the previous environment.

### Manual Rollback

```bash
# Immediate rollback
./deployment/deploy.sh rollback

# Or via GitHub Actions
# 1. Go to Actions → Blue-Green Deployment
# 2. Run workflow with environment: blue (or green)
```

### Database Rollback

If database migrations need to be rolled back:

```bash
# Rollback last migration batch
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

## Monitoring

### Deployment Metrics

- **Uptime**: Track uptime across deployments
- **Error Rate**: Monitor error rates during deployment
- **Response Time**: Compare response times between environments

### Alerts

Set up alerts for:
- Health check failures
- High error rates
- Memory/CPU spikes
- Database connection issues

## Troubleshooting

### Services Not Starting

```bash
# Check container logs
docker-compose -f deployment/docker-compose.blue.yml logs backend-blue
docker-compose -f deployment/docker-compose.green.yml logs backend-green

# Check nginx logs
tail -f /var/log/nginx/error.log
```

### Traffic Not Switching

```bash
# Verify nginx configuration
nginx -t

# Check active environment
cat /etc/nginx/conf.d/active-backend.conf

# Reload nginx
nginx -s reload
```

### Database Connection Issues

```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Check connection pool
curl http://localhost:5001/api/health/detail
```

## Best Practices

1. **Always test in staging** before production deployment
2. **Monitor error rates** during and after deployment
3. **Keep rollback window** (previous environment) healthy
4. **Use feature flags** for gradual rollouts
5. **Document all changes** in deployment records
6. **Set up automated alerts** for critical metrics

## Cost Considerations

| Component | Blue | Green | Total |
|-----------|------|-------|-------|
| Backend | 1 instance | 1 instance | 2 instances |
| Frontend | 1 instance | 1 instance | 2 instances |
| Tech Hub | 1 instance | 1 instance | 2 instances |
| Database | Shared | Shared | 1 instance |
| Redis | Shared | Shared | 1 instance |

**Note**: During deployment, both environments run simultaneously. After traffic switch, the old environment can be scaled down or kept for quick rollback.
