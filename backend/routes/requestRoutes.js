const express = require('express');
const router = express.Router();
const {
    createRequest,
    getMyRequests,
    getAllRequests,
    updateRequestStatus,
    getAdminRequests,
    updateAdminRequestStatus,
    getRequestStats,
    getRequestAudit,
    getFacultyReviewedRequests,
    getAdminRequestHistory
} = require('../controllers/requestController');
const {
    getStudentStats,
    getFacultyStats,
    getAdminStats
} = require('../controllers/statsController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Dashboard Stats Routes
router.get('/stats/student', protect, authorizeRoles('Student'), getStudentStats);
router.get('/stats/faculty', protect, authorizeRoles('Faculty'), getFacultyStats);
router.get('/stats/admin', protect, authorizeRoles('Admin'), getAdminStats);

router.post('/create', protect, authorizeRoles('Student'), createRequest);
router.get('/my-requests', protect, authorizeRoles('Student'), getMyRequests);

// Faculty Routes
router.get('/all', protect, authorizeRoles('Faculty'), getAllRequests);
router.get('/history', protect, authorizeRoles('Faculty'), getFacultyReviewedRequests);
router.put('/:id/status', protect, authorizeRoles('Faculty'), updateRequestStatus);

// Admin Routes
router.get('/admin/all', protect, authorizeRoles('Admin'), getAdminRequests);
router.get('/admin/history', protect, authorizeRoles('Admin'), getAdminRequestHistory);
router.put('/admin/:id/status', protect, authorizeRoles('Admin'), updateAdminRequestStatus);
router.get('/admin/stats', protect, authorizeRoles('Admin'), getRequestStats);

// Audit Route (Access control handled in controller)
router.get('/:id/audit', protect, authorizeRoles('Student', 'Faculty', 'Admin'), getRequestAudit);

module.exports = router;
