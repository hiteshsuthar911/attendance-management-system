const express = require('express');
const router = express.Router();
const AcademicProgram = require('../models/AcademicProgram');
const Department = require('../models/Department');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// GET /api/academic-programs - List all degrees and branches with search
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, degree, status } = req.query;
    let query = {};

    if (degree && degree !== 'ALL') {
      query.degree = degree.toUpperCase();
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { degree: searchRegex },
        { branchName: searchRegex },
        { branchCode: searchRegex }
      ];
    }

    const programs = await AcademicProgram.find(query)
      .populate('department', 'name code')
      .sort({ degree: 1, branchName: 1 });

    res.json({
      success: true,
      count: programs.length,
      programs
    });
  } catch (err) {
    console.error('Error fetching academic programs:', err);
    res.status(500).json({ success: false, message: 'Server error fetching degrees and branches.' });
  }
});

// GET /api/academic-programs/degrees - Get distinct degree list
router.get('/degrees', verifyToken, async (req, res) => {
  try {
    const degrees = await AcademicProgram.distinct('degree', { status: 'active' });
    res.json({
      success: true,
      degrees: degrees.sort()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching degree list.' });
  }
});

// POST /api/academic-programs - Create new degree/branch (Superadmin only)
router.post('/', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { degree, branchName, branchCode, departmentId, durationYears, sections, batches, status } = req.body;

    if (!degree || !branchName || !branchCode) {
      return res.status(400).json({
        success: false,
        message: 'Degree, Branch Name, and Branch Code are required.'
      });
    }

    const normDegree = degree.trim().toUpperCase();
    const normBranchCode = branchCode.trim().toUpperCase();

    // Check if degree + branchCode combination already exists
    const existing = await AcademicProgram.findOne({
      degree: normDegree,
      branchCode: normBranchCode
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Branch '${normBranchCode}' under degree '${normDegree}' already exists.`
      });
    }

    const program = await AcademicProgram.create({
      degree: normDegree,
      branchName: branchName.trim(),
      branchCode: normBranchCode,
      department: departmentId || null,
      durationYears: durationYears ? parseInt(durationYears) : 4,
      sections: Array.isArray(sections) ? sections : (sections ? sections.split(',').map(s => s.trim()).filter(Boolean) : ['A', 'B']),
      batches: Array.isArray(batches) ? batches : (batches ? batches.split(',').map(b => b.trim()).filter(Boolean) : ['Batch-1', 'Batch-2', 'Batch-3', 'Batch-4', 'Batch-5']),
      status: status || 'active'
    });

    const populated = await AcademicProgram.findById(program._id).populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'Degree & Branch configured successfully.',
      program: populated
    });
  } catch (err) {
    console.error('Error creating academic program:', err);
    res.status(500).json({ success: false, message: 'Error creating degree and branch record.' });
  }
});

// PUT /api/academic-programs/:id - Update degree/branch (Superadmin only)
router.put('/:id', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { degree, branchName, branchCode, departmentId, durationYears, sections, batches, status } = req.body;

    const program = await AcademicProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Degree/Branch record not found.' });
    }

    if (degree) program.degree = degree.trim().toUpperCase();
    if (branchName) program.branchName = branchName.trim();
    if (branchCode) program.branchCode = branchCode.trim().toUpperCase();
    if (departmentId !== undefined) program.department = departmentId || null;
    if (durationYears !== undefined) program.durationYears = parseInt(durationYears);
    if (sections !== undefined) {
      program.sections = Array.isArray(sections) ? sections : sections.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (batches !== undefined) {
      program.batches = Array.isArray(batches) ? batches : batches.split(',').map(b => b.trim()).filter(Boolean);
    }
    if (status) program.status = status;

    await program.save();

    const updated = await AcademicProgram.findById(program._id).populate('department', 'name code');

    res.json({
      success: true,
      message: 'Degree & Branch updated successfully.',
      program: updated
    });
  } catch (err) {
    console.error('Error updating academic program:', err);
    res.status(500).json({ success: false, message: 'Error updating degree and branch record.' });
  }
});

// DELETE /api/academic-programs/:id - Delete degree/branch (Superadmin only)
router.delete('/:id', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const deleted = await AcademicProgram.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    res.json({
      success: true,
      message: `Branch '${deleted.branchName} (${deleted.branchCode})' under '${deleted.degree}' removed.`
    });
  } catch (err) {
    console.error('Error deleting academic program:', err);
    res.status(500).json({ success: false, message: 'Error deleting degree and branch record.' });
  }
});

module.exports = router;
