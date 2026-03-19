const express = require('express');
const router = express.Router();
const {
    assignMentor,
    getStudentMentor,
    getFacultyMentoredStudents,
    getAdminMentorAllocations
} = require('../controllers/mentorController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Admin Routes
router.post('/assign', protect, authorizeRoles('Admin'), assignMentor);
router.get('/admin', protect, authorizeRoles('Admin'), getAdminMentorAllocations);

// Student Routes
router.get('/student', protect, authorizeRoles('Student'), getStudentMentor);

// Faculty Routes
router.get('/faculty', protect, authorizeRoles('Faculty'), getFacultyMentoredStudents);

module.exports = router;
