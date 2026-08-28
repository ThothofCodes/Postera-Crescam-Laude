#!/bin/bash
# ============================================================================
# Scheduled Backup Script
# ============================================================================
# This script runs scheduled backups with logging and notifications.
# It's designed to be run via cron or systemd timer.
#
# Usage:
#   ./scheduled-backup.sh [backup_type]
#
# Backup types:
#   full        Full backup (default)
#   incremental Incremental backup
#   database    Database-specific backup
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}]")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"
VERIFY_SCRIPT="${SCRIPT_DIR}/verify-backups.sh"
CONFIG_DIR="$(dirname "$SCRIPT_DIR")/config"
LOG_DIR="${LOG_DIR:-/var/log/mongodb-backup}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/mongodb}"
LOCK_FILE="/tmp/mongodb-backup.lock"
MAX_LOCK_AGE=3600  # 1 hour

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

# Send notification (email, Slack, etc.)
send_notification() {
    local subject=$1
    local message=$2
    local status=$3  # success, warning, error
    
    # Load notification config
    if [ -f "${CONFIG_DIR}/backup.env" ]; then
        source "${CONFIG_DIR}/backup.env"
    fi
    
    # Email notification
    if [ "${ENABLE_EMAIL_NOTIFICATIONS:-false}" = "true" ]; then
        local email_subject="${EMAIL_SUBJECT_PREFIX:-[MongoDB Backup]} ${subject}"
        echo "$message" | mail -s "$email_subject" "${EMAIL_RECIPIENTS:-admin@example.com}"
    fi
    
    # Slack notification
    if [ "${ENABLE_SLACK_NOTIFICATIONS:-false}" = "true" ] && [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local emoji="✅"
        if [ "$status" = "warning" ]; then
            emoji="⚠️"
        elif [ "$status" = "error" ]; then
            emoji="❌"
        fi
        
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"${emoji} ${subject}\\n${message}\"}" \
            "${SLACK_WEBHOOK_URL}"
    fi
}

# Check for existing backup process
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid=$(cat "$LOCK_FILE")
        local lock_age=$(( ($(date +%s) - $(stat -c %Y "$LOCK_FILE")) ))
        
        if [ $lock_age -lt $MAX_LOCK_AGE ]; then
            if kill -0 "$lock_pid" 2>/dev/null; then
                log_error "Backup already running (PID: $lock_pid)"
                exit 1
            else
                log_warning "Stale lock file found, removing"
                rm -f "$LOCK_FILE"
            fi
        else
            log_warning "Lock file too old, removing"
            rm -f "$LOCK_FILE"
        fi
    fi
    
    # Create lock file
    echo $$ > "$LOCK_FILE"
}

# Remove lock file
remove_lock() {
    rm -f "$LOCK_FILE"
}

# Cleanup function
cleanup() {
    remove_lock
}

# ============================================================================
# Backup Functions
# ============================================================================

run_backup() {
    local backup_type=${1:-full}
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_file="${LOG_DIR}/scheduled_backup_${timestamp}.log"
    
    log_info "Starting scheduled backup: ${backup_type}"
    log_info "Log file: ${log_file}"
    
    # Start logging
    exec > >(tee -a "$log_file") 2>&1
    
    local start_time=$(date +%s)
    
    # Run backup
    case $backup_type in
        full)
            bash "$BACKUP_SCRIPT" full
            ;;
        database)
            # For database-specific backups, use the database name from env
            if [ -n "${BACKUP_DATABASE:-}" ]; then
                bash "$BACKUP_SCRIPT" database "$BACKUP_DATABASE"
            else
                log_error "BACKUP_DATABASE not set"
                return 1
            fi
            ;;
        *)
            log_error "Unknown backup type: ${backup_type}"
            return 1
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Backup completed in ${duration} seconds"
    
    # Verify backup
    log_info "Verifying backup..."
    local latest_backup=$(ls -t "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        if bash "$VERIFY_SCRIPT" --verify-latest; then
            log_success "Backup verification passed"
            
            # Send success notification
            send_notification \
                "Backup Completed Successfully" \
                "Backup type: ${backup_type}\\nDuration: ${duration}s\\nFile: $(basename "$latest_backup")" \
                "success"
        else
            log_error "Backup verification failed"
            
            # Send error notification
            send_notification \
                "Backup Verification Failed" \
                "Backup type: ${backup_type}\\nDuration: ${duration}s\\nFile: $(basename "$latest_backup")" \
                "error"
            
            return 1
        fi
    fi
    
    # Cleanup old backups
    log_info "Cleaning up old backups..."
    bash "$BACKUP_SCRIPT" cleanup
    
    # Stop logging
    exec > /dev/null 2>&1
    
    return 0
}

# ============================================================================
# Main
# ============================================================================

# Set trap for cleanup
trap cleanup EXIT

# Check lock
check_lock

# Run backup
backup_type=${1:-full}

if run_backup "$backup_type"; then
    log_success "Scheduled backup completed successfully"
    exit 0
else
    log_error "Scheduled backup failed"
    exit 1
fi
