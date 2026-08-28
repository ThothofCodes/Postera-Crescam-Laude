// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const mongoose = require('mongoose');

const ThreadEntrySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorRole: { type: String, enum: ['SUPER_ADMIN', 'DEPT_HEAD_OWNER', 'STAFF', 'CLIENT'] },
  message: { type: String, required: true, maxlength: 5000 },
  attachments: [String],
}, { timestamps: true });

const SLA_HOURS = {
  LOW: 120, MEDIUM: 48, HIGH: 4, CRITICAL: 2,
};

const TicketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  departmentSlug: { type: String, required: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  raisedByRole: { type: String, enum: ['CLIENT', 'STAFF'], required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 5000 },
  category: { type: String, default: 'General' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'AWAITING_CLIENT', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REOPENED'], default: 'OPEN' },
  slaDeadline: Date,
  slaBreach: { type: Boolean, default: false },
  thread: [ThreadEntrySchema],
  attachments: [String],
  resolvedAt: Date,
  closedAt: Date,
  satisfactionScore: {
    type: Number, min: 1, max: 5, default: null,
  },
  escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

TicketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model('Ticket').countDocuments({ departmentSlug: this.departmentSlug });
    const slug = this.departmentSlug.toUpperCase().slice(0, 3);
    this.ticketId = `RTS-${slug}-TKT-${String(count + 1).padStart(4, '0')}`;
  }
  if (!this.slaDeadline && this.priority) {
    const hours = SLA_HOURS[this.priority] || 48;
    this.slaDeadline = new Date(Date.now() + hours * 3600000);
  }
  next();
});

TicketSchema.index({ department: 1, status: 1, priority: 1 });
TicketSchema.index({ raisedBy: 1, status: 1 });

module.exports = mongoose.model('Ticket', TicketSchema);
