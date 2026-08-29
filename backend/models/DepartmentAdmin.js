// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const mongoose = require('mongoose');

const DepartmentAdminSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  departmentSlug: {
    type: String,
    required: true,
  },
  adminEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  adminName: {
    type: String,
    required: true,
  },
  allocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['DEPT_HEAD_OWNER', 'STAFF'],
    default: 'STAFF',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false },
    canManageBilling: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canManageTickets: { type: Boolean, default: false },
  },
  notes: String,
  allocatedAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessAt: Date,
}, { timestamps: true });

// Ensure one admin per department (but can have multiple admins per department)
DepartmentAdminSchema.index({ department: 1, adminEmail: 1 }, { unique: true });

module.exports = mongoose.model('DepartmentAdmin', DepartmentAdminSchema);
