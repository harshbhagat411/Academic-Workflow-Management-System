const express = require('express');
const router = express.Router();
const { getFacultySubjects, createSubject, getAllSubjects, deleteSubject, getStudentSubjects } = require('../controllers/subjectController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Faculty Routes
router.get('/faculty/subjects', protect, getFacultySubjects);

// Student Routes
router.get('/student/list', protect, authorizeRoles('Student'), getStudentSubjects);

// Admin Routes
router.post('/create', protect, authorizeRoles('Admin'), createSubject);
router.get('/all', protect, authorizeRoles('Admin'), getAllSubjects);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteSubject);

module.exports = router;
