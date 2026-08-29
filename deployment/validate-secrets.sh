#!/bin/bash
set -uo pipefail

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
        echo -e "  ${YELLOW}○${NC} $name: ${YELLOW}optional, not set${NC}"
        SKIP=$((SKIP + 1))
    fi
}

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Deployment Secrets Validator${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}Core Secrets:${NC}"
check "MONGO_URI" "${MONGO_URI:-}"
check "JWT_SECRET" "${JWT_SECRET:-}"
check "SUPER_ADMIN_EMAIL" "${SUPER_ADMIN_EMAIL:-}"
check "CLIENT_URL" "${CLIENT_URL:-}"
check "VITE_API_URL" "${VITE_API_URL:-}"

echo ""
echo -e "${CYAN}M-Pesa:${NC}"
check "MPESA_CONSUMER_KEY" "${MPESA_CONSUMER_KEY:-}"
check "MPESA_CONSUMER_SECRET" "${MPESA_CONSUMER_SECRET:-}"
check "MPESA_SHORTCODE" "${MPESA_SHORTCODE:-}"
check "MPESA_PASSKEY" "${MPESA_PASSKEY:-}"

echo ""
echo -e "${CYAN}Africa's Talking:${NC}"
check "AT_USERNAME" "${AT_USERNAME:-}"
check "AT_API_KEY" "${AT_API_KEY:-}"

echo ""
echo -e "${CYAN}Render (Backend):${NC}"
check "RENDER_API_KEY" "${RENDER_API_KEY:-}" "false"
check "RENDER_SERVICE_ID" "${RENDER_SERVICE_ID:-}" "false"

echo ""
echo -e "${CYAN}Vercel (Frontend):${NC}"
check "VERCEL_TOKEN" "${VERCEL_TOKEN:-}" "false"
check "VERCEL_PROJECT_ID" "${VERCEL_PROJECT_ID:-}" "false"
check "VERCEL_ORG_ID" "${VERCEL_ORG_ID:-}" "false"

echo ""
echo -e "${CYAN}Netlify (Tech Hub):${NC}"
check "NETLIFY_AUTH_TOKEN" "${NETLIFY_AUTH_TOKEN:-}" "false"
check "NETLIFY_TECH_HUB_SITE_ID" "${NETLIFY_TECH_HUB_SITE_ID:-}" "false"
check "SANITY_PROJECT_ID" "${SANITY_PROJECT_ID:-}" "false"
check "SANITY_DATASET" "${SANITY_DATASET:-}" "false"

echo ""
echo -e "${CYAN}Cyclic (Alternative Backend):${NC}"
check "CYCLIC_API_KEY" "${CYCLIC_API_KEY:-}" "false"
check "CYCLIC_APP_NAME" "${CYCLIC_APP_NAME:-}" "false"

echo ""
echo -e "${CYAN}Docker:${NC}"
check "DOCKERHUB_USERNAME" "${DOCKERHUB_USERNAME:-}" "false"
check "DOCKERHUB_TOKEN" "${DOCKERHUB_TOKEN:-}" "false"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Pass: ${PASS}${NC} | ${RED}Fail: ${FAIL}${NC} | ${YELLOW}Skip: ${SKIP}${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

if [[ $FAIL -gt 0 ]]; then
    echo ""
    echo -e "${RED}✗ Some required secrets are missing!${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}✓ All required secrets are set!${NC}"
    exit 0
fi
