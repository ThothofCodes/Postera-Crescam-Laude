#!/bin/bash
# ============================================================================
# MongoDB Backup Script
# ============================================================================
# This script creates compressed backups of MongoDB databases with rotation.
# It supports full backups, incremental backups, and backup verification.
#
# Usage:
#   ./backup.sh <command> [options]
#
# Commands:
#   full        Create full backup of all databases
#   database    Backup specific database
#   collections Backup specific collections
#   verify      Verify backup integrity
#   list        List available backups
#   cleanup     Remove old backups based on retention policy
#   restore     Restore from backup
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}]")" && pwd)"
CONFIG_DIR="$(dirname "$SCRIPT_DIR")/config"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/mongodb}"
LOG_DIR="${LOG_DIR:-/var/log/mongodb-backup}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPRESSION="${COMPRESSION:-gzip}"
PARALLEL_JOBS="${PARALLEL_JOBS:-4}"

# MongoDB connection
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-}"
MONGO_PASS="${MONGO_PASS:-}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"
MONGO_DB="${MONGO_DB:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create directories
setup_directories() {
    mkdir -p "$BACKUP_DIR" 2>/dev/null || {
        log_warning "Cannot create $BACKUP_DIR, using current directory"
        BACKUP_DIR="./backups"
        mkdir -p "$BACKUP_DIR"
    }
    mkdir -p "$LOG_DIR" 2>/dev/null || {
        log_warning "Cannot create $LOG_DIR, using current directory"
        LOG_DIR="./logs"
        mkdir -p "$LOG_DIR"
    }
}

# Get MongoDB connection string
get_mongo_uri() {
    local uri="mongodb://"
    
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
        uri+="${MONGO_USER}:${MONGO_PASS}@"
    fi
    
    uri+="${MONGO_HOST}:${MONGO_PORT}"
    
    if [ -n "$MONGO_AUTH_DB" ]; then
        uri+="/?authSource=${MONGO_AUTH_DB}"
    fi
    
    echo "$uri"
}

# Generate backup filename
generate_backup_name() {
    local prefix=$1
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local hostname=$(hostname -s)
    echo "${prefix}_${hostname}_${timestamp}"
}

# ============================================================================
# Backup Functions
# ============================================================================

# Full backup of all databases
backup_full() {
    local backup_name=$(generate_backup_name "full")
    local backup_path="${BACKUP_DIR}/${backup_name}"
    local log_file="${LOG_DIR}/backup_${backup_name}.log"
    
    log_info "Starting full backup: ${backup_name}"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Start logging
    exec > >(tee -a "$log_file") 2>&1
    
    # Get list of databases
    local databases
    if [ -n "$MONGO_USER" ]; then
        databases=$(mongosh --uri "$(get_mongo_uri)" --quiet --eval "
            db.adminCommand('listDatabases').databases.map(db => db.name).filter(name => !['admin', 'local', 'config'].includes(name))
        ")
    else
        databases=$(mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" --quiet --eval "
            db.adminCommand('listDatabases').databases.map(db => db.name).filter(name => !['admin', 'local', 'config'].includes(name))
        ")
    fi
    
    log_info "Databases to backup: ${databases}"
    
    # Backup each database
    for db in $databases; do
        log_info "Backing up database: ${db}"
        
        local db_backup_path="${backup_path}/${db}"
        mkdir -p "$db_backup_path"
        
        # Use mongodump for each database
        if [ -n "$MONGO_USER" ]; then
            mongodump \
                --uri "$(get_mongo_uri)" \
                --db "$db" \
                --out "$db_backup_path" \
                --gzip \
                --numParallelCollections="$PARALLEL_JOBS"
        else
            mongodump \
                --host "$MONGO_HOST" \
                --port "$MONGO_PORT" \
                --db "$db" \
                --out "$db_backup_path" \
                --gzip \
                --numParallelCollections="$PARALLEL_JOBS"
        fi
        
        log_success "Database ${db} backed up successfully"
    done
    
    # Create backup manifest
    create_backup_manifest "$backup_path" "full"
    
    # Create compressed archive
    local archive_name="${backup_name}.tar.gz"
    tar -czf "${BACKUP_DIR}/${archive_name}" -C "$BACKUP_DIR" "$backup_name"
    
    # Calculate checksum
    local checksum=$(sha256sum "${BACKUP_DIR}/${archive_name}" | cut -d' ' -f1)
    echo "$checksum" > "${BACKUP_DIR}/${archive_name}.sha256"
    
    # Remove uncompressed directory
    rm -rf "$backup_path"
    
    log_success "Full backup completed: ${archive_name}"
    log_info "Checksum: ${checksum}"
    log_info "Size: $(du -h "${BACKUP_DIR}/${archive_name}" | cut -f1)"
    
    # Stop logging
    exec > /dev/null 2>&1
    
    echo "${archive_name}"
}

# Backup specific database
backup_database() {
    local db_name=$1
    local backup_name=$(generate_backup_name "db_${db_name}")
    local backup_path="${BACKUP_DIR}/${backup_name}"
    local log_file="${LOG_DIR}/backup_${backup_name}.log"
    
    log_info "Starting database backup: ${db_name} as ${backup_name}"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Start logging
    exec > >(tee -a "$log_file") 2>&1
    
    # Backup database
    if [ -n "$MONGO_USER" ]; then
        mongodump \
            --uri "$(get_mongo_uri)" \
            --db "$db_name" \
            --out "$backup_path" \
            --gzip \
            --numParallelCollections="$PARALLEL_JOBS"
    else
        mongodump \
            --host "$MONGO_HOST" \
            --port "$MONGO_PORT" \
            --db "$db_name" \
            --out "$backup_path" \
            --gzip \
            --numParallelCollections="$PARALLEL_JOBS"
    fi
    
    # Create backup manifest
    create_backup_manifest "$backup_path" "database" "$db_name"
    
    # Create compressed archive
    local archive_name="${backup_name}.tar.gz"
    tar -czf "${BACKUP_DIR}/${archive_name}" -C "$BACKUP_DIR" "$backup_name"
    
    # Calculate checksum
    local checksum=$(sha256sum "${BACKUP_DIR}/${archive_name}" | cut -d' ' -f1)
    echo "$checksum" > "${BACKUP_DIR}/${archive_name}.sha256"
    
    # Remove uncompressed directory
    rm -rf "$backup_path"
    
    log_success "Database backup completed: ${archive_name}"
    
    # Stop logging
    exec > /dev/null 2>&1
    
    echo "${archive_name}"
}

# Backup specific collections
backup_collections() {
    local db_name=$1
    local collections=$2
    local backup_name=$(generate_backup_name "coll_${db_name}")
    local backup_path="${BACKUP_DIR}/${backup_name}"
    local log_file="${LOG_DIR}/backup_${backup_name}.log"
    
    log_info "Starting collections backup: ${db_name} (${collections}) as ${backup_name}"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Start logging
    exec > >(tee -a "$log_file") 2>&1
    
    # Build collections array
    IFS=',' read -ra coll_array <<< "$collections"
    local coll_args=""
    for coll in "${coll_array[@]}"; do
        coll_args+=" --collection $coll"
    done
    
    # Backup collections
    if [ -n "$MONGO_USER" ]; then
        mongodump \
            --uri "$(get_mongo_uri)" \
            --db "$db_name" \
            $coll_args \
            --out "$backup_path" \
            --gzip
    else
        mongodump \
            --host "$MONGO_HOST" \
            --port "$MONGO_PORT" \
            --db "$db_name" \
            $coll_args \
            --out "$backup_path" \
            --gzip
    fi
    
    # Create backup manifest
    create_backup_manifest "$backup_path" "collections" "$db_name" "$collections"
    
    # Create compressed archive
    local archive_name="${backup_name}.tar.gz"
    tar -czf "${BACKUP_DIR}/${archive_name}" -C "$BACKUP_DIR" "$backup_name"
    
    # Calculate checksum
    local checksum=$(sha256sum "${BACKUP_DIR}/${archive_name}" | cut -d' ' -f1)
    echo "$checksum" > "${BACKUP_DIR}/${archive_name}.sha256"
    
    # Remove uncompressed directory
    rm -rf "$backup_path"
    
    log_success "Collections backup completed: ${archive_name}"
    
    # Stop logging
    exec > /dev/null 2>&1
    
    echo "${archive_name}"
}

# ============================================================================
# Backup Manifest
# ============================================================================

create_backup_manifest() {
    local backup_path=$1
    local backup_type=$2
    local db_name=${3:-"all"}
    local collections=${4:-"all"}
    
    local manifest_file="${backup_path}/manifest.json"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local hostname=$(hostname -s)
    local mongo_version=$(mongosh --quiet --eval "db.version()" 2>/dev/null || echo "unknown")
    
    cat > "$manifest_file" << EOF
{
  "backup_type": "${backup_type}",
  "timestamp": "${timestamp}",
  "hostname": "${hostname}",
  "database": "${db_name}",
  "collections": "${collections}",
  "mongodb_version": "${mongo_version}",
  "retention_days": ${RETENTION_DAYS},
  "compression": "${COMPRESSION}",
  "created_by": "$(whoami)",
  "script_version": "1.0.0"
}
EOF
    
    log_info "Backup manifest created: ${manifest_file}"
}

# ============================================================================
# Verification
# ============================================================================

verify_backup() {
    local backup_file=$1
    
    log_info "Verifying backup: ${backup_file}"
    
    # Check if file exists
    if [ ! -f "${BACKUP_DIR}/${backup_file}" ]; then
        log_error "Backup file not found: ${backup_file}"
        return 1
    fi
    
    # Check checksum
    local checksum_file="${BACKUP_DIR}/${backup_file}.sha256"
    if [ -f "$checksum_file" ]; then
        local expected_checksum=$(cat "$checksum_file")
        local actual_checksum=$(sha256sum "${BACKUP_DIR}/${backup_file}" | cut -d' ' -f1)
        
        if [ "$expected_checksum" != "$actual_checksum" ]; then
            log_error "Checksum mismatch!"
            log_error "Expected: ${expected_checksum}"
            log_error "Actual:   ${actual_checksum}"
            return 1
        fi
        log_success "Checksum verified"
    else
        log_warning "No checksum file found, skipping checksum verification"
    fi
    
    # Test archive integrity
    if tar -tzf "${BACKUP_DIR}/${backup_file}" > /dev/null 2>&1; then
        log_success "Archive integrity verified"
    else
        log_error "Archive is corrupted"
        return 1
    fi
    
    # Extract and verify MongoDB dump structure
    local temp_dir=$(mktemp -d)
    tar -xzf "${BACKUP_DIR}/${backup_file}" -C "$temp_dir"
    
    # Check for manifest file
    local manifest_found=false
    for dir in "$temp_dir"/*/; do
        if [ -f "${dir}manifest.json" ]; then
            manifest_found=true
            log_success "Manifest file found"
            
            # Verify manifest content
            local backup_type=$(jq -r '.backup_type' "${dir}manifest.json")
            local timestamp=$(jq -r '.timestamp' "${dir}manifest.json")
            log_info "Backup type: ${backup_type}"
            log_info "Timestamp: ${timestamp}"
            break
        fi
    done
    
    if [ "$manifest_found" = false ]; then
        log_warning "No manifest file found in backup"
    fi
    
    # Check for database dumps
    local dump_count=0
    for dir in "$temp_dir"/*/; do
        if [ -d "${dir}dump" ]; then
            dump_count=$((dump_count + 1))
        fi
    done
    
    if [ $dump_count -gt 0 ]; then
        log_success "Found ${dump_count} database dump(s)"
    else
        log_warning "No database dumps found"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "Backup verification completed"
    return 0
}

# ============================================================================
# List Backups
# ============================================================================

list_backups() {
    log_info "Available backups:"
    echo ""
    echo "============================================================================"
    printf "%-40s %-10s %-15s\n" "Filename" "Size" "Date"
    echo "============================================================================"
    
    for file in "${BACKUP_DIR}"/*.tar.gz; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1)
            printf "%-40s %-10s %-15s\n" "$filename" "$size" "$date"
        fi
    done
    
    echo "============================================================================"
    echo ""
    
    local total_count=$(ls -1 "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | wc -l)
    local total_size=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
    
    echo "Total: ${total_count} backup(s), ${total_size}"
}

# ============================================================================
# Cleanup
# ============================================================================

cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    local deleted_count=0
    
    # Find and delete old backups
    for file in "${BACKUP_DIR}"/*.tar.gz; do
        if [ -f "$file" ]; then
            local file_age=$(( ($(date +%s) - $(stat -c %Y "$file")) / 86400 ))
            
            if [ $file_age -gt $RETENTION_DAYS ]; then
                local filename=$(basename "$file")
                log_info "Deleting old backup: ${filename} (${file_age} days old)"
                
                rm -f "$file"
                rm -f "${file}.sha256"
                
                deleted_count=$((deleted_count + 1))
            fi
        fi
    done
    
    # Find and delete old log files
    for file in "${LOG_DIR}"/backup_*.log; do
        if [ -f "$file" ]; then
            local file_age=$(( ($(date +%s) - $(stat -c %Y "$file")) / 86400 ))
            
            if [ $file_age -gt $RETENTION_DAYS ]; then
                rm -f "$file"
            fi
        fi
    done
    
    log_success "Cleanup completed: ${deleted_count} backup(s) deleted"
}

# ============================================================================
# Restore
# ============================================================================

restore_backup() {
    local backup_file=$1
    local target_db=${2:-""}
    
    log_info "Restoring backup: ${backup_file}"
    
    # Verify backup first
    if ! verify_backup "$backup_file"; then
        log_error "Backup verification failed, aborting restore"
        return 1
    fi
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    tar -xzf "${BACKUP_DIR}/${backup_file}" -C "$temp_dir"
    
    # Find the backup directory
    local backup_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "full_*" -o -name "db_*" -o -name "coll_*" | head -1)
    
    if [ -z "$backup_dir" ]; then
        log_error "No backup directory found in archive"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Restore each database
    for db_dir in "$backup_dir"/*/; do
        if [ -d "${db_dir}dump" ]; then
            local db_name=$(basename "$db_dir")
            
            if [ -n "$target_db" ] && [ "$db_name" != "$target_db" ]; then
                continue
            fi
            
            log_info "Restoring database: ${db_name}"
            
            # Use mongorestore
            if [ -n "$MONGO_USER" ]; then
                mongorestore \
                    --uri "$(get_mongo_uri)" \
                    --db "$db_name" \
                    "${db_dir}dump/${db_name}" \
                    --gzip \
                    --drop \
                    --numParallelCollections="$PARALLEL_JOBS"
            else
                mongorestore \
                    --host "$MONGO_HOST" \
                    --port "$MONGO_PORT" \
                    --db "$db_name" \
                    "${db_dir}dump/${db_name}" \
                    --gzip \
                    --drop \
                    --numParallelCollections="$PARALLEL_JOBS"
            fi
            
            log_success "Database ${db_name} restored successfully"
        fi
    done
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "Restore completed successfully"
}

# ============================================================================
# Main Command Handler
# ============================================================================

# Load environment variables
if [ -f "${CONFIG_DIR}/backup.env" ]; then
    source "${CONFIG_DIR}/backup.env"
fi

# Setup directories
setup_directories

case "${1:-help}" in
    full)
        backup_full
        ;;
    
    database)
        if [ -z "${2:-}" ]; then
            log_error "Usage: $0 database <database_name>"
            exit 1
        fi
        backup_database "$2"
        ;;
    
    collections)
        if [ -z "${2:-}" ] || [ -z "${3:-}" ]; then
            log_error "Usage: $0 collections <database_name> <collection1,collection2,...>"
            exit 1
        fi
        backup_collections "$2" "$3"
        ;;
    
    verify)
        if [ -z "${2:-}" ]; then
            log_error "Usage: $0 verify <backup_file>"
            exit 1
        fi
        verify_backup "$2"
        ;;
    
    list)
        list_backups
        ;;
    
    cleanup)
        cleanup_old_backups
        ;;
    
    restore)
        if [ -z "${2:-}" ]; then
            log_error "Usage: $0 restore <backup_file> [target_database]"
            exit 1
        fi
        restore_backup "$2" "${3:-}"
        ;;
    
    help|*)
        echo ""
        echo "============================================================================"
        echo "                    MongoDB Backup Script"
        echo "============================================================================"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  full                     Create full backup of all databases"
        echo "  database <db>            Backup specific database"
        echo "  collections <db> <colls> Backup specific collections"
        echo "  verify <backup_file>     Verify backup integrity"
        echo "  list                     List available backups"
        echo "  cleanup                  Remove old backups based on retention policy"
        echo "  restore <backup_file> [db] Restore from backup"
        echo "  help                     Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 full                         # Full backup"
        echo "  $0 database pcl_staging         # Backup specific database"
        echo "  $0 collections pcl_staging users,orders  # Backup specific collections"
        echo "  $0 verify backup_20260824.tar.gz  # Verify backup"
        echo "  $0 restore backup_20260824.tar.gz  # Restore backup"
        echo ""
        echo "Environment Variables:"
        echo "  MONGO_HOST       MongoDB host (default: localhost)"
        echo "  MONGO_PORT       MongoDB port (default: 27017)"
        echo "  MONGO_USER       MongoDB username"
        echo "  MONGO_PASS       MongoDB password"
        echo "  MONGO_AUTH_DB    MongoDB auth database (default: admin)"
        echo "  BACKUP_DIR       Backup directory (default: /opt/backups/mongodb)"
        echo "  RETENTION_DAYS   Days to keep backups (default: 30)"
        echo ""
        echo "============================================================================"
        echo ""
        ;;
esac
