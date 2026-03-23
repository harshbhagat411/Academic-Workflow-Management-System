const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, settingsController.getSettings);
router.patch('/', protect, settingsController.updateSettings);

module.exports = router;
