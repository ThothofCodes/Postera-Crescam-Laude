/**
 * Deployment Status Routes
 * 
 * Provides endpoints for monitoring deployment status and health.
 * Used by the blue-green deployment system to verify deployments.
 */

const express = require('express');
const router = express.Router();

// Deployment status
router.get('/status', (req, res) => {
  const deploymentEnv = process.env.DEPLOYMENT_ENV || 'blue';
  const startTime = process.env.START_TIME || new Date().toISOString();
  
  res.json({
    environment: deploymentEnv,
    status: 'active',
    uptime: process.uptime(),
    startedAt: startTime,
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
});

// Readiness check (for load balancer)
router.get('/ready', (req, res) => {
  // Check if database is connected
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (dbState === 1) {
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness check (for container orchestration)
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
