// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: {
    type: String, required: true, unique: true, lowercase: true,
  },
  description: String,
  color: { type: String, default: '#2BB6A3' }, // UI accent color (hex)
  icon: { type: String, default: '◈' }, // Emoji or symbol for UI
  contactEmail: String,
  contactPhone: String,
  operatingHours: String,
  logoUrl: String,
  monthlyTargets: [{ month: String, target: Number }], // e.g. [{month:'2026-01', target:50000}]
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
