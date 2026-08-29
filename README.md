# Ruai Tech Solutions — Integrated Platform

**Author:** Thoth of Codes · `codeofthoth@outlook.com`  
**Stack:** MongoDB · Express · React · Node.js (MERN) · Socket.io  
**Location:** Ruai Town Centre, Nairobi County, Kenya  

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Environment Setup](#3-environment-setup)
4. [Database Setup](#4-database-setup)
5. [Seed the Database](#5-seed-the-database)
6. [Boot the Application](#6-boot-the-application)
7. [Access the Platform](#7-access-the-platform)
8. [Department URLs](#8-department-urls)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Production Build](#10-production-build)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Deployment](#12-deployment)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

Ensure the following are installed before proceeding:

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Node.js | 18.x or higher | `node --version` |
| npm | 9.x or higher | `npm --version` |
| MongoDB | Atlas (cloud) **or** local 6.x+ | `mongod --version` |
| Git | Any recent | `git --version` |

> **Network note:** If you are on a slow connection, use `npm install --prefer-offline` after the first install to avoid re-downloading packages.

---

## 2. Clone & Install

```bash
# Clone the repository
git clone https://github.com/Thothofcodes/ruaitech_solutions.git
cd ruaitech_solutions

# Install root dev tools (concurrently)
npm install

# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

Or using the single convenience command:

```bash
npm run install:all
```

> **Note:** If you are on a slow connection or want faster subsequent installations, use `npm install --prefer-offline` after the first install to avoid re-downloading packages.

### Resolving Dependency Conflicts

If you encounter dependency conflicts during installation, try these solutions:

```bash
# Clean install without cache
npm ci --prefix backend
npm ci --prefix frontend

# Force reinstall with legacy peer deps (if needed) - this resolves the Babel/ESLint conflicts
npm install --force --legacy-peer-deps --prefix backend
npm install --force --legacy-peer-deps --prefix frontend

# Alternative approach for handling the specific Babel/ESLint conflicts:
cd backend && npm install --legacy-peer-deps
cd ../frontend && npm install --legacy-peer-deps

# Clear npm cache and reinstall
npm cache clean --force
npm install --prefix backend
npm install --prefix frontend

# For Vercel/production builds specifically encountering Babel conflicts:
cd frontend
npm install --save-dev @babel/core@^7.29.7  # Downgrade to compatible version
npm install --legacy-peer-deps
```

> **Note:** The project currently has peer dependency conflicts between Babel versions (8.0.1 vs 7.x) and ESLint versions that may cause installation failures. Using `--legacy-peer-deps` flag bypasses these conflicts by ignoring the peerDependency tree and resolving the dependencies like npm v6. This is the recommended approach for CI/CD environments.

---

## 3. Environment Setup

### Backend

```bash
cd backend
cp .env.example .env
nano .env        # or use any text editor
```

Fill in every variable in `.env`. The critical ones to set before first boot:

```env
# 1 — Your MongoDB connection string
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ruaitech

# 2 — A strong random secret (generate with: openssl rand -base64 32)
JWT_SECRET=<min-32-character-random-string>

# 3 — Must exactly match the Super Admin account email
SUPER_ADMIN_EMAIL=codeofthoth@outlook.com

# 4 — M-Pesa Daraja credentials (get from developer.safaricom.co.ke)
MPESA_CONSUMER_KEY=<your_consumer_key>
MPESA_CONSUMER_SECRET=<your_consumer_secret>
MPESA_SHORTCODE=<your_shortcode>
MPESA_PASSKEY=<your_passkey>
MPESA_CALLBACK_URL=https://<your-domain>/api/payments/mpesa/callback

# 5 — Africa's Talking (get from account.africastalking.com)
AT_USERNAME=sandbox          # use 'sandbox' for testing
AT_API_KEY=<your_api_key>

# 6 — Passwords for the seed script (used ONCE, then remove from .env)
SEED_SUPER_ADMIN_PASSWORD=<strong-unique-password>
SEED_ADMIN_PASSWORD=<strong-unique-password>
```

---

## 4. Database Setup

1. **MongoDB Atlas** (recommended for production):
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas/database)
   - Navigate to Database Access → Add New Database User
   - Create a user with `Read and Write to Any Database` privilege
   - Navigate to Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
   - Copy the connection string and replace `<username>`, `<password>`, and `<cluster>` with your credentials

2. **Local MongoDB** (for development only):
   - Install MongoDB Community Edition
   - Start the MongoDB service: `sudo systemctl start mongod`
   - Verify it's running: `sudo systemctl status mongod`

---

## 5. Seed the Database

⚠️ **Important**: Only run the seed script once after the first installation.

```bash
# From the project root
npm run seed

# Or from the backend directory
cd backend && npm run seed
```

This creates:
- Super Admin account (email: `codeofthoth@outlook.com`)
- Admin accounts for each department
- Sample data for testing

After seeding, **remove** the `SEED_*` variables from your `.env` file.

---

## 6. Boot the Application

### Development Mode

```bash
# From the project root — boots both backend and frontend with hot reload
npm run dev
```

This command uses `concurrently` to run:
- Backend server on `http://localhost:5001`
- Frontend dev server on `http://localhost:3000`

> **For Public Access**: The frontend development server is configured to bind to all network interfaces (0.0.0.0:3000), making it accessible from external devices on the same network. Access the application at `http://YOUR_IP_ADDRESS:3000` where YOUR_IP_ADDRESS is your machine's IP address.

> **To run the store for public access**: Use the special `dev:store` command which explicitly sets the HOST and PORT environment variables:
> ```bash
> npm run dev:store
> ```

### Production Mode

```bash
# Terminal 1 — start backend
cd backend && npm start

# Terminal 2 — build and serve frontend
cd frontend && npm run build
npx serve -s dist
```

---

## 7. Access the Platform

| Role | URL | Credentials |
|------|-----|-------------|
| **Public** | `http://localhost:3000` | Browse freely |
| **Public (External)** | `http://YOUR_IP_ADDRESS:3000` | Browse freely (replace YOUR_IP_ADDRESS with your machine's IP) |
| **Super Admin** | `http://localhost:3000/admin/super` | Email: `codeofthoth@outlook.com` |
| **Admin Portal** | `http://localhost:3000/admin` | Department-specific access |
| **Staff Portal** | `http://localhost:3000/staff` | Company email-based access |

> **Note**: Default passwords for seeded accounts are the same as emails. Change them immediately after first login.

---

## 8. Department URLs

Each department has its dedicated admin panel:

| Department | URL |
|------------|-----|
| **Finance** | `http://localhost:3000/admin/finance` |
| **Inventory** | `http://localhost:3000/admin/inventory` |
| **CRM** | `http://localhost:3000/admin/crm` |
| **Booking** | `http://localhost:3000/admin/booking` |
| **Consultation** | `http://localhost:3000/admin/consultation` |
| **Service** | `http://localhost:3000/admin/service` |
| **Ticketing** | `http://localhost:3000/admin/tickets` |
| **Analytics** | `http://localhost:3000/admin/analytics` |

---

## 9. Environment Variables Reference

Complete `.env` template for `backend/.env`:

```env
# Database
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ruaitech
MONGO_LOCAL=mongodb://localhost:27017/ruaitech  # fallback for local dev

# Authentication
JWT_SECRET=<32-char-random-string>
JWT_EXPIRE=30d
SUPER_ADMIN_EMAIL=codeofthoth@outlook.com

# M-Pesa Daraja API
MPESA_ENV=sandbox                    # 'sandbox' or 'production'
MPESA_CONSUMER_KEY=<your_consumer_key>
MPESA_CONSUMER_SECRET=<your_consumer_secret>
MPESA_SHORTCODE=<your_shortcode>
MPESA_PASSKEY=<your_passkey>
MPESA_CALLBACK_URL=https://<your-domain>/api/billing/mpesa-callback
MPESA_INITIATOR_USERNAME=<initiator_username>
MPESA_INITIATOR_SECURITY_CREDENTIAL=<security_credential>

# Africa's Talking
AT_USERNAME=sandbox                 # 'sandbox' for testing
AT_API_KEY=<your_api_key>
AT_SHORTCODE=<short_code>
AT_PURCHASE_KEY=<purchase_key>

# Email (SendGrid recommended)
SENDGRID_API_KEY=<your_sendgrid_key>
EMAIL_FROM=noreply@ruaitech.co.ke

# Cloudinary (file uploads)
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# Server
PORT=5001
NODE_ENV=development                # 'development', 'production', or 'test'
CLIENT_URL=http://localhost:3000    # frontend URL for CORS
SERVER_URL=http://localhost:5001    # backend URL for API calls

# Seed script passwords (REMOVE after seeding)
SEED_SUPER_ADMIN_PASSWORD=<password>
SEED_ADMIN_PASSWORD=<password>
```

---

## 10. Production Build

### Frontend Build

```bash
cd frontend
npm run build
```

### Backend Build

Node.js applications don't require compilation, but ensure all production dependencies are installed:

```bash
cd backend
npm ci --only=production
```

### Docker Build

The project includes Docker support for containerized deployment:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

---

## 11. CI/CD Pipeline

The project includes a comprehensive CI/CD pipeline using GitHub Actions:

### CI (Continuous Integration)
- Runs on every push and pull request to `main` and `develop` branches
- Includes:
  - **Backend**: Linting (`npm run lint`), testing (Jest), security audits (npm audit), syntax validation, and parsing checks for server.js and seed.js
  - **Frontend**: Linting (ESLint), type checking (TypeScript), component tests (Vitest), and production build validation
  - Security scanning with npm audit
  - Code coverage reports
  - End-to-end simulation smoke tests with MongoDB service
  - Code quality checks
- Uses Node.js v20.x with dependency caching for faster builds
- Runs tests with a dedicated test database connection (mongodb://localhost:27017/ruaitech_ci_test)

### CD (Continuous Deployment)
- Runs on every push to `main` branch, manual triggers, and published releases
- Supports multiple deployment targets:

#### 1. PythonAnywhere (Primary Backend)
- Requires secrets: `PYTHONANYWHERE_API_TOKEN`, `PYTHONANYWHERE_USERNAME`, `PYTHONANYWHERE_DOMAIN`, `PYTHONANYWHERE_HOST`
- Optional for paid accounts: `PYTHONANYWHERE_SSH_PRIVATE_KEY` for direct code sync via rsync
- Optional for free accounts: `PYTHONANYWHERE_CONSOLE_ID` for code sync via Console API
- Automatically reloads the web application after deployment

#### 2. Vercel (Frontend)
- Requires secrets: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`, `VITE_API_URL`
- Deploys frontend as a static site with automatic SSL and global CDN

#### 3. Heroku (Alternative Backend)
- Requires secrets: `HEROKU_API_KEY`, `HEROKU_APP_NAME`, `HEROKU_EMAIL`
- Environment variables are securely passed during deployment
- Includes rollback capability on health check failure

#### 4. Docker Hub (Container Images)
- Requires secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- Builds and pushes both backend and frontend Docker images
- Tags images with commit SHA and latest tag
- Uses build caching for faster deployments

### Common CI/CD Issues and Solutions

#### Backend Test Failures
- Ensure all environment variables are properly set for CI tests
- Check that JWT_SECRET, NODE_ENV, and MONGO_URI are configured for the test environment
- Verify that all backend dependencies are correctly installed with `npm ci`

#### Frontend Build Failures
- Verify that VITE_API_URL is set during build process
- Check that all frontend dependencies are properly installed
- Ensure that the build process can resolve all imports and dependencies

#### Security Scan Failures
- Address moderate and high severity vulnerabilities with `npm audit fix`
- Review Trivy security scan results and update vulnerable packages
- Consider using `npm audit --audit-level=moderate` to identify specific issues

#### Dependency Installation Conflicts
- Use `npm ci` instead of `npm install` for consistent dependency resolution
- The pipeline uses `--legacy-peer-deps` flag to handle known Babel/ESLint peer dependency conflicts
- Clear npm cache periodically: `npm cache clean --force`

### Configuration
- Located in `.github/workflows/ci.yml` and `.github/workflows/cd.yml`
- Requires secrets to be configured in GitHub repository settings
- Uses environment protection rules for production deployments
- Supports conditional deployment based on available secrets
- See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions

---

## 12. Deployment

The application can be deployed to various platforms:

### PythonAnywhere
> Recommended for backend deployment
- Backend runs as a Node.js application
- Uses the PythonAnywhere API to reload the application
- Supports both free and paid plans

### Vercel (Frontend)
> Recommended for frontend deployment
- Frontend deployed as a static site
- Automatic SSL certificate
- Global CDN distribution

#### Preparing for Vercel Deployment

Before deploying to Vercel, ensure you resolve dependency conflicts that may occur during the build process:

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies with legacy peer deps flag to handle known conflicts:
```bash
npm install --legacy-peer-deps
```

3. Build the application locally to verify it works:
```bash
npm run build
```

#### Deploying to Vercel

Option 1: Using Vercel CLI:

1. Install the Vercel CLI:
```bash
npm i -g vercel
```

2. Navigate to the frontend directory:
```bash
cd frontend
```

3. Link your project to Vercel:
```bash
vercel
```

4. Set the build command to:
```bash
npm run vercel-build
```

5. Set the output directory to:
```bash
dist
```

6. Add the required environment variables:
- `VITE_API_URL`: Your backend API URL (e.g., https://your-backend-app.onrender.com/api)

7. Deploy:
```bash
vercel --prod
```

Option 2: Connect your GitHub repository to Vercel for automatic deployments on push.

#### Vercel Configuration Notes

- The project includes a [vercel.json](frontend/vercel.json) file in the frontend directory with proper routing configuration
- The build output directory is set to `dist` (changed from `build` for Vercel compatibility)
- Chunk splitting is configured to optimize bundle sizes
- API routes are properly proxied to your backend service

### Heroku
> Alternative backend deployment
- Platform-as-a-Service solution
- Easy scaling and monitoring

### Docker
> Containerized deployment
- Multi-platform support
- Consistent environments
- Easy scaling

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

---

## 13. Troubleshooting

### `npm install` fails

```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps --prefix backend
npm install --legacy-peer-deps --prefix frontend
```

### CI/CD Pipeline Failures

#### Backend lint, test, audit failures
- Run local tests before pushing: `npm test` in the backend directory
- Check linting issues: `npm run lint` (if available) - Note: The project now includes a lint script
- Verify all environment variables are properly set for tests
- Make sure all required dependencies are listed in package.json
- **Fixed failing tests**: The presence manager test issue with admin availability detection has been resolved. The `isAnyAdminOnlineForDept` function in [socket/presence.manager.js](backend/socket/presence.manager.js) now properly considers admin availability status.
- **Security improvements**: Added linting capabilities and improved security practices

#### Frontend lint, test, build failures
- Run local build: `npm run build` in the frontend directory
- Check for TypeScript/JavaScript errors: `npx tsc --noEmit` 
- Verify all imports are properly resolved
- Run component tests: `npm test` in the frontend directory

#### Security scan failures
- Update vulnerable packages: `npm audit fix`
- Check for high severity vulnerabilities: `npm audit --audit-level=high`
- Review security warnings and address critical issues before merging
- **Known vulnerabilities**: The backend has several vulnerabilities, particularly in `axios` (via africastalking), `js-yaml`, `lodash`, and `xlsx` packages. Run `npm audit` to see details.

#### Vercel deployment failures
- Verify frontend builds successfully: `npm run build` in frontend directory
- Check environment variables are properly configured in Vercel dashboard
- Ensure all dependencies are in production dependencies, not devDependencies
- Try clearing build cache in Vercel dashboard if persistent build errors occur

### Backend crashes on startup

```bash
# Check your .env is complete
cat backend/.env | grep -v "^#"

# Run with verbose logging
NODE_ENV=development node backend/server.js
```

### `DB: disconnected` on health check

- Verify `MONGO_URI` in `backend/.env` is correct
- Check your MongoDB Atlas IP whitelist includes your current IP
- Run: `curl http://localhost:5001/api/health`

### M-Pesa STK push not arriving

- `MPESA_CALLBACK_URL` must be a publicly reachable HTTPS URL
- For local development use [ngrok](https://ngrok.com): `ngrok http 5001`
- Set `MPESA_CALLBACK_URL=https://<ngrok-id>.ngrok.io/api/billing/mpesa-callback`
- Use `AT_USERNAME=sandbox` and the sandbox API key for testing

### Socket.io not connecting

- Ensure the browser is pointing to `http://localhost:3000` (not `5001` directly)
- The frontend proxy forwards `/socket.io` requests to port `5001` automatically
- Check that `CLIENT_URL=http://localhost:3000` is set in `backend/.env`

### "Too many requests" error

- The API rate limit is **100 requests per 15 minutes per IP** in production
- The auth endpoint limit is **10 attempts per 15 minutes per IP**
- In development these limits are relaxed

### Staff portal login fails

- Company email addresses must be provisioned by the Super Admin first
- Go to `/admin/super/email` → approve the email request → staff receives a setup link

---

## Project Structure

```
ruaitech_solutions/
├── backend/
│   ├── config/          # DB, Cloudinary, AT, mailer
│   ├── controllers/     # 21 route controllers
│   ├── middleware/       # auth, errorHandler, mpesa, upload
│   ├── models/          # 24 Mongoose schemas
│   ├── routes/          # 20 Express route files
│   ├── socket.js        # Socket.io server + emitters
│   ├── server.js        # Express app entry point
│   └── seed.js          # Database seed script
├── frontend/
│   └── src/
│       ├── admin/       # Dept admin panels + Super Admin
│       ├── components/  # Shared UI components
│       ├── hooks/       # useSocket, custom hooks
│       ├── pages/       # Public + staff + client portals
│       └── utils/       # api.js axios instance
├── .github/
│   └── workflows/       # CI/CD pipelines
├── docker-compose.yml   # Docker configuration
├── DEPLOYMENT.md        # Deployment guide
├── package.json         # Root scripts (npm run dev)
└── README.md            # This file
```

---

© 2026 Ruai Tech Solutions · Ruai Town Centre, Nairobi County, Kenya  
Super Administrator: **Thoth of Codes** · `codeofthoth@outlook.com` · [github.com/ThothofCodes](https://github.com/ThothofCodes)