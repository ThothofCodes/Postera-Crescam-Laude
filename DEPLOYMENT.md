# Deployment Guide

This document explains how to deploy the Postera Crescam Laude platform using the CI/CD pipeline.

## Overview

The CI/CD pipeline is configured using GitHub Actions and supports multiple deployment targets:

- **PythonAnywhere** (primary backend deployment)
- **Vercel** (frontend deployment)
- **Heroku** (alternative backend deployment)
- **Docker Hub** (container images)

## Prerequisites

Before setting up deployment, ensure you have:

1. GitHub repository with admin access
2. Accounts on target deployment platforms
3. Proper API tokens and credentials

## GitHub Secrets Configuration

Add the following secrets to your GitHub repository under Settings → Secrets and variables → Actions:

### PythonAnywhere Deployment
- `PYTHONANYWHERE_USERNAME`: Your PythonAnywhere username
- `PYTHONANYWHERE_API_TOKEN`: From Account → API Token tab
- `PYTHONANYWHERE_DOMAIN`: e.g. codeofthoth.pythonanywhere.com
- `PYTHONANYWHERE_HOST`: www.pythonanywhere.com (US) or eu.pythonanywhere.com (EU)
- `PYTHONANYWHERE_CONSOLE_ID`: (Optional) Console ID for code sync on free accounts
- `PYTHONANYWHERE_SSH_PRIVATE_KEY`: (Optional) SSH private key for paid accounts with SSH access

### Vercel Deployment
- `VERCEL_TOKEN`: Vercel account token
- `VERCEL_PROJECT_ID`: Vercel project ID
- `VERCEL_ORG_ID`: Vercel organization ID
- `VITE_API_URL`: Backend API URL for frontend build

### Heroku Deployment
- `HEROKU_API_KEY`: Heroku account API key
- `HEROKU_APP_NAME`: Heroku app name
- `HEROKU_EMAIL`: Heroku account email

### Database and Services
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `SUPER_ADMIN_EMAIL`: Super admin email
- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`
- `AT_USERNAME`, `AT_API_KEY`: Africa's Talking credentials
- `CLIENT_URL`: Frontend URL

### Docker Hub (Optional)
- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

## Deployment Environments

The pipeline supports different environments:

- **Development**: Pushes to `develop` branch trigger CI tests only
- **Production**: Pushes to `main` branch trigger both CI tests and CD deployment
- **Manual**: Use GitHub Actions UI to manually trigger deployments

## Deployment Process

### Automatic Deployment

1. Push changes to the `main` branch
2. CI workflow runs automatically (linting, testing, building)
3. If CI passes, CD workflow deploys to configured platforms
4. Notifications are sent upon completion

### Manual Deployment

1. Go to the Actions tab in your GitHub repository
2. Select the "CD — Deploy" workflow
3. Click "Run workflow"
4. Choose the branch to deploy from

## PythonAnywhere Specific Notes

For PythonAnywhere deployment:

### Free Plan (Console API Method)
1. Create a bash console on PythonAnywhere
2. Note the console ID from the URL when viewing the console
3. Set `PYTHONANYWHERE_CONSOLE_ID` in GitHub secrets
4. The deployment will use the API to run `git pull` in your console

### Paid Plan (SSH Method)
1. Generate SSH keys
2. Add the public key to your PythonAnywhere account
3. Set `PYTHONANYWHERE_SSH_PRIVATE_KEY` in GitHub secrets
4. The deployment will use rsync to transfer files directly

## Docker Deployment

To build and run locally with Docker:

```bash
# With environment variables in .env file
docker-compose up --build

# Or with specific environment variables
MONGO_URI="mongodb://localhost:27017/pcl" \
JWT_SECRET="your_jwt_secret" \
SUPER_ADMIN_EMAIL="admin@example.com" \
docker-compose up --build
```

## Troubleshooting

### Deployment Failures

1. Check GitHub Action logs for specific error messages
2. Verify all required secrets are properly configured
3. Ensure the target deployment platform has enough resources

### Environment-Specific Issues

- **Frontend**: Make sure `VITE_API_URL` points to the correct backend endpoint
- **Backend**: Verify database connection strings and external service credentials
- **API Communication**: Check CORS settings and URL configurations

### Rollback

If a deployment causes issues:

1. Identify the last known good commit SHA
2. Create a hotfix branch from that commit
3. Deploy the hotfix or revert the changes

## Best Practices

1. Always test changes in the `develop` branch first
2. Use feature branches for development work
3. Maintain up-to-date secrets and rotate them periodically
4. Monitor deployment logs for any warnings or errors
5. Keep environment configurations consistent across platforms