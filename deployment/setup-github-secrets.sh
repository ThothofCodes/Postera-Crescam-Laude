#!/bin/bash
set -euo pipefail

# Interactive GitHub Secrets Setup Script
# Requires: gh CLI (https://cli.github.com)

REPO="ThothofCodes/Postera-Crescam-Laude"

echo "═══════════════════════════════════════════════════════════════"
echo "  GitHub Secrets Setup for Postera Crescam Laude"
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

add_secret() {
    local name="$1"
    local prompt="$2"
    local value=""
    
    read -p "$prompt" value
    
    if [[ -n "$value" ]]; then
        echo -n "$value" | gh secret set "$name" --repo "$REPO"
        echo "  ✓ Added $name"
    else
        echo "  ○ Skipped $name (empty)"
    fi
}

echo "Core Secrets:"
echo "─────────────"
add_secret "MONGO_URI" "MongoDB Atlas connection string: "
add_secret "JWT_SECRET" "JWT secret (or press Enter to generate): "
if [[ -z "${JWT_SECRET:-}" ]]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo -n "$JWT_SECRET" | gh secret set "JWT_SECRET" --repo "$REPO"
    echo "  ✓ Generated and added JWT_SECRET"
fi
add_secret "SUPER_ADMIN_EMAIL" "Admin email: "
add_secret "CLIENT_URL" "Frontend URL (e.g., https://your-app.vercel.app): "
add_secret "VITE_API_URL" "Backend API URL (e.g., https://your-service.onrender.com/api): "

echo ""
echo "M-Pesa:"
echo "────────"
add_secret "MPESA_CONSUMER_KEY" "Consumer Key: "
add_secret "MPESA_CONSUMER_SECRET" "Consumer Secret: "
add_secret "MPESA_SHORTCODE" "Shortcode: "
add_secret "MPESA_PASSKEY" "Passkey: "

echo ""
echo "Africa's Talking:"
echo "─────────────────"
add_secret "AT_USERNAME" "Username: "
add_secret "AT_API_KEY" "API Key: "

echo ""
echo "Render (Backend):"
echo "─────────────────"
add_secret "RENDER_API_KEY" "Render API Key: "
add_secret "RENDER_SERVICE_ID" "Render Service ID: "

echo ""
echo "Vercel (Frontend):"
echo "──────────────────"
add_secret "VERCEL_TOKEN" "Vercel Token: "
add_secret "VERCEL_PROJECT_ID" "Vercel Project ID: "
add_secret "VERCEL_ORG_ID" "Vercel Org ID: "

echo ""
echo "Netlify (Tech Hub):"
echo "───────────────────"
add_secret "NETLIFY_AUTH_TOKEN" "Netlify Auth Token: "
add_secret "NETLIFY_TECH_HUB_SITE_ID" "Netlify Tech Hub Site ID: "
add_secret "SANITY_PROJECT_ID" "Sanity Project ID: "
add_secret "SANITY_DATASET" "Sanity Dataset (default: production): "

echo ""
echo "Cyclic (Alternative Backend):"
echo "─────────────────────────────"
add_secret "CYCLIC_API_KEY" "Cyclic API Key: "
add_secret "CYCLIC_APP_NAME" "Cyclic App Name: "

echo ""
echo "Docker (Optional):"
echo "──────────────────"
add_secret "DOCKERHUB_USERNAME" "Docker Hub Username: "
add_secret "DOCKERHUB_TOKEN" "Docker Hub Token: "

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ Setup complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Trigger a deployment:"
echo "  git commit --allow-empty -m 'chore: trigger CD deployment'"
echo "  git push origin main"
echo ""
echo "Check progress:"
echo "  https://github.com/$REPO/actions"
