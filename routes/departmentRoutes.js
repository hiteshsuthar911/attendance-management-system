const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all departments
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'admin' && req.query.assignedOnly === 'true') {
      query._id = { $in: req.user.departments.map(d => d._id || d) };
    }
    const departments = await Department.find(query).sort({ name: 1 });
    res.json({ success: true, count: departments.length, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch departments.', error: error.message });
  }
});

// Create new department (Superadmin only)
router.post('/', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and code are required.' });
    }

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    const existingCode = await Department.findOne({ code: trimmedCode });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Department code '${trimmedCode}' already exists for "${existingCode.name}". Please enter a different code or edit the existing department below.`
      });
    }

    const existingName = await Department.findOne({ name: new RegExp(`^${trimmedName}$`, 'i') });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: `Department name '${trimmedName}' already exists with code '${existingName.code}'.`
      });
    }

    const department = await Department.create({
      name: trimmedName,
      code: trimmedCode,
      description: description ? description.trim() : ''
    });

    res.status(201).json({ success: true, message: 'Department created successfully.', department });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create department: ' + error.message });
  }
});

// Update department (Superadmin only)
router.put('/:id', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    if (code) {
      const trimmedCode = code.trim().toUpperCase();
      const existingCode = await Department.findOne({ code: trimmedCode, _id: { $ne: req.params.id } });
      if (existingCode) {
        return res.status(400).json({ success: false, message: `Department code '${trimmedCode}' is already taken by another department.` });
      }
      department.code = trimmedCode;
    }

    if (name) department.name = name.trim();
    if (description !== undefined) department.description = description.trim();

    await department.save();
    res.json({ success: true, message: 'Department updated successfully.', department });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update department: ' + error.message });
  }
});

// Delete department (Superadmin only)
router.delete('/:id', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    // Clean up references in User departments array
    await User.updateMany(
      { departments: req.params.id },
      { $pull: { departments: req.params.id } }
    );

    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete department: ' + error.message });
  }
});

module.exports = router;
