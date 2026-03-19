const express = require('express');
const router = express.Router();
const { getSections, updateSection, createSection, assignStudents } = require('../controllers/sectionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Get all sections (filtered by semester)
router.get('/', protect, authorizeRoles('Admin'), getSections);

// Create a new section
router.post('/create', protect, authorizeRoles('Admin'), createSection);

// Update section details (capacity, status)
router.patch('/:id', protect, authorizeRoles('Admin'), updateSection);

// Assign students to a section manually
router.post('/assign', protect, authorizeRoles('Admin'), assignStudents);

module.exports = router;
