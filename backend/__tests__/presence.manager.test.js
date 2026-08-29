// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
//
// Continuity Audit fix coverage: this is the first real test file the
// project has had (jest/supertest were installed but zero *.test.js files
// existed anywhere — see CHANGELOG_PHASE9.md). It targets exactly the logic
// this fix pass touched: per-department presence (Pulse) and the rule
// that SUPER_ADMIN holds the highest clearance level and is therefore
// treated as present on every department's beacon.

const { presenceManager } = require('../socket/presence.manager');

describe('presenceManager — department scoping & SUPER_ADMIN clearance', () => {
  afterEach(() => {
    // presence.manager.js holds module-level Maps with no reset method,
    // so each test uses unique IDs to avoid bleeding state between cases.
  });

  test('a STAFF connection covers only its own department', () => {
    presenceManager.adminConnected('staff-1', 'sock-staff-1', {
      departmentSlug: 'repair',
      isSuperAdmin: false,
      role: 'STAFF',
    });

    expect(presenceManager.isAnyAdminOnlineForDept('repair')).toBe(true);
    expect(presenceManager.isAnyAdminOnlineForDept('playstation')).toBe(false);

    presenceManager.adminDisconnected('staff-1', 'sock-staff-1');
    expect(presenceManager.isAnyAdminOnlineForDept('repair')).toBe(false);
  });

  test('a DEPT_HEAD_OWNER is recognized as admin-capable (previously failed via substring match)', () => {
    presenceManager.adminConnected('depthead-1', 'sock-depthead-1', {
      departmentSlug: 'cybersecurity',
      isSuperAdmin: false,
      role: 'DEPT_HEAD_OWNER',
    });

    expect(presenceManager.isAnyAdminOnlineForDept('cybersecurity')).toBe(true);
    expect(presenceManager.isAnyAdminOnline()).toBe(true);

    presenceManager.adminDisconnected('depthead-1', 'sock-depthead-1');
  });

  test('SUPER_ADMIN holds the highest clearance level — covers every department, not just their own', () => {
    presenceManager.adminConnected('super-1', 'sock-super-1', {
      departmentSlug: null, // SUPER_ADMIN need not belong to any single department
      isSuperAdmin: true,
      role: 'SUPER_ADMIN',
    });

    expect(presenceManager.isAnyAdminOnlineForDept('repair')).toBe(true);
    expect(presenceManager.isAnyAdminOnlineForDept('playstation')).toBe(true);
    expect(presenceManager.isAnyAdminOnlineForDept('internet')).toBe(true);
    expect(presenceManager.isAnyAdminOnlineForDept('cybersecurity')).toBe(true);
    expect(presenceManager.isAnyAdminOnlineForDept('webdev')).toBe(true);
    expect(presenceManager.isAnyAdminOnlineForDept('govadmin')).toBe(true);

    presenceManager.adminDisconnected('super-1', 'sock-super-1');
    expect(presenceManager.isAnyAdminOnlineForDept('repair')).toBe(false);
  });

  test('getDepartmentBeacons reports per-department coverage and flags SUPER_ADMIN coverage explicitly', () => {
    presenceManager.adminConnected('staff-2', 'sock-staff-2', {
      departmentSlug: 'internet',
      isSuperAdmin: false,
      role: 'STAFF',
    });

    const beacons = presenceManager.getDepartmentBeacons(['internet', 'repair', 'playstation']);
    const internet = beacons.find((b) => b.department === 'internet');
    const repair = beacons.find((b) => b.department === 'repair');

    expect(internet.online).toBe(true);
    expect(internet.coveredBySuperAdmin).toBe(false);
    expect(repair.online).toBe(false);

    presenceManager.adminDisconnected('staff-2', 'sock-staff-2');
  });

  test('an admin marked unavailable does not count as online for their department, even while connected', () => {
    presenceManager.adminConnected('staff-3', 'sock-staff-3', {
      departmentSlug: 'govadmin',
      isSuperAdmin: false,
      role: 'STAFF',
    });
    presenceManager.setAdminAvailability('staff-3', false);

    expect(presenceManager.isAnyAdminOnlineForDept('govadmin')).toBe(false);

    presenceManager.setAdminAvailability('staff-3', true);
    expect(presenceManager.isAnyAdminOnlineForDept('govadmin')).toBe(true);

    presenceManager.adminDisconnected('staff-3', 'sock-staff-3');
  });

  test('multiple tabs for the same admin: department stays covered until the LAST socket disconnects', () => {
    presenceManager.adminConnected('staff-4', 'sock-staff-4-tab1', {
      departmentSlug: 'webdev', isSuperAdmin: false, role: 'STAFF',
    });
    presenceManager.adminConnected('staff-4', 'sock-staff-4-tab2', {
      departmentSlug: 'webdev', isSuperAdmin: false, role: 'STAFF',
    });

    presenceManager.adminDisconnected('staff-4', 'sock-staff-4-tab1');
    expect(presenceManager.isAnyAdminOnlineForDept('webdev')).toBe(true); // tab2 still open

    presenceManager.adminDisconnected('staff-4', 'sock-staff-4-tab2');
    expect(presenceManager.isAnyAdminOnlineForDept('webdev')).toBe(false); // now fully offline
  });
});
