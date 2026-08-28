#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# PCL GitHub Secrets Batch Setup
# Adds all secrets from a .env file to GitHub
# Usage: bash deployment/add-secrets-from-env.sh /path/to/.env
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO="ThothofCodes/Postera-Crescam-Laude"
ENV_FILE="${1:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}Error: File $ENV_FILE not found${NC}"
    echo "Usage: bash deployment/add-secrets-from-env.sh /path/to/.env"
    echo ""
    echo "Create a .env file with your secrets:"
    echo "  MONGO_URI=mongodb+srv://..."
    echo "  JWT_SECRET=your-secret-here"
    echo "  VERCEL_TOKEN=your-token-here"
    echo "  ...etc"
    exit 1
fi

echo -e "\n${CYAN}Adding secrets from $ENV_FILE to GitHub ($REPO)...${NC}\n"

# List of secrets the CD workflow needs
SECRETS=(
    MONGO_URI JWT_SECRET SUPER_ADMIN_EMAIL CLIENT_URL VITE_API_URL
    HEROKU_API_KEY HEROKU_APP_NAME HEROKU_EMAIL
    VERCEL_TOKEN VERCEL_PROJECT_ID VERCEL_ORG_ID
    NETLIFY_AUTH_TOKEN NETLIFY_TECH_HUB_SITE_ID
    SANITY_PROJECT_ID SANITY_DATASET
    MPESA_CONSUMER_KEY MPESA_CONSUMER_SECRET MPESA_SHORTCODE MPESA_PASSKEY
    AT_USERNAME AT_API_KEY
    DOCKERHUB_USERNAME DOCKERHUB_TOKEN
    BACKEND_URL
)

ADDED=0
SKIPPED=0

for secret in "${SECRETS[@]}"; do
    # Extract value from .env file
    value=$(grep -E "^${secret}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [[ -n "$value" ]]; then
        echo "$value" | gh secret set "$secret" --repo "$REPO" 2>/dev/null
        if [[ $? -eq 0 ]]; then
            echo -e "  ${GREEN}✓${NC} $secret"
            ADDED=$((ADDED + 1))
        else
            echo -e "  ${RED}✗${NC} $secret (failed)"
        fi
    else
        echo -e "  ${CYAN}○${NC} $secret (not in .env)"
        SKIPPED=$((SKIPPED + 1))
    fi
done

echo -e "\n${GREEN}Done: $ADDED secrets added, $SKIPPED skipped${NC}"
echo -e "Verify: https://github.com/$REPO/settings/secrets/actions\n"
