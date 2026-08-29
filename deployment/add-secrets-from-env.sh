#!/bin/bash
set -euo pipefail

# Batch add GitHub secrets from a .env file
# Usage: ./add-secrets-from-env.sh .env

REPO="ThothofCodes/Postera-Crescam-Laude"

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <env-file>"
    echo "Example: $0 .env"
    exit 1
fi

ENV_FILE="$1"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: File $ENV_FILE not found"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  Adding secrets from $ENV_FILE to $REPO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it: https://cli.github.com"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Please authenticate with GitHub first:"
    gh auth login
fi

COUNT=0
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes from value
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    
    if [[ -n "$value" ]]; then
        echo -n "$value" | gh secret set "$key" --repo "$REPO"
        echo "✓ Added $key"
        COUNT=$((COUNT + 1))
    fi
done < "$ENV_FILE"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ Added $COUNT secrets from $ENV_FILE"
echo "═══════════════════════════════════════════════════════════════"
