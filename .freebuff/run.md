# Run Doc — Ruai Tech Solutions

## Reproduce artifacts

1. Copy `.env` files (already present in main checkout):
   - `backend/.env` — contains MONGO_URI, JWT_SECRET, MPESA keys
   - `frontend/.env` — contains VITE_API_URL

2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

## Run the server

### Backend (port 5001)
```bash
cd backend
setsid node server.js > /home/thoth/ruaitech_solutions/.freebuff/backend.log 2>&1 < /dev/null &
disown
```

### Frontend (port 3000)
```bash
cd frontend
setsid npx vite --port 3000 --host 0.0.0.0 > /home/thoth/ruaitech_solutions/.freebuff/preview-thmrtkdmn1ngql.log 2>&1 < /dev/null &
disown
```

## Verify

- Backend: `curl -s http://localhost:5001/api/health`
- Frontend: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
