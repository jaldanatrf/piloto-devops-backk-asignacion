#!/bin/bash
# ============================================
# Cleanup Old Backups Script
# ============================================
# Purpose: Remove old backup folders to free disk space
# Usage: ./cleanup-backups.sh [days_to_keep]
# Example: ./cleanup-backups.sh 7  (keeps only last 7 days)

# Configuration
BACKUP_BASE_PATH="${BACKUP_PATH:-/path/to/backups}"  # Override with environment variable
DAYS_TO_KEEP="${1:-30}"  # Default: keep last 30 days
PROJECT_NAME="back-asignaciones"
DRY_RUN="${DRY_RUN:-false}"  # Set DRY_RUN=true to test without deleting

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "Backup Cleanup Script"
echo "============================================"
echo "Backup path: $BACKUP_BASE_PATH"
echo "Days to keep: $DAYS_TO_KEEP"
echo "Project: $PROJECT_NAME"
echo "Dry run: $DRY_RUN"
echo "============================================"

# Validate backup path exists
if [ ! -d "$BACKUP_BASE_PATH" ]; then
    echo -e "${RED}Error: Backup path does not exist: $BACKUP_BASE_PATH${NC}"
    exit 1
fi

# Find and list old backups
echo -e "\n${YELLOW}Searching for backups older than $DAYS_TO_KEEP days...${NC}"

# Find directories matching pattern and older than specified days
OLD_BACKUPS=$(find "$BACKUP_BASE_PATH" -maxdepth 1 -type d -name "${PROJECT_NAME}-*" -mtime +$DAYS_TO_KEEP)

if [ -z "$OLD_BACKUPS" ]; then
    echo -e "${GREEN}No old backups found. Nothing to delete.${NC}"
    exit 0
fi

# Count backups to delete
BACKUP_COUNT=$(echo "$OLD_BACKUPS" | wc -l)
echo -e "${YELLOW}Found $BACKUP_COUNT backup(s) to delete:${NC}"
echo "$OLD_BACKUPS"

# Calculate disk space to free
TOTAL_SIZE=0
while IFS= read -r backup; do
    if [ -d "$backup" ]; then
        SIZE=$(du -sm "$backup" 2>/dev/null | cut -f1)
        TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
        echo "  - $(basename "$backup"): ${SIZE}MB"
    fi
done <<< "$OLD_BACKUPS"

echo -e "\n${YELLOW}Total disk space to free: ${TOTAL_SIZE}MB${NC}"

# Confirmation prompt (skip if DRY_RUN)
if [ "$DRY_RUN" = "true" ]; then
    echo -e "\n${YELLOW}DRY RUN MODE - No files will be deleted${NC}"
    exit 0
fi

# Delete old backups
echo -e "\n${RED}Deleting old backups...${NC}"
DELETED_COUNT=0
while IFS= read -r backup; do
    if [ -d "$backup" ]; then
        echo "Deleting: $(basename "$backup")"
        rm -rf "$backup"
        if [ $? -eq 0 ]; then
            DELETED_COUNT=$((DELETED_COUNT + 1))
        else
            echo -e "${RED}Failed to delete: $backup${NC}"
        fi
    fi
done <<< "$OLD_BACKUPS"

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}Cleanup completed successfully${NC}"
echo -e "${GREEN}Deleted $DELETED_COUNT backup(s)${NC}"
echo -e "${GREEN}Freed approximately ${TOTAL_SIZE}MB of disk space${NC}"
echo -e "${GREEN}============================================${NC}"

# Show remaining backups
REMAINING=$(find "$BACKUP_BASE_PATH" -maxdepth 1 -type d -name "${PROJECT_NAME}-*" | wc -l)
echo -e "\n${YELLOW}Remaining backups: $REMAINING${NC}"
