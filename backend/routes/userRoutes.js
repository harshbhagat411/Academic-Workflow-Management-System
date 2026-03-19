const express = require('express');
const router = express.Router();
const { createUser, getNextId, getAllUsers, updateUserStatus, getFacultyStudents, getStaffList, getStudentList } = require('../controllers/userController');
const { uploadBulkUsers } = require('../controllers/bulkUserController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Only Admin can create users
router.post('/create', protect, authorizeRoles('Admin'), createUser);
router.get('/next-id', protect, authorizeRoles('Admin'), getNextId);
router.post('/bulk-upload', protect, authorizeRoles('Admin'), upload.single('file'), uploadBulkUsers);
router.get('/all', protect, authorizeRoles('Admin'), getAllUsers);
router.get('/staff', protect, authorizeRoles('Admin'), getStaffList); // Phase 16
router.get('/students', protect, authorizeRoles('Admin'), getStudentList); // Phase 16
router.patch('/:id/status', protect, authorizeRoles('Admin'), updateUserStatus);

// Faculty Routes
router.get('/faculty/students', protect, authorizeRoles('Faculty'), getFacultyStudents);

// Profile Routes (Any Role)
const { getMe, updateProfile } = require('../controllers/userController');
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);

module.exports = router;
