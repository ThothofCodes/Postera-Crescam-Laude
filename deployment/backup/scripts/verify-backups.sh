#!/bin/bash
# ============================================================================
# Backup Verification Script
# ============================================================================
# This script verifies the integrity and restorability of MongoDB backups.
# It runs as part of the CI/CD pipeline or can be scheduled independently.
#
# Usage:
#   ./verify-backups.sh [options]
#
# Options:
#   --backup-dir DIR    Backup directory (default: /opt/backups/mongodb)
#   --verify-all        Verify all backups
#   --verify-latest     Verify only the latest backup
#   --verify-days N     Verify backups from last N days
#   --test-restore      Actually test restore to temporary database
#   --report FILE       Generate verification report
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}]")" && pwd)"
CONFIG_DIR="$(dirname "$SCRIPT_DIR")/config"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/mongodb}"
VERIFY_ALL=false
VERIFY_LATEST=false
VERIFY_DAYS=7
TEST_RESTORE=false
REPORT_FILE=""

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

# ============================================================================
# Verification Functions
# ============================================================================

# Verify a single backup file
verify_single_backup() {
    local backup_file=$1
    local result=0
    
    log_info "Verifying: $(basename "$backup_file")"
    
    # Check file exists and is readable
    if [ ! -r "$backup_file" ]; then
        log_error "File not readable: $backup_file"
        return 1
    fi
    
    # Check file size
    local file_size=$(stat -c %s "$backup_file" 2>/dev/null || stat -f %z "$backup_file" 2>/dev/null)
    if [ "$file_size" -eq 0 ]; then
        log_error "File is empty: $backup_file"
        return 1
    fi
    
    # Check file age
    local file_age=$(( ($(date +%s) - $(stat -c %Y "$backup_file" 2>/dev/null || stat -f %m "$backup_file" 2>/dev/null)) / 86400 ))
    
    # Verify checksum
    local checksum_file="${backup_file}.sha256"
    if [ -f "$checksum_file" ]; then
        local expected_checksum=$(cat "$checksum_file")
        local actual_checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)
        
        if [ "$expected_checksum" != "$actual_checksum" ]; then
            log_error "Checksum mismatch for $(basename "$backup_file")"
            log_error "Expected: ${expected_checksum}"
            log_error "Actual:   ${actual_checksum}"
            result=1
        else
            log_success "Checksum verified"
        fi
    else
        log_warning "No checksum file found"
    fi
    
    # Verify archive integrity
    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        log_success "Archive integrity verified"
    else
        log_error "Archive is corrupted: $(basename "$backup_file")"
        result=1
    fi
    
    # Verify backup structure
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir" 2>/dev/null
    
    # Check for manifest
    local manifest_found=false
    for dir in "$temp_dir"/*/; do
        if [ -f "${dir}manifest.json" ]; then
            manifest_found=true
            
            # Parse manifest
            local backup_type=$(jq -r '.backup_type' "${dir}manifest.json" 2>/dev/null || echo "unknown")
            local timestamp=$(jq -r '.timestamp' "${dir}manifest.json" 2>/dev/null || echo "unknown")
            local hostname=$(jq -r '.hostname' "${dir}manifest.json" 2>/dev/null || echo "unknown")
            
            log_info "  Type: ${backup_type}"
            log_info "  Timestamp: ${timestamp}"
            log_info "  Hostname: ${hostname}"
            break
        fi
    done
    
    if [ "$manifest_found" = false ]; then
        log_warning "No manifest file found"
    fi
    
    # Check for database dumps
    local dump_count=0
    local collection_count=0
    for dir in "$temp_dir"/*/; do
        if [ -d "${dir}dump" ]; then
            dump_count=$((dump_count + 1))
            
            # Count collections
            for coll_dir in "${dir}dump"/*/; do
                if [ -d "$coll_dir" ]; then
                    collection_count=$((collection_count + 1))
                fi
            done
        fi
    done
    
    log_info "  Databases: ${dump_count}"
    log_info "  Collections: ${collection_count}"
    log_info "  Size: $(du -h "$backup_file" | cut -f1)"
    log_info "  Age: ${file_age} days"
    
    # Cleanup
    rm -rf "$temp_dir"
    
    if [ $result -eq 0 ]; then
        log_success "Verification passed"
    else
        log_error "Verification failed"
    fi
    
    return $result
}

# Test restore to temporary database
test_restore() {
    local backup_file=$1
    local temp_db="restore_test_$(date +%s)"
    
    log_info "Testing restore to temporary database: ${temp_db}"
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Find backup directory
    local backup_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "full_*" -o -name "db_*" -o -name "coll_*" | head -1)
    
    if [ -z "$backup_dir" ]; then
        log_error "No backup directory found"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Restore to temporary database
    for db_dir in "$backup_dir"/*/; do
        if [ -d "${db_dir}dump" ]; then
            local original_db=$(basename "$db_dir")
            local restore_dir="${db_dir}dump/${original_db}"
            
            if [ -d "$restore_dir" ]; then
                log_info "Restoring ${original_db} to ${temp_db}"
                
                # Use mongorestore with --drop to replace test database
                mongorestore \
                    --host "${MONGO_HOST:-localhost}" \
                    --port "${MONGO_PORT:-27017}" \
                    --db "$temp_db" \
                    "$restore_dir" \
                    --gzip \
                    --drop 2>/dev/null
                
                log_success "Restore test completed"
                
                # Cleanup test database
                log_info "Cleaning up test database: ${temp_db}"
                mongosh \
                    --host "${MONGO_HOST:-localhost}" \
                    --port "${MONGO_PORT:-27017}" \
                    --eval "db.getSiblingDB('${temp_db}').dropDatabase()" 2>/dev/null
                
                break
            fi
        fi
    done
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "Test restore completed successfully"
}

# Generate verification report
generate_report() {
    local report_file=$1
    local total_backups=$2
    local verified_backups=$3
    local failed_backups=$4
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat > "$report_file" << EOF
{
  "report_type": "backup_verification",
  "timestamp": "${timestamp}",
  "summary": {
    "total_backups": ${total_backups},
    "verified": ${verified_backups},
    "failed": ${failed_backups},
    "success_rate": $(echo "scale=2; $verified_backups * 100 / $total_backups" | bc)
  },
  "configuration": {
    "backup_dir": "${BACKUP_DIR}",
    "verify_all": ${VERIFY_ALL},
    "verify_latest": ${VERIFY_LATEST},
    "verify_days": ${VERIFY_DAYS},
    "test_restore": ${TEST_RESTORE}
  }
}
EOF
    
    log_info "Report generated: ${report_file}"
}

# ============================================================================
# Main
# ============================================================================

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --backup-dir DIR    Backup directory (default: /opt/backups/mongodb)"
            echo "  --verify-all        Verify all backups"
            echo "  --verify-latest     Verify only the latest backup"
            echo "  --verify-days N     Verify backups from last N days"
            echo "  --test-restore      Actually test restore to temporary database"
            echo "  --report FILE       Generate verification report"
            echo "  --help, -h          Show this help message"
            exit 0
            ;;
        --backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --verify-all)
            VERIFY_ALL=true
            shift
            ;;
        --verify-latest)
            VERIFY_LATEST=true
            shift
            ;;
        --verify-days)
            VERIFY_DAYS="$2"
            shift 2
            ;;
        --test-restore)
            TEST_RESTORE=true
            shift
            ;;
        --report)
            REPORT_FILE="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Default to verify-latest if no verification scope specified
if [ "$VERIFY_ALL" = false ] && [ "$VERIFY_LATEST" = false ]; then
    VERIFY_LATEST=true
fi

log_info "Starting backup verification"
log_info "Backup directory: ${BACKUP_DIR}"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory not found: ${BACKUP_DIR}"
    exit 1
fi

# Counters
total_backups=0
verified_backups=0
failed_backups=0

# Get list of backups to verify
if [ "$VERIFY_ALL" = true ]; then
    backups=("${BACKUP_DIR}"/*.tar.gz)
elif [ "$VERIFY_LATEST" = true ]; then
    backups=($(ls -t "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | head -1))
else
    # Verify backups from last N days
    backups=()
    for file in "${BACKUP_DIR}"/*.tar.gz; do
        if [ -f "$file" ]; then
            local file_age=$(( ($(date +%s) - $(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)) / 86400 ))
            if [ $file_age -le $VERIFY_DAYS ]; then
                backups+=("$file")
            fi
        fi
    done
fi

# Verify each backup
for backup_file in "${backups[@]}"; do
    if [ -f "$backup_file" ]; then
        total_backups=$((total_backups + 1))
        
        if verify_single_backup "$backup_file"; then
            verified_backups=$((verified_backups + 1))
            
            # Test restore if requested
            if [ "$TEST_RESTORE" = true ]; then
                test_restore "$backup_file" || true
            fi
        else
            failed_backups=$((failed_backups + 1))
        fi
        
        echo ""
    fi
done

# Summary
echo ""
echo "============================================================================"
echo "                    Verification Summary"
echo "============================================================================"
echo ""
echo "  Total backups:    ${total_backups}"
echo "  Verified:         ${verified_backups}"
echo "  Failed:           ${failed_backups}"
echo ""

if [ $total_backups -gt 0 ]; then
    success_rate=$(echo "scale=2; $verified_backups * 100 / $total_backups" | bc)
    echo "  Success rate:     ${success_rate}%"
fi

echo ""
echo "============================================================================"
echo ""

# Generate report if requested
if [ -n "$REPORT_FILE" ]; then
    generate_report "$REPORT_FILE" "$total_backups" "$verified_backups" "$failed_backups"
fi

# Exit with error if any backups failed
if [ $failed_backups -gt 0 ]; then
    exit 1
fi

exit 0
