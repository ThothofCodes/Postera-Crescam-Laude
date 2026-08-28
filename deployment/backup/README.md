# MongoDB Backup & Disaster Recovery

## Overview

This document describes the backup and disaster recovery strategy for MongoDB databases. It includes automated backups, verification, restoration procedures, and monitoring.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Backup Infrastructure                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Backup Scheduler                       │   │
│  │  (Cron / Systemd Timer)                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Backup Scripts                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   backup.sh │  │  verify.sh  │  │ restore.sh  │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Backup Storage                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Local     │  │   Remote    │  │  Encrypted  │    │   │
│  │  │  (Local)    │  │   (S3/GCS)  │  │  (Optional) │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Monitoring & Alerts                    │   │
│  │  (Email / Slack / Prometheus)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Backup Scripts

```bash
# Copy scripts to /opt/pcl
sudo cp -r deployment/backup /opt/pcl/deployment/backup

# Make scripts executable
sudo chmod +x /opt/pcl/deployment/backup/scripts/*.sh

# Create backup directories
sudo mkdir -p /opt/backups/mongodb
sudo mkdir -p /var/log/mongodb-backup
```

### 2. Configure Environment

```bash
# Copy and edit environment file
sudo cp /opt/pcl/deployment/backup/config/backup.env /opt/pcl/deployment/backup/config/backup.env.local
sudo nano /opt/pcl/deployment/backup/config/backup.env.local
```

### 3. Run Manual Backup

```bash
# Full backup
/opt/pcl/deployment/backup/scripts/backup.sh full

# Database-specific backup
/opt/pcl/deployment/backup/scripts/backup.sh database pcl_staging

# List backups
/opt/pcl/deployment/backup/scripts/backup.sh list
```

### 4. Schedule Automated Backups

```bash
# Install crontab
crontab /opt/pcl/deployment/backup/config/backup-crontab

# Or install systemd timer
sudo cp /opt/pcl/deployment/backup/config/mongodb-backup.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mongodb-backup.timer
sudo systemctl start mongodb-backup.timer
```

## Commands

### Backup Commands

```bash
# Full backup of all databases
./backup.sh full

# Backup specific database
./backup.sh database pcl_staging

# Backup specific collections
./backup.sh collections pcl_staging users,orders,tickets

# List available backups
./backup.sh list

# Verify backup integrity
./backup.sh verify backup_20260824_020000.tar.gz

# Cleanup old backups
./backup.sh cleanup
```

### Restore Commands

```bash
# Restore full backup
./restore.sh full backup_20260824_020000.tar.gz

# Restore to specific database
./restore.sh full backup_20260824_020000.tar.gz pcl_restored

# Restore specific database
./restore.sh database backup_20260824_020000.tar.gz users

# Point-in-time restore
./restore.sh point "2026-08-24 10:00:00"

# List available backups
./restore.sh list
```

### Verification Commands

```bash
# Verify latest backup
./verify-backups.sh --verify-latest

# Verify all backups
./verify-backups.sh --verify-all

# Verify backups from last 7 days
./verify-backups.sh --verify-days 7

# Test restore to temporary database
./verify-backups.sh --verify-latest --test-restore

# Generate verification report
./verify-backups.sh --verify-all --report /tmp/verify_report.json
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_HOST` | localhost | MongoDB host |
| `MONGO_PORT` | 27017 | MongoDB port |
| `MONGO_USER` | - | MongoDB username |
| `MONGO_PASS` | - | MongoDB password |
| `MONGO_AUTH_DB` | admin | MongoDB auth database |
| `BACKUP_DIR` | /opt/backups/mongodb | Backup storage directory |
| `LOG_DIR` | /var/log/mongodb-backup | Log directory |
| `RETENTION_DAYS` | 30 | Days to keep backups |
| `COMPRESSION` | gzip | Compression algorithm |
| `PARALLEL_JOBS` | 4 | Parallel backup jobs |

### Notification Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_EMAIL_NOTIFICATIONS` | false | Enable email notifications |
| `EMAIL_RECIPIENTS` | admin@example.com | Email recipients |
| `ENABLE_SLACK_NOTIFICATIONS` | false | Enable Slack notifications |
| `SLACK_WEBHOOK_URL` | - | Slack webhook URL |

### Remote Backup Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_REMOTE_BACKUP` | false | Enable remote backup upload |
| `REMOTE_TYPE` | s3 | Remote type (s3, gcs, azure, sftp) |
| `REMOTE_BUCKET` | - | Remote bucket name |
| `REMOTE_PATH` | mongodb-backups | Remote path |

## Backup Structure

### Backup File Format

Backups are stored as compressed tar archives with the following naming convention:

```
{type}_{hostname}_{timestamp}.tar.gz
```

Example: `full_server01_20260824_020000.tar.gz`

### Archive Contents

```
full_server01_20260824_020000/
├── manifest.json           # Backup metadata
├── pcl_staging/           # Database dump
│   └── dump/
│       └── pcl_staging/
│           ├── users.bson
│           ├── users.metadata.json
│           ├── orders.bson
│           └── orders.metadata.json
└── pcl_production/        # Another database
    └── dump/
        └── pcl_production/
            └── ...
```

### Manifest File

The `manifest.json` file contains:

```json
{
  "backup_type": "full",
  "timestamp": "2026-08-24T02:00:00Z",
  "hostname": "server01",
  "database": "all",
  "collections": "all",
  "mongodb_version": "7.0.0",
  "retention_days": 30,
  "compression": "gzip",
  "created_by": "root",
  "script_version": "1.0.0"
}
```

## Disaster Recovery Procedures

### Scenario 1: Database Corruption

```bash
# 1. Stop the application
sudo systemctl stop pcl-backend

# 2. Verify backup integrity
./backup.sh verify latest_backup.tar.gz

# 3. Restore database
./restore.sh database latest_backup.tar.gz pcl_production true

# 4. Start the application
sudo systemctl start pcl-backend

# 5. Verify application is working
curl http://localhost:5001/api/health
```

### Scenario 2: Accidental Data Deletion

```bash
# 1. Identify the time of deletion
# Check application logs or audit logs

# 2. Find backup before deletion time
./restore.sh list

# 3. Restore to point in time
./restore.sh point "2026-08-24 10:00:00" pcl_production

# 4. Verify data is restored
mongosh --eval "db.users.countDocuments()"
```

### Scenario 3: Server Failure

```bash
# 1. Set up new server
# Install MongoDB, restore from backup

# 2. Copy backup to new server
scp latest_backup.tar.gz new-server:/tmp/

# 3. Restore on new server
./restore.sh full /tmp/latest_backup.tar.gz

# 4. Update DNS/load balancer to point to new server

# 5. Verify application is working
curl http://new-server:5001/api/health
```

### Scenario 4: Complete Data Loss

```bash
# 1. Identify the most recent good backup
./backup.sh list

# 2. Restore full backup
./restore.sh full most_recent_backup.tar.gz pcl_production true

# 3. Restore any incremental backups (if available)
# Note: Current implementation only supports full backups

# 4. Verify all data is restored
mongosh --eval "
  db.users.countDocuments() +
  db.orders.countDocuments() +
  db.products.countDocuments()
"

# 5. Start application
sudo systemctl start pcl-backend
```

## Monitoring & Alerts

### Prometheus Metrics

The backup system exposes Prometheus metrics at `http://localhost:9104/metrics`:

- `mongodb_backup_duration_seconds` - Backup duration
- `mongodb_backup_size_bytes` - Backup size
- `mongodb_backup_success` - Backup success (1) or failure (0)
- `mongodb_backup_last_timestamp` - Last backup timestamp

### Grafana Dashboard

Import the MongoDB Backup dashboard from `deployment/backup/config/grafana-dashboard.json` into Grafana.

### Alert Rules

```yaml
groups:
  - name: mongodb-backup
    rules:
      - alert: MongoDBBackupFailed
        expr: mongodb_backup_success == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "MongoDB backup failed"
          description: "MongoDB backup has failed for 5 minutes"
      
      - alert: MongoDBBackupTooOld
        expr: time() - mongodb_backup_last_timestamp > 86400
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "MongoDB backup is too old"
          description: "Last backup was more than 24 hours ago"
```

## Best Practices

1. **Test Restores Regularly** - Perform test restores monthly to ensure backups are valid
2. **Monitor Backup Jobs** - Set up alerts for failed backups
3. **Encrypt Sensitive Data** - Enable encryption for backups containing sensitive data
4. **Store Backups Offsite** - Keep copies of backups in a different location
5. **Document Procedures** - Keep recovery procedures up to date
6. **Regular Verification** - Verify backup integrity regularly
7. **Retention Policy** - Implement and enforce backup retention policies
8. **Performance Impact** - Schedule backups during low-traffic periods

## Troubleshooting

### Backup Fails

```bash
# Check MongoDB connection
mongosh --host localhost --port 27017 --eval "db.adminCommand('ping')"

# Check disk space
df -h /opt/backups

# Check backup logs
tail -f /var/log/mongodb-backup/cron.log

# Test backup manually
./backup.sh full
```

### Restore Fails

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Verify backup file
./backup.sh verify backup_file.tar.gz

# Check disk space
df -h /var/lib/mongodb
```

### Performance Issues

```bash
# Reduce parallel jobs
export PARALLEL_JOBS=2

# Schedule during off-peak hours
# Use incremental backups (if implemented)

# Monitor MongoDB performance during backups
mongostat --host localhost --port 27017
```

## Cost Considerations

| Component | Cost | Notes |
|-----------|------|-------|
| Local Storage | $0 | Uses existing disk space |
| Remote Storage (S3) | ~$0.023/GB | First 5TB/month |
| Network Transfer | ~$0.09/GB | Data transfer out |
| Encryption | $0 | Uses built-in encryption |

## Security

1. **Encryption at Rest** - Enable encryption for sensitive backups
2. **Encryption in Transit** - Use TLS for remote backups
3. **Access Control** - Restrict backup access to authorized users
4. **Audit Logging** - Log all backup and restore operations
5. **Key Management** - Secure encryption keys separately from backups
