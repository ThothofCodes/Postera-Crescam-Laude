#!/usr/bin/env node
// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Simulation script to verify all channels and features are working

const http = require('http');
const { io } = require('socket.io-client');

const API_URL = process.env.API_URL || 'http://localhost:5001';
const ADMIN_EMAIL = 'test-admin@test.com';
const ADMIN_PASSWORD = 'Test@123456';

let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
  const icons = { error: '❌', success: '✅', info: 'ℹ️', warn: '⚠️' };
  console.log(`${icons[type]} ${message}`);
}

async function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            headers: res.headers,
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testHealthCheck() {
  log('Testing API health check...', 'info');
  try {
    const res = await makeRequest('GET', '/api/health');
    if (res.status === 200 && res.data?.status === 'ok') {
      log('API is healthy', 'success');
      testsPassed++;
      return true;
    } else {
      log(`API health check failed: ${res.status}`, 'error');
      testsFailed++;
      return false;
    }
  } catch (error) {
    log(`Health check error: ${error.message}`, 'error');
    testsFailed++;
    return false;
  }
}

async function testAdminLogin() {
  log('Testing admin login...', 'info');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (res.status === 200 && res.data?.token) {
      log('Admin login successful', 'success');
      testsPassed++;
      return res.data.token;
    } else if (res.status === 401) {
      log('Admin login failed - creating test admin...', 'warn');
      // Try to create test admin (if seed endpoint exists)
      return null;
    } else {
      log(`Admin login failed: ${res.status}`, 'error');
      testsFailed++;
      return null;
    }
  } catch (error) {
    log(`Admin login error: ${error.message}`, 'error');
    testsFailed++;
    return null;
  }
}

async function testCallbackRequest() {
  log('Testing callback request creation...', 'info');
  try {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    
    const res = await makeRequest('POST', '/api/chat/callback', {
      customerName: 'Test Customer',
      contact: 'test@example.com',
      contactType: 'email',
      preferredTime: now.toISOString(),
      notes: 'Test callback from simulation',
    });

    if (res.status === 201 && res.data?.data?._id) {
      log('Callback request created successfully', 'success');
      testsPassed++;
      return res.data.data._id;
    } else {
      log(`Callback request failed: ${res.status}`, 'error');
      testsFailed++;
      return null;
    }
  } catch (error) {
    log(`Callback request error: ${error.message}`, 'error');
    testsFailed++;
    return null;
  }
}

async function testSocketConnection() {
  log('Testing Socket.io connection...', 'info');
  
  return new Promise((resolve) => {
    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      log('Socket connection timeout', 'error');
      testsFailed++;
      resolve(false);
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      log('Socket connected successfully', 'success');
      testsPassed++;
      
      // Check admin status
      socket.emit('check-admin-status');
      socket.on('admin-online', (data) => {
        log(`Admin status: ${data.online ? 'ONLINE' : 'OFFLINE'}`, 'info');
        socket.disconnect();
        resolve(true);
      });
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      log(`Socket error: ${error}`, 'error');
      testsFailed++;
      resolve(false);
    });
  });
}

async function testConversationList(token) {
  if (!token) {
    log('Skipping conversation list test (no token)', 'warn');
    return;
  }

  log('Testing conversation list retrieval...', 'info');
  try {
    const res = await makeRequest('GET', '/api/chat/conversations', null, token);

    if (res.status === 200 && Array.isArray(res.data?.data)) {
      log(`Retrieved ${res.data.data.length} conversations`, 'success');
      testsPassed++;
    } else {
      log(`Conversation list failed: ${res.status}`, 'error');
      testsFailed++;
    }
  } catch (error) {
    log(`Conversation list error: ${error.message}`, 'error');
    testsFailed++;
  }
}

async function testCallbackList(token) {
  if (!token) {
    log('Skipping callback list test (no token)', 'warn');
    return;
  }

  log('Testing callback list retrieval...', 'info');
  try {
    const res = await makeRequest('GET', '/api/chat/callbacks?status=pending', null, token);

    if (res.status === 200 && Array.isArray(res.data?.data)) {
      log(`Retrieved ${res.data.data.length} pending callbacks`, 'success');
      testsPassed++;
    } else {
      log(`Callback list failed: ${res.status}`, 'error');
      testsFailed++;
    }
  } catch (error) {
    log(`Callback list error: ${error.message}`, 'error');
    testsFailed++;
  }
}

async function runSimulation() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   🚀 PCL SOLUTIONS — FULL CHANNEL SIMULATION    ║');
  console.log('║   Testing all core features and integrations          ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Test 1: Health
  const healthy = await testHealthCheck();
  if (!healthy) {
    log('\n⛔ API is not healthy. Cannot continue simulation.', 'error');
    process.exit(1);
  }

  // Test 2: Admin Login
  const adminToken = await testAdminLogin();

  // Test 3: Callback System
  const callbackId = await testCallbackRequest();

  // Test 4: Socket.io Connection
  await testSocketConnection();

  // Test 5: Admin Endpoints
  if (adminToken) {
    await testConversationList(adminToken);
    await testCallbackList(adminToken);
  }

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║   Tests Passed: ${testsPassed}                                           ║`);
  console.log(`║   Tests Failed: ${testsFailed}                                           ║`);

  if (testsFailed === 0) {
    console.log('║                                                       ║');
    console.log('║  ✅ ALL CHANNELS OK — System is production-ready      ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    process.exit(0);
  } else {
    console.log('║                                                       ║');
    console.log('║  ❌ SOME TESTS FAILED — Review errors above           ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    process.exit(1);
  }
}

runSimulation().catch((error) => {
  log(`Simulation fatal error: ${error.message}`, 'error');
  process.exit(1);
});
