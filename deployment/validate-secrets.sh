#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# PCL Deployment Secrets Validator
# Run this locally to verify your secrets are ready for GitHub
# Usage: bash deployment/validate-secrets.sh
# ═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0

check() {
    local name="$1"
    local value="${2:-}"
    local required="${3:-true}"
    
    if [[ -n "$value" ]]; then
        echo -e "  ${GREEN}✓${NC} $name: ${value:0:20}..."
        PASS=$((PASS + 1))
    elif [[ "$required" == "true" ]]; then
        echo -e "  ${RED}✗${NC} $name: ${RED}MISSING (required)${NC}"
        FAIL=$((FAIL + 1))
    else
        echo -e "  ${YELLOW}○${NC} $name: ${YELLOW}not set (optional)${NC}"
        SKIP=$((SKIP + 1))
    fi
}

echo -e "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  PCL Deployment Secrets Validator${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# Check if .env exists
if [[ -f ".env" ]]; then
    echo -e "${CYAN}Loading .env file...${NC}\n"
    set -a
    source .env
    set +a
else
    echo -e "${YELLOW}No .env file found. Checking environment variables...${NC}\n"
fi

echo -e "${CYAN}── Core Secrets ──${NC}"
check "MONGO_URI" "${MONGO_URI:-}" "true"
check "JWT_SECRET" "${JWT_SECRET:-}" "true"
check "SUPER_ADMIN_EMAIL" "${SUPER_ADMIN_EMAIL:-}" "true"
check "CLIENT_URL" "${CLIENT_URL:-}" "true"
check "VITE_API_URL" "${VITE_API_URL:-}" "true"

echo -e "\n${CYAN}── Heroku (Backend) ──${NC}"
check "HEROKU_API_KEY" "${HEROKU_API_KEY:-}" "false"
check "HEROKU_APP_NAME" "${HEROKU_APP_NAME:-}" "false"
check "HEROKU_EMAIL" "${HEROKU_EMAIL:-}" "false"

echo -e "\n${CYAN}── Vercel (Frontend) ──${NC}"
check "VERCEL_TOKEN" "${VERCEL_TOKEN:-}" "false"
check "VERCEL_PROJECT_ID" "${VERCEL_PROJECT_ID:-}" "false"
check "VERCEL_ORG_ID" "${VERCEL_ORG_ID:-}" "false"

echo -e "\n${CYAN}── Netlify (Tech Hub) ──${NC}"
check "NETLIFY_AUTH_TOKEN" "${NETLIFY_AUTH_TOKEN:-}" "false"
check "NETLIFY_TECH_HUB_SITE_ID" "${NETLIFY_TECH_HUB_SITE_ID:-}" "false"
check "SANITY_PROJECT_ID" "${SANITY_PROJECT_ID:-}" "false"

echo -e "\n${CYAN}── M-Pesa ──${NC}"
check "MPESA_CONSUMER_KEY" "${MPESA_CONSUMER_KEY:-}" "false"
check "MPESA_CONSUMER_SECRET" "${MPESA_CONSUMER_SECRET:-}" "false"
check "MPESA_SHORTCODE" "${MPESA_SHORTCODE:-}" "false"
check "MPESA_PASSKEY" "${MPESA_PASSKEY:-}" "false"

echo -e "\n${CYAN}── Africa's Talking ──${NC}"
check "AT_USERNAME" "${AT_USERNAME:-}" "false"
check "AT_API_KEY" "${AT_API_KEY:-}" "false"

echo -e "\n${CYAN}── Docker (Optional) ──${NC}"
check "DOCKERHUB_USERNAME" "${DOCKERHUB_USERNAME:-}" "false"
check "DOCKERHUB_TOKEN" "${DOCKERHUB_TOKEN:-}" "false"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}  ${YELLOW}Optional: $SKIP${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

if [[ $FAIL -gt 0 ]]; then
    echo -e "${RED}⚠  $FAIL required secrets are missing!${NC}"
    echo -e "   See deployment/SETUP_SECRETS.md for setup instructions.\n"
    exit 1
else
    echo -e "${GREEN}✓  All required secrets are configured!${NC}"
    echo -e "   Run ${CYAN}git push origin main${NC} to trigger deployment.\n"
    exit 0
fi
