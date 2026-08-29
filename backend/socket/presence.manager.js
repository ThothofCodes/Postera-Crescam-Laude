// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
/**
 * Admin Presence Manager — Single source of truth for who is online.
 * In-memory for single-server deployments.
 * Replace Map with Redis adapter for multi-instance deployments.
 * Hardened implementation with input validation, better error handling,
 * and improved data encapsulation.
 */

const adminSockets = new Map(); // adminId -> Set of socketIds (admin may have multiple tabs)
const pendingCallbacks = new Map(); // socketId -> { clientName, message, requestedAt, departmentSlug }
const adminAvailability = new Map(); // adminId -> boolean (whether admin wants to be available)

// ── Ruai Pulse — per-department presence metadata ─────────────────────────
// adminId -> { departmentSlug, isSuperAdmin, role, name }
// SUPER_ADMIN holds the highest clearance level in this system: their presence
// counts toward EVERY department's beacon, not just one. A Dept Head or Staff
// member's presence counts only toward their own department's beacon.
const adminMeta = new Map();

const presenceManager = {
  /**
   * Register an admin socket as online.
   * @param {string|number} adminId - The ID of the admin
   * @param {string} socketId - The socket ID to register
   * @param {object} [meta] - { departmentSlug, isSuperAdmin, role, name } — optional for
   *   backward compatibility with older call sites that only pass (adminId, socketId).
   */
  adminConnected(adminId, socketId, meta = {}) {
    if (adminId === undefined || adminId === null || socketId === undefined || socketId === null) {
      console.error('[PRESENCE] Invalid parameters in adminConnected:', { adminId, socketId });
      throw new Error('adminId and socketId must be defined and not null');
    }

    try {
      if (!adminSockets.has(adminId)) {
        adminSockets.set(adminId, new Set());
      }
      adminSockets.get(adminId).add(socketId);

      // Store/refresh presence metadata for department-scoped lookups.
      // Highest clearance (SUPER_ADMIN) is recorded explicitly so dept-scoped
      // checks can treat them as present everywhere, on every department beacon.
      adminMeta.set(adminId, {
        departmentSlug: meta.departmentSlug || adminMeta.get(adminId)?.departmentSlug || null,
        isSuperAdmin: meta.isSuperAdmin ?? adminMeta.get(adminId)?.isSuperAdmin ?? false,
        role: meta.role || adminMeta.get(adminId)?.role || null,
        name: meta.name || adminMeta.get(adminId)?.name || null,
      });

      // Set default availability to true when admin connects
      if (!adminAvailability.has(adminId)) {
        adminAvailability.set(adminId, true);
      }

      console.log(`[PRESENCE] Admin ${adminId} connected with socket ${socketId}. Total sockets: ${adminSockets.get(adminId).size}. Dept: ${adminMeta.get(adminId).departmentSlug || 'n/a'}, SuperAdmin: ${adminMeta.get(adminId).isSuperAdmin}. Available: ${this.isAdminAvailable(adminId)}`);
      console.log(`[PRESENCE] Total connected admins: ${this.onlineAdminCount()}`);
    } catch (error) {
      console.error(`[PRESENCE] Error in adminConnected: ${error.message}`, {
        error,
        adminId,
        socketId,
      });
      throw error;
    }
  },

  /**
   * Remove a specific socket (tab close, refresh) without marking admin fully offline
   * unless this was their last socket.
   * @param {string|number} adminId - The ID of the admin
   * @param {string} socketId - The socket ID to remove
   */
  adminDisconnected(adminId, socketId) {
    if (adminId === undefined || adminId === null || socketId === undefined || socketId === null) {
      console.error('[PRESENCE] Invalid parameters in adminDisconnected:', { adminId, socketId });
      throw new Error('adminId and socketId must be defined and not null');
    }

    try {
      const sockets = adminSockets.get(adminId);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          adminSockets.delete(adminId);
          adminMeta.delete(adminId); // no live sockets left — drop dept/clearance metadata too
          console.log(`[PRESENCE] Admin ${adminId} fully offline.`);
        } else {
          console.log(`[PRESENCE] Admin ${adminId} socket ${socketId} disconnected. Still connected: ${sockets.size} sockets.`);
        }
      } else {
        console.log(`[PRESENCE] Admin ${adminId} had no registered sockets, socket ${socketId} disconnect processed.`);
      }
    } catch (error) {
      console.error(`[PRESENCE] Error in adminDisconnected: ${error.message}`, {
        error,
        adminId,
        socketId,
      });
      throw error;
    }
  },

  isAnyAdminOnline() {
    try {
      // NEW LOGIC: For global chat availability, we only check if any admin is physically connected
      // regardless of their individual availability settings
      for (const [_adminId, sockets] of adminSockets) {
        if (sockets.size > 0) {
          // As long as any admin is physically connected, return true
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`[PRESENCE] Error in isAnyAdminOnline: ${error.message}`, { error });
      throw error;
    }
  },

  onlineAdminCount() {
    try {
      let count = 0;
      for (const [_adminId, sockets] of adminSockets) {
        if (sockets.size > 0) {
          count++;
        }
      }
      return count;
    } catch (error) {
      console.error(`[PRESENCE] Error in onlineAdminCount: ${error.message}`, { error });
      throw error;
    }
  },

  getFirstAdminSocketId() {
    try {
      for (const [adminId, sockets] of adminSockets) {
        if (sockets.size > 0) {
          const [first] = sockets;
          console.debug(`[PRESENCE] Found first socket for available admin ${adminId}: ${first}`);
          return first;
        }
      }
      return null;
    } catch (error) {
      console.error(`[PRESENCE] Error in getFirstAdminSocketId: ${error.message}`, { error });
      throw error;
    }
  },

  // ── Ruai Pulse — department-scoped presence ──────────────────────────────
  /**
   * Is anyone able to answer chat for a given department right now?
   * SUPER_ADMIN holds the highest clearance level in this system, so their
   * presence satisfies EVERY department's beacon — they don't need to be
   * tagged to a specific department to be "the admin" for one.
   * @param {string} deptSlug - e.g. 'playstation', 'repair', 'internet'
   */
  isAnyAdminOnlineForDept(deptSlug) {
    try {
      for (const [adminId, sockets] of adminSockets) {
        if (sockets.size === 0) continue; // Check physical connection only

        // Check if admin is available (not marked as unavailable)
        if (!this.isAdminAvailable(adminId)) continue;

        const meta = adminMeta.get(adminId);
        if (!meta) continue;
        if (meta.isSuperAdmin) return true; // highest clearance — covers every department
        if (deptSlug && meta.departmentSlug === deptSlug) return true;
      }
      return false;
    } catch (error) {
      console.error(`[PRESENCE] Error in isAnyAdminOnlineForDept: ${error.message}`, { error, deptSlug });
      throw error;
    }
  },

  /**
   * First reachable socket for a given department — SUPER_ADMIN sockets are
   * eligible for every department since they hold the highest clearance level.
   * @param {string} deptSlug
   */
  getFirstAdminSocketIdForDept(deptSlug) {
    try {
      for (const [adminId, sockets] of adminSockets) {
        if (sockets.size === 0) continue; // Check physical connection only
        const meta = adminMeta.get(adminId);
        if (!meta) continue;
        if (meta.isSuperAdmin || (deptSlug && meta.departmentSlug === deptSlug)) {
          const [first] = sockets;
          return first;
        }
      }
      return null;
    } catch (error) {
      console.error(`[PRESENCE] Error in getFirstAdminSocketIdForDept: ${error.message}`, { error, deptSlug });
      throw error;
    }
  },

  /**
   * A six(+)-beacon snapshot for dashboards: which departments currently have
   * live, available coverage. Used by the Ruai Pulse status board.
   * @param {string[]} allDeptSlugs - every department slug the business runs
   */
  getDepartmentBeacons(allDeptSlugs = []) {
    try {
      let superAdminOnline = false;
      for (const [adminId, sockets] of adminSockets) {
        const meta = adminMeta.get(adminId);
        if (meta?.isSuperAdmin && sockets.size > 0) {
          superAdminOnline = true;
          break;
        }
      }
      return allDeptSlugs.map((slug) => ({
        department: slug,
        online: superAdminOnline || this.isAnyAdminOnlineForDept(slug),
        coveredBySuperAdmin: superAdminOnline,
      }));
    } catch (error) {
      console.error(`[PRESENCE] Error in getDepartmentBeacons: ${error.message}`, { error });
      throw error;
    }
  },

  addPendingCallback(socketId, clientData) {
    if (!socketId) {
      console.error('[PRESENCE] Invalid socketId in addPendingCallback');
      throw new Error('socketId must be provided');
    }

    if (!clientData || typeof clientData !== 'object') {
      console.error('[PRESENCE] Invalid clientData in addPendingCallback', { clientData });
      throw new Error('clientData must be a valid object');
    }

    try {
      pendingCallbacks.set(socketId, { ...clientData, requestedAt: new Date() });
      console.debug(`[PRESENCE] Added pending callback for socket ${socketId}`);
    } catch (error) {
      console.error(`[PRESENCE] Error in addPendingCallback: ${error.message}`, {
        error,
        socketId,
        clientData,
      });
      throw error;
    }
  },

  getPendingCallbacks() {
    try {
      const callbacks = [...pendingCallbacks.entries()];
      console.debug(`[PRESENCE] Retrieved ${callbacks.length} pending callbacks`);
      return callbacks;
    } catch (error) {
      console.error(`[PRESENCE] Error in getPendingCallbacks: ${error.message}`, { error });
      throw error;
    }
  },

  removePendingCallback(socketId) {
    if (!socketId) {
      console.error('[PRESENCE] Invalid socketId in removePendingCallback');
      throw new Error('socketId must be provided');
    }

    try {
      const exists = pendingCallbacks.has(socketId);
      pendingCallbacks.delete(socketId);
      console.debug(`[PRESENCE] Removed pending callback for socket ${socketId}. Exists: ${exists}`);
      return exists;
    } catch (error) {
      console.error(`[PRESENCE] Error in removePendingCallback: ${error.message}`, {
        error,
        socketId,
      });
      throw error;
    }
  },

  clearCallbacks() {
    try {
      const count = pendingCallbacks.size;
      pendingCallbacks.clear();
      console.debug(`[PRESENCE] Cleared ${count} pending callbacks`);
      return count;
    } catch (error) {
      console.error(`[PRESENCE] Error in clearCallbacks: ${error.message}`, { error });
      throw error;
    }
  },

  // New methods for managing admin availability
  setAdminAvailability(adminId, available) {
    if (adminId === undefined || adminId === null || typeof available !== 'boolean') {
      console.error('[PRESENCE] Invalid parameters in setAdminAvailability:', { adminId, available });
      throw new Error('adminId and available must be provided and available must be boolean');
    }

    try {
      adminAvailability.set(adminId, available);
      console.log(`[PRESENCE] Admin ${adminId} availability set to ${available}`);

      // Log the impact on overall admin status
      console.log(`[PRESENCE] After availability change for admin ${adminId}, total available admins: ${this.onlineAdminCount()}`);
      console.log(`[PRESENCE] Overall admin status: ${this.isAnyAdminOnline() ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error(`[PRESENCE] Error in setAdminAvailability: ${error.message}`, {
        error,
        adminId,
        available,
      });
      throw error;
    }
  },

  isAdminAvailable(adminId) {
    try {
      // If admin hasn't set availability preference, default to true
      return adminAvailability.get(adminId) ?? true;
    } catch (error) {
      console.error(`[PRESENCE] Error in isAdminAvailable: ${error.message}`, { error });
      throw error;
    }
  },

  getAdminAvailability(adminId) {
    try {
      return adminAvailability.get(adminId) ?? true;
    } catch (error) {
      console.error(`[PRESENCE] Error in getAdminAvailability: ${error.message}`, { error });
      throw error;
    }
  },

  // Method to check if admin is truly connected across devices/networks
  isSpecificAdminOnline(adminId) {
    try {
      const sockets = adminSockets.get(adminId);
      const isOnline = !!sockets && sockets.size > 0 && this.isAdminAvailable(adminId);
      console.debug(`[PRESENCE] Admin ${adminId} online status: ${isOnline} (sockets: ${sockets?.size || 0}, available: ${this.isAdminAvailable(adminId)})`);
      return isOnline;
    } catch (error) {
      console.error(`[PRESENCE] Error in isSpecificAdminOnline: ${error.message}`, { error, adminId });
      throw error;
    }
  },

  // Method to get all socket IDs for a specific admin
  getAdminSocketIds(adminId) {
    try {
      const sockets = adminSockets.get(adminId);
      const socketIds = sockets ? Array.from(sockets) : [];
      console.debug(`[PRESENCE] Admin ${adminId} has ${socketIds.length} socket(s): [${socketIds.join(', ')}]`);
      return socketIds;
    } catch (error) {
      console.error(`[PRESENCE] Error in getAdminSocketIds: ${error.message}`, { error, adminId });
      throw error;
    }
  },
};

module.exports = {
  presenceManager,
  /**
   * Get a snapshot of current admin connections
   * @returns {Object} Admin connection snapshot
   */
  getAdminConnectionsSnapshot() {
    try {
      const snapshot = {};
      for (const [adminId, sockets] of adminSockets) {
        snapshot[adminId] = Array.from(sockets);
      }
      console.debug('[PRESENCE] Generated admin connections snapshot', snapshot);
      return snapshot;
    } catch (error) {
      console.error(`[PRESENCE] Error generating admin connections snapshot: ${error.message}`, { error });
      throw error;
    }
  },
};
