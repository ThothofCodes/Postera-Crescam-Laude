/**
 * Database Health Monitoring Routes
 *
 * Provides comprehensive health check endpoints for monitoring:
 * - Overall database health
 * - Connection pool status
 * - Index health and usage
 * - Storage statistics
 * - Server status
 * - Slow queries
 * - Collection-specific stats
 */

const express = require('express');

const router = express.Router();
const dbHealthMonitor = require('../utils/dbHealth');
const { protect } = require('../middleware/auth');

const authGuard = protect;

// ============================================================================
// Public Health Endpoints (no auth required)
// ============================================================================

/**
 * GET /api/db-health/basic
 * Basic health check - quick status check
 */
router.get('/basic', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const isConnected = dbState === 1;

    res.json({
      status: isConnected ? 'ok' : 'error',
      database: isConnected ? 'connected' : 'disconnected',
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

// ============================================================================
// Protected Health Endpoints (auth required)
// ============================================================================

/**
 * GET /api/db-health
 * Comprehensive database health status
 */
router.get('/', authGuard, async (req, res) => {
  try {
    const healthStatus = await dbHealthMonitor.getHealthStatus();

    const statusCode = healthStatus.status === 'healthy' ? 200
      : healthStatus.status === 'warning' ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/db-health/connection-pool
 * Connection pool statistics
 */
router.get('/connection-pool', authGuard, async (req, res) => {
  try {
    const healthStatus = await dbHealthMonitor.getHealthStatus();

    res.json({
      status: 'ok',
      connectionPool: healthStatus.connectionPool,
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
 * GET /api/db-health/indexes
 * Index statistics and health
 */
router.get('/indexes', authGuard, async (req, res) => {
  try {
    const healthStatus = await dbHealthMonitor.getHealthStatus();

    res.json({
      status: 'ok',
      indexStats: healthStatus.indexStats,
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
 * GET /api/db-health/storage
 * Storage statistics
 */
router.get('/storage', authGuard, async (req, res) => {
  try {
    const healthStatus = await dbHealthMonitor.getHealthStatus();

    res.json({
      status: 'ok',
      storageStats: healthStatus.storageStats,
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
 * GET /api/db-health/server
 * Server status and performance
 */
router.get('/server', authGuard, async (req, res) => {
  try {
    const healthStatus = await dbHealthMonitor.getHealthStatus();

    res.json({
      status: 'ok',
      serverStatus: healthStatus.serverStatus,
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
 * GET /api/db-health/replica
 * Replica set status
 */
router.get('/replica', authGuard, async (req, res) => {
  try {
    const healthStatus = await dbHealthMonitor.getHealthStatus();

    res.json({
      status: 'ok',
      replicaSet: healthStatus.replicaSet,
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
 * GET /api/db-health/slow-queries
 * Slow queries (requires profiling)
 */
router.get('/slow-queries', authGuard, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const mongoose = require('mongoose');
    const { db } = mongoose.connection;

    const slowQueries = await dbHealthMonitor.getSlowQueries(db, limit);

    res.json({
      status: 'ok',
      slowQueries,
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
 * GET /api/db-health/collection/:name
 * Collection-specific statistics
 */
router.get('/collection/:name', authGuard, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { db } = mongoose.connection;

    const collectionStats = await dbHealthMonitor.getCollectionStats(db, req.params.name);

    res.json({
      status: 'ok',
      collection: collectionStats,
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
 * GET /api/db-health/all-collections
 * Statistics for all collections
 */
router.get('/all-collections', authGuard, async (req, res) => {
  try {
    const healthStatus = await dbHealthMonitor.getHealthStatus();

    res.json({
      status: 'ok',
      collections: healthStatus.indexStats?.collections || {},
      summary: healthStatus.indexStats?.summary || {},
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
 * GET /api/db-health/summary
 * Health summary for dashboards
 */
router.get('/summary', authGuard, async (req, res) => {
  try {
    const healthStatus = await dbHealthMonitor.getHealthStatus();

    res.json({
      status: 'ok',
      summary: {
        overall: healthStatus.status,
        connectionPool: {
          current: healthStatus.connectionPool?.current || 0,
          available: healthStatus.connectionPool?.available || 0,
          utilization: healthStatus.connectionPool?.utilizationPercent || 0,
          warnings: healthStatus.connectionPool?.warnings?.length || 0,
        },
        indexes: {
          totalCollections: healthStatus.indexStats?.summary?.totalCollections || 0,
          totalIndexes: healthStatus.indexStats?.summary?.totalIndexes || 0,
          unusedIndexes: healthStatus.indexStats?.summary?.totalUnusedIndexes || 0,
          collectionsWithWarnings: healthStatus.indexStats?.summary?.collectionsWithWarnings || 0,
        },
        storage: {
          dataSize: healthStatus.storageStats?.dataSizeFormatted || '0 Bytes',
          indexSize: healthStatus.storageStats?.indexSizeFormatted || '0 Bytes',
          efficiency: healthStatus.storageStats?.storageEfficiency?.score || 'unknown',
        },
        server: {
          version: healthStatus.serverStatus?.version || 'unknown',
          uptime: healthStatus.serverStatus?.uptimeFormatted || 'unknown',
        },
      },
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
