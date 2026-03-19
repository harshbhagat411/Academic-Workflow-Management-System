const express = require('express');
const router = express.Router();
const {
    createAssessment,
    getFacultyAssessments,
    getAssessmentDetails,
    saveMarks,
    lockAssessment,
    getStudentMarks
} = require('../controllers/assessmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Faculty Routes
router.post('/create', protect, authorizeRoles('Faculty'), createAssessment);
router.get('/faculty/list', protect, authorizeRoles('Faculty'), getFacultyAssessments);
router.get('/:assessmentId', protect, authorizeRoles('Faculty'), getAssessmentDetails);
router.post('/:assessmentId/marks', protect, authorizeRoles('Faculty'), saveMarks);
router.put('/:assessmentId/lock', protect, authorizeRoles('Faculty'), lockAssessment);

// Student Routes
router.get('/student/my-marks', protect, authorizeRoles('Student'), getStudentMarks);

module.exports = router;
