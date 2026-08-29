const mongoose = require('mongoose');
// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const Department = require('../models/Department');

const DEPT_SEED = [
  { name: 'Internet Distribution', slug: 'internet', description: 'ISP packages, hotspot sessions, network management', color: '#2BB6A3', icon: '🌐' },
  { name: 'Web Development', slug: 'webdev', description: 'Website design, web apps, retainer contracts', color: '#A78BFA', icon: '💻' },
  { name: 'PlayStation Arena', slug: 'playstation', description: 'Gaming sessions, tournaments, console management', color: '#FFD700', icon: '🎮' },
  { name: 'Hardware Repair', slug: 'repair', description: 'Device repairs, job cards, parts inventory', color: '#FFB020', icon: '🔧' },
  { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security audits, contracts, incident management', color: '#FF3B3B', icon: '🛡️' },
  { name: 'Gov Admin Assistance', slug: 'govadmin', description: 'e-Citizen, KRA, NTSA, document processing', color: '#60A5FA', icon: '🏛️' },
];

exports.getDepartments = async (req, res, next) => {
  try {
    const depts = await Department.find({ isActive: true }).sort('name');
    res.json(depts);
  } catch (err) { next(err); }
};

exports.getDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findOne({ slug: req.params.slug });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) { next(err); }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true },
    );
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) { next(err); }
};

exports.setMonthlyTarget = async (req, res, next) => {
  try {
    const { month, target } = req.body; // month: 'YYYY-MM'
    const dept = await Department.findOne({ slug: req.params.slug });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    const existing = dept.monthlyTargets.find((t) => t.month === month);
    if (existing) existing.target = target;
    else dept.monthlyTargets.push({ month, target });
    await dept.save();
    res.json(dept);
  } catch (err) { next(err); }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, slug, description, color, icon, contactEmail, contactPhone, operatingHours } = req.body;
    if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });

    const existing = await Department.findOne({ slug: slug.toLowerCase() });
    if (existing) return res.status(409).json({ message: `Department '${slug}' already exists` });

    const dept = await Department.create({
      name,
      slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
      description: description || '',
      color: color || '#2BB6A3',
      icon: icon || '◈',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      operatingHours: operatingHours || '',
    });

    res.status(201).json(dept);
  } catch (err) { next(err); }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findOneAndDelete({ slug: req.params.slug });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: `Department '${dept.name}' deleted`, dept });
  } catch (err) { next(err); }
};

exports.getAllDepartments = async (req, res, next) => {
  try {
    const depts = await Department.find().sort('name');
    res.json(depts);
  } catch (err) { next(err); }
};

exports.toggleDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findOne({ slug: req.params.slug });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    dept.isActive = !dept.isActive;
    await dept.save();
    res.json(dept);
  } catch (err) { next(err); }
};

exports.seedDepartments = async (req, res, next) => {
  try {
    for (const d of DEPT_SEED) {
      await Department.findOneAndUpdate({ slug: d.slug }, d, { upsert: true, new: true });
    }
    const depts = await Department.find();
    res.status(201).json({ message: `${depts.length} departments seeded`, depts });
  } catch (err) { next(err); }
};
