#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# PCL GitHub Secrets Setup Helper
# Prerequisites: gh CLI installed and authenticated
# Usage: bash deployment/setup-github-secrets.sh
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO="ThothofCodes/Postera-Crescam-Laude"

# Check gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install it: https://cli.github.com/"
    exit 1
fi

# Check gh is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not authenticated.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  PCL GitHub Secrets Setup${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

set_secret() {
    local name="$1"
    local value="$2"
    
    if [[ -n "$value" ]]; then
        echo "$value" | gh secret set "$name" --repo "$REPO" 2>/dev/null
        if [[ $? -eq 0 ]]; then
            echo -e "  ${GREEN}✓${NC} $name set successfully"
        else
            echo -e "  ${RED}✗${NC} $name failed to set"
        fi
    fi
}

prompt_secret() {
    local name="$1"
    local description="$2"
    local required="${3:-false}"
    
    echo -e "${CYAN}$name${NC}"
    echo -e "  $description"
    
    if [[ "$required" == "true" ]]; then
        read -rsp "  Enter value (required): " value
    else
        read -rsp "  Enter value (optional, press Enter to skip): " value
    fi
    echo ""
    
    if [[ -n "$value" ]]; then
        set_secret "$name" "$value"
    elif [[ "$required" == "true" ]]; then
        echo -e "  ${YELLOW}⚠ Required secret not provided${NC}"
    else
        echo -e "  ${YELLOW}○ Skipped${NC}"
    fi
    echo ""
}

# ── Core Secrets ──
echo -e "${CYAN}── Core Secrets (Required) ──${NC}\n"
prompt_secret "MONGO_URI" "MongoDB Atlas connection string" "true"
prompt_secret "JWT_SECRET" "Random secret for JWT signing (run: openssl rand -base64 32)" "true"
prompt_secret "SUPER_ADMIN_EMAIL" "Your admin email address" "true"
prompt_secret "CLIENT_URL" "Frontend URL (e.g., https://your-app.vercel.app)" "true"
prompt_secret "VITE_API_URL" "Backend API URL (e.g., https://your-app.herokuapp.com/api)" "true"

# ── Heroku ──
echo -e "${CYAN}── Heroku (Backend Hosting) ──${NC}\n"
echo -e "  Get these from: https://dashboard.heroku.com/account"
prompt_secret "HEROKU_API_KEY" "Heroku API Key (Account → API Key → Reveal)" "false"
prompt_secret "HEROKU_APP_NAME" "Heroku app name (create at heroku.com)" "false"
prompt_secret "HEROKU_EMAIL" "Your Heroku account email" "false"

# ── Vercel ──
echo -e "${CYAN}── Vercel (Frontend Hosting) ──${NC}\n"
echo -e "  Get token from: https://vercel.com/account/tokens"
prompt_secret "VERCEL_TOKEN" "Vercel deploy token" "false"
prompt_secret "VERCEL_PROJECT_ID" "Run 'cd frontend && vercel link' then check .vercel/project.json" "false"
prompt_secret "VERCEL_ORG_ID" "Same as above, from .vercel/project.json" "false"

# ── Netlify ──
echo -e "${CYAN}── Netlify (Tech Hub Hosting) ──${NC}\n"
echo -e "  Get token from: https://app.netlify.com/user/applications"
prompt_secret "NETLIFY_AUTH_TOKEN" "Netlify personal access token" "false"
prompt_secret "NETLIFY_TECH_HUB_SITE_ID" "Netlify site ID (Site Settings → General)" "false"

# ── M-Pesa ──
echo -e "${CYAN}── M-Pesa Integration ──${NC}\n"
echo -e "  Get these from: https://developer.safaricom.co.ke"
prompt_secret "MPESA_CONSUMER_KEY" "Safaricom Daraja Consumer Key" "false"
prompt_secret "MPESA_CONSUMER_SECRET" "Safaricom Daraja Consumer Secret" "false"
prompt_secret "MPESA_SHORTCODE" "M-Pesa Paybill/Till Number" "false"
prompt_secret "MPESA_PASSKEY" "Safaricom Daraja Passkey" "false"

# ── Africa's Talking ──
echo -e "${CYAN}── Africa's Talking (SMS) ──${NC}\n"
echo -e "  Get these from: https://africastalking.com/account/keys"
prompt_secret "AT_USERNAME" "Africa's Talking username" "false"
prompt_secret "AT_API_KEY" "Africa's Talking API key" "false"

# ── Docker ──
echo -e "${CYAN}── Docker Hub (Optional) ──${NC}\n"
prompt_secret "DOCKERHUB_USERNAME" "Docker Hub username" "false"
prompt_secret "DOCKERHUB_TOKEN" "Docker Hub access token (Hub → Settings → Security)" "false"

# ── Sanity ──
echo -e "${CYAN}── Sanity CMS (Tech Hub) ──${NC}\n"
prompt_secret "SANITY_PROJECT_ID" "Sanity project ID" "false"
prompt_secret "SANITY_DATASET" "Sanity dataset (default: production)" "false"

# ── Summary ──
echo -e "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Secrets setup complete!${NC}"
echo -e "\nVerify at: https://github.com/$REPO/settings/secrets/actions"
echo -e "Trigger deploy: ${CYAN}git push origin main${NC}\n"
