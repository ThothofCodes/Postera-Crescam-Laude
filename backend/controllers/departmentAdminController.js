// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const DepartmentAdmin = require('../models/DepartmentAdmin');
const Department = require('../models/Department');
const User = require('../models/User');

// Get all department admin allocations
exports.getAllocations = async (req, res, next) => {
  try {
    const { departmentSlug } = req.query;
    const filter = {};
    
    if (departmentSlug) {
      filter.departmentSlug = departmentSlug;
    }
    
    const allocations = await DepartmentAdmin.find(filter)
      .populate('department', 'name slug')
      .populate('allocatedBy', 'name email')
      .sort('-createdAt');
    
    res.json(allocations);
  } catch (err) { next(err); }
};

// Allocate admin to department
exports.allocateAdmin = async (req, res, next) => {
  try {
    const { departmentSlug, adminEmail, adminName, role, permissions, notes } = req.body;
    
    // Validate department exists
    const department = await Department.findOne({ slug: departmentSlug });
    if (!department) {
      return res.status(400).json({ message: `Department '${departmentSlug}' not found` });
    }
    
    // Check if admin is already allocated to this department
    const existing = await DepartmentAdmin.findOne({
      department: department._id,
      adminEmail: adminEmail.toLowerCase(),
    });
    
    if (existing) {
      return res.status(400).json({ message: `Admin ${adminEmail} is already allocated to ${department.name}` });
    }
    
    // Create allocation
    const allocation = await DepartmentAdmin.create({
      department: department._id,
      departmentSlug,
      adminEmail: adminEmail.toLowerCase(),
      adminName,
      allocatedBy: req.user._id,
      role: role || 'STAFF',
      permissions: permissions || {},
      notes,
    });
    
    // Also create/update user account if doesn't exist
    let user = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!user) {
      // Create user with temporary password
      const tempPassword = `Temp${Date.now()}!`;
      user = await User.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: tempPassword,
        role: role || 'STAFF',
        department: department._id,
        departmentSlug,
        mustChangePassword: true,
        temporaryPassword: tempPassword,
      });
    } else {
      // Update existing user's department
      user.department = department._id;
      user.departmentSlug = departmentSlug;
      if (role) user.role = role;
      await user.save();
    }
    
    res.status(201).json({
      allocation,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
      },
      tempPassword: user.mustChangePassword ? user.temporaryPassword : null,
    });
  } catch (err) { next(err); }
};

// Update allocation
exports.updateAllocation = async (req, res, next) => {
  try {
    const allocation = await DepartmentAdmin.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    const { role, permissions, isActive, notes } = req.body;
    
    if (role !== undefined) allocation.role = role;
    if (permissions !== undefined) allocation.permissions = permissions;
    if (isActive !== undefined) allocation.isActive = isActive;
    if (notes !== undefined) allocation.notes = notes;
    
    await allocation.save();
    
    // Update corresponding user if exists
    const user = await User.findOne({ email: allocation.adminEmail });
    if (user) {
      if (role) user.role = role;
      await user.save();
    }
    
    res.json(allocation);
  } catch (err) { next(err); }
};

// Remove allocation
exports.removeAllocation = async (req, res, next) => {
  try {
    const allocation = await DepartmentAdmin.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    // Soft delete - mark as inactive
    allocation.isActive = false;
    await allocation.save();
    
    // Optionally remove user from department
    const user = await User.findOne({ email: allocation.adminEmail });
    if (user && user.departmentSlug === allocation.departmentSlug) {
      user.department = null;
      user.departmentSlug = null;
      await user.save();
    }
    
    res.json({ message: 'Allocation removed' });
  } catch (err) { next(err); }
};

// Get admins for a specific department
exports.getDepartmentAdmins = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const admins = await DepartmentAdmin.find({
      departmentSlug: slug,
      isActive: true,
    })
      .populate('allocatedBy', 'name email')
      .sort('-allocatedAt');
    
    res.json(admins);
  } catch (err) { next(err); }
};

// Get all allocated admins (for super admin dashboard)
exports.getAllAllocatedAdmins = async (req, res, next) => {
  try {
    const admins = await DepartmentAdmin.find({ isActive: true })
      .populate('department', 'name slug')
      .populate('allocatedBy', 'name email')
      .sort('departmentSlug adminName');
    
    res.json(admins);
  } catch (err) { next(err); }
};
