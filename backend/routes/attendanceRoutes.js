const express = require('express');
const router = express.Router();
const {
    createSession,
    getSessionStudents,
    markAttendance,
    getStudentAttendanceSummary,
    getStudentSubjectAttendance,
    getSubjectSessions,
    getSessionDetails
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

// Faculty Routes
router.post('/session/create', protect, createSession);
router.get('/session/:subjectId/students', protect, getSessionStudents);
router.post('/mark', protect, markAttendance);
router.get('/sessions/subject/:subjectId', protect, getSubjectSessions);
router.get('/session/:sessionId', protect, getSessionDetails);

// Student Routes
router.get('/student/summary', protect, getStudentAttendanceSummary);
router.get('/student/subject/:subjectId', protect, getStudentSubjectAttendance);

module.exports = router;
