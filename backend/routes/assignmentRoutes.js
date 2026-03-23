const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');

// Assignments
router.post('/', protect, authorizeRoles('Faculty', 'Admin'), assignmentController.createAssignment);
router.get('/', protect, assignmentController.getAssignments);

// Submissions
router.post('/submissions', protect, authorizeRoles('Student'), upload.single('file'), assignmentController.uploadSubmission);
router.get('/:assignmentId/submissions', protect, authorizeRoles('Faculty', 'Admin'), assignmentController.getSubmissionsForAssignment);
router.patch('/submissions/:id/review', protect, authorizeRoles('Faculty', 'Admin'), assignmentController.reviewSubmission);

module.exports = router;
