# CD Deployment Secrets Setup Guide

## Overview

The CI/CD pipeline requires secrets configured in GitHub. This guide walks you through each one.

---

## Required Secrets by Platform

### 1. Core Secrets (Required for all deployments)

| Secret | How to Get |
|--------|-----------|
| `MONGO_URI` | MongoDB Atlas → Database → Connect → Connection string |
| `JWT_SECRET` | Run `openssl rand -base64 32` locally |
| `SUPER_ADMIN_EMAIL` | Your admin email address |
| `CLIENT_URL` | Your frontend URL (e.g., `https://your-app.vercel.app`) |
| `VITE_API_URL` | Your backend URL (e.g., `https://your-app.herokuapp.com/api`) |

### 2. M-Pesa (Safaricom Daraja)

| Secret | How to Get |
|--------|-----------|
| `MPESA_CONSUMER_KEY` | [Daraja Portal](https://developer.safaricom.co.ke) → App → Consumer Key |
| `MPESA_CONSUMER_SECRET` | Daraja Portal → App → Consumer Secret |
| `MPESA_SHORTCODE` | Safaricom assigned short code |
| `MPESA_PASSKEY` | Daraja Portal → App → Passkey |

### 3. Africa's Talking (SMS)

| Secret | How to Get |
|--------|-----------|
| `AT_USERNAME` | [Africa's Talking](https://africastalking.com) → Settings → Username |
| `AT_API_KEY` | Africa's Talking → Settings → API Key |

### 4. Render (Backend)

| Secret | How to Get |
|--------|-----------|
| `RENDER_API_KEY` | [Render Dashboard](https://dashboard.render.com) → Settings → API Keys → Create API Key |
| `RENDER_SERVICE_ID` | Create a Web Service → copy Service ID from URL or Settings |

### 5. Vercel (Frontend)

| Secret | How to Get |
|--------|-----------|
| `VERCEL_TOKEN` | [Vercel Account](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_PROJECT_ID` | Run `cd frontend && vercel link` → check `.vercel/project.json` |
| `VERCEL_ORG_ID` | Same as above, from `.vercel/project.json` |

### 6. Netlify (Tech Hub)

| Secret | How to Get |
|--------|-----------|
| `NETLIFY_AUTH_TOKEN` | [Netlify User Settings](https://app.netlify.com/user/applications#personal-access-tokens) → New access token |
| `NETLIFY_TECH_HUB_SITE_ID` | Import repo in Netlify → Site Settings → General → Site ID |
| `SANITY_PROJECT_ID` | [Sanity Manage](https://www.sanity.io/manage) → Project → ID |
| `SANITY_DATASET` | Default: `production` |

### 7. Cyclic.sh (Alternative Backend)

| Secret | How to Get |
|--------|-----------|
| `CYCLIC_API_KEY` | [Cyclic.sh Dashboard](https://console.cyclic.sh) → Settings → API Key |
| `CYCLIC_APP_NAME` | Your Cyclic app name (created during setup) |

### 8. Docker (Optional)

| Secret | How to Get |
|--------|-----------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | [Docker Hub](https://hub.docker.com/settings/security) → New Access Token |

---

## Step-by-Step Setup

### Step 1: Open GitHub Secrets

Go to: `https://github.com/ThothofCodes/Postera-Crescam-Laude/settings/secrets/actions`

### Step 2: Click "New repository secret" for each

Add each secret one by one with the exact name and value.

### Step 3: Verify

After adding all secrets, trigger a deployment:

```bash
cd /home/thoth/Postera-Crescam-Laude
git commit --allow-empty -m "chore: trigger CD deployment"
git push origin main
```

Check progress at: `https://github.com/ThothofCodes/Postera-Crescam-Laude/actions`

---

## Quick Start (Minimum Viable Deployment)

If you just want to get started quickly, you only need these 5 secrets:

1. `MONGO_URI` — MongoDB Atlas connection string
2. `JWT_SECRET` — Random 32-byte string
3. `VERCEL_TOKEN` — Vercel deploy token
4. `CLIENT_URL` — Your Vercel frontend URL
5. `VITE_API_URL` — Your backend API URL

Everything else will be skipped gracefully (each deployment step has `if: ${{ secrets.X != '' }}` guards).

---

## Troubleshooting

### "Deploy to Render" is skipped
→ Check that `RENDER_API_KEY` and `RENDER_SERVICE_ID` are set
→ Ensure Render service is connected to your GitHub repo

### "Deploy to Vercel" is skipped  
→ Check that `VERCEL_TOKEN` is set and valid

### "Deploy to Netlify" is skipped
→ Check that both `NETLIFY_AUTH_TOKEN` and `NETLIFY_TECH_HUB_SITE_ID` are set

### Backend crashes after deploy
→ Check Render logs: Go to Render Dashboard → Your Service → Logs
→ Verify `MONGO_URI` is correct and IP whitelist includes Render IPs

### Frontend shows API errors
→ Check `VITE_API_URL` matches your actual backend URL
→ Ensure CORS allows your Vercel domain
