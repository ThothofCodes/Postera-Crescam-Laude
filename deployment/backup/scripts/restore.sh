#!/bin/bash
# ============================================================================
# MongoDB Restore Script
# ============================================================================
# This script restores MongoDB databases from backups with various options.
#
# Usage:
#   ./restore.sh <command> [options]
#
# Commands:
#   full        Restore full backup
#   database    Restore specific database
#   point      Point-in-time restore
#   verify     Verify backup before restore
#   list       List available backups
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}]")" && pwd)"
CONFIG_DIR="$(dirname "$SCRIPT_DIR")/config"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/mongodb}"
LOG_DIR="${LOG_DIR:-/var/log/mongodb-backup}"

# MongoDB connection
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-}"
MONGO_PASS="${MONGO_PASS:-}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"

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

# ============================================================================
# Restore Functions
# ============================================================================

restore_full_backup() {
    local backup_file=$1
    local target_db=${2:-""}
    local drop_existing=${3:-false}
    
    log_info "Restoring full backup: ${backup_file}"
    
    # Verify backup first
    log_info "Verifying backup integrity..."
    if ! tar -tzf "${BACKUP_DIR}/${backup_file}" > /dev/null 2>&1; then
        log_error "Backup file is corrupted"
        return 1
    fi
    log_success "Backup integrity verified"
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    log_info "Extracting backup to ${temp_dir}"
    tar -xzf "${BACKUP_DIR}/${backup_file}" -C "$temp_dir"
    
    # Find the backup directory
    local backup_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "full_*" -o -name "db_*" -o -name "coll_*" | head -1)
    
    if [ -z "$backup_dir" ]; then
        log_error "No backup directory found in archive"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Check for manifest
    if [ -f "${backup_dir}/manifest.json" ]; then
        local backup_type=$(jq -r '.backup_type' "${backup_dir}/manifest.json")
        local timestamp=$(jq -r '.timestamp' "${backup_dir}/manifest.json")
        log_info "Backup type: ${backup_type}"
        log_info "Backup timestamp: ${timestamp}"
    fi
    
    # Restore each database
    local restored_count=0
    
    for db_dir in "$backup_dir"/*/; do
        if [ -d "${db_dir}dump" ]; then
            local db_name=$(basename "$db_dir")
            
            # Skip if target database specified and doesn't match
            if [ -n "$target_db" ] && [ "$db_name" != "$target_db" ]; then
                continue
            fi
            
            log_info "Restoring database: ${db_name}"
            
            # Build mongorestore command
            local restore_cmd="mongorestore"
            
            if [ -n "$MONGO_USER" ]; then
                restore_cmd+=" --uri $(get_mongo_uri)"
            else
                restore_cmd+=" --host ${MONGO_HOST} --port ${MONGO_PORT}"
            fi
            
            restore_cmd+=" --db ${db_name}"
            restore_cmd+=" ${db_dir}dump/${db_name}"
            restore_cmd+=" --gzip"
            restore_cmd+=" --numParallelCollections=4"
            
            if [ "$drop_existing" = true ]; then
                restore_cmd+=" --drop"
            fi
            
            # Execute restore
            if eval $restore_cmd; then
                log_success "Database ${db_name} restored successfully"
                restored_count=$((restored_count + 1))
            else
                log_error "Failed to restore database: ${db_name}"
                rm -rf "$temp_dir"
                return 1
            fi
        fi
    done
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "Restore completed: ${restored_count} database(s) restored"
    return 0
}

restore_database() {
    local backup_file=$1
    local db_name=$2
    local drop_existing=${3:-false}
    
    log_info "Restoring database ${db_name} from ${backup_file}"
    
    restore_full_backup "$backup_file" "$db_name" "$drop_existing"
}

restore_point_in_time() {
    local target_time=$1
    local target_db=${2:-""}
    
    log_info "Performing point-in-time restore to ${target_time}"
    
    # Find the most recent backup before the target time
    local latest_backup=""
    local latest_time=0
    
    for file in "${BACKUP_DIR}"/*.tar.gz; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            
            # Extract timestamp from filename
            if [[ "$filename" =~ _([0-9]{8})_([0-9]{6})\.tar\.gz$ ]]; then
                local backup_date="${BASH_REMATCH[1]}"
                local backup_time="${BASH_REMATCH[2]}"
                local backup_timestamp="${backup_date}${backup_time}"
                
                # Convert target time to comparable format
                local target_timestamp=$(date -d "$target_time" +"%Y%m%d%H%M%S" 2>/dev/null || echo "")
                
                if [ -n "$target_timestamp" ] && [ "$backup_timestamp" -le "$target_timestamp" ]; then
                    if [ "$backup_timestamp" -gt "$latest_time" ]; then
                        latest_time="$backup_timestamp"
                        latest_backup="$filename"
                    fi
                fi
            fi
        fi
    done
    
    if [ -z "$latest_backup" ]; then
        log_error "No backup found before ${target_time}"
        return 1
    fi
    
    log_info "Found backup: ${latest_backup}"
    
    # Restore the backup
    restore_full_backup "$latest_backup" "$target_db" true
}

# ============================================================================
# List Backups
# ============================================================================

list_backups() {
    log_info "Available backups:"
    echo ""
    echo "============================================================================"
    printf "%-5s %-40s %-10s %-15s\n" "#" "Filename" "Size" "Date"
    echo "============================================================================"
    
    local count=0
    for file in "${BACKUP_DIR}"/*.tar.gz; do
        if [ -f "$file" ]; then
            count=$((count + 1))
            local filename=$(basename "$file")
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1)
            printf "%-5s %-40s %-10s %-15s\n" "$count" "$filename" "$size" "$date"
        fi
    done
    
    echo "============================================================================"
    echo ""
    echo "Total: ${count} backup(s)"
}

# ============================================================================
# Main Command Handler
# ============================================================================

# Load environment variables
if [ -f "${CONFIG_DIR}/backup.env" ]; then
    source "${CONFIG_DIR}/backup.env"
fi

case "${1:-help}" in
    full)
        if [ -z "${2:-}" ]; then
            log_error "Usage: $0 full <backup_file> [target_db] [drop]"
            exit 1
        fi
        restore_full_backup "$2" "${3:-}" "${4:-false}"
        ;;
    
    database)
        if [ -z "${2:-}" ] || [ -z "${3:-}" ]; then
            log_error "Usage: $0 database <backup_file> <database_name> [drop]"
            exit 1
        fi
        restore_database "$2" "$3" "${4:-false}"
        ;;
    
    point)
        if [ -z "${2:-}" ]; then
            log_error "Usage: $0 point <target_time> [target_db]"
            log_error "Example: $0 point '2026-08-24 10:00:00'"
            exit 1
        fi
        restore_point_in_time "$2" "${3:-}"
        ;;
    
    list)
        list_backups
        ;;
    
    help|*)
        echo ""
        echo "============================================================================"
        echo "                    MongoDB Restore Script"
        echo "============================================================================"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  full <backup_file> [target_db] [drop]    Restore full backup"
        echo "  database <file> <db> [drop]              Restore specific database"
        echo "  point <time> [target_db]                 Point-in-time restore"
        echo "  list                                     List available backups"
        echo "  help                                     Show this help message"
        echo ""
        echo "Options:"
        echo "  target_db    Target database name (optional)"
        echo "  drop         Drop existing data before restore (default: false)"
        echo "  target_time  Target time for point-in-time restore"
        echo ""
        echo "Examples:"
        echo "  $0 full backup_20260824_020000.tar.gz"
        echo "  $0 full backup_20260824_020000.tar.gz pcl_staging true"
        echo "  $0 database backup_20260824_020000.tar.gz users"
        echo "  $0 point '2026-08-24 10:00:00'"
        echo "  $0 list"
        echo ""
        echo "============================================================================"
        echo ""
        ;;
esac
