const express = require('express');
const router = express.Router();
const { addLecture, getTimetable, updateLecture, deleteLecture, getFacultySchedule } = require('../controllers/timetableController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/faculty/today', protect, authorizeRoles('Faculty'), getFacultySchedule);
router.post('/add', protect, authorizeRoles('Admin'), addLecture);
router.get('/', protect, getTimetable); // Changed from /:semester to / to support query params properly
router.put('/:id', protect, authorizeRoles('Admin'), updateLecture);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteLecture);
router.post('/copy', protect, authorizeRoles('Admin'), require('../controllers/timetableController').copyTimetable);
router.post('/bulk-add', protect, authorizeRoles('Admin'), require('../controllers/timetableController').bulkAddLectures);

module.exports = router;
