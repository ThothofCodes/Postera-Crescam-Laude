/**
 * Connection Pool Health Check Routes
 *
 * Provides endpoints for monitoring and optimizing connection pool performance.
 */

const express = require('express');

const router = express.Router();
const ConnectionPoolManager = require('../utils/connectionPool');
const { protect } = require('../middleware/auth');

const authGuard = protect;

/**
 * GET /api/connection-pool
 * Get connection pool status and statistics
 */
router.get('/', authGuard, async (req, res) => {
  try {
    const stats = ConnectionPoolManager.getPoolStats();
    const health = await ConnectionPoolManager.monitorHealth();
    const recommendations = ConnectionPoolManager.getPerformanceRecommendations();

    res.json({
      status: 'ok',
      stats,
      health,
      recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/connection-pool/health
 * Quick health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = await ConnectionPoolManager.monitorHealth();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/connection-pool/stats
 * Get detailed connection pool statistics
 */
router.get('/stats', authGuard, async (req, res) => {
  try {
    const stats = ConnectionPoolManager.getPoolStats();

    res.json({
      status: 'ok',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/connection-pool/recommendations
 * Get performance recommendations
 */
router.get('/recommendations', authGuard, async (req, res) => {
  try {
    const recommendations = ConnectionPoolManager.getPerformanceRecommendations();

    res.json({
      status: 'ok',
      recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/connection-pool/metrics
 * Get Prometheus metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = ConnectionPoolManager.getPrometheusMetrics();

    res.setHeader('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('# Error generating metrics\n');
  }
});

/**
 * POST /api/connection-pool/warmup
 * Warm up connection pool
 */
router.post('/warmup', authGuard, async (req, res) => {
  try {
    const result = await ConnectionPoolManager.warmUpPool();

    res.json({
      status: result.success ? 'ok' : 'error',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
