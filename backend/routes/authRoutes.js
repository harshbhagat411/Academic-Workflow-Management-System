const express = require('express');
const router = express.Router();
const { login, firstTimePasswordSetup, requestPasswordChange, confirmPasswordChange, forgotPasswordRequest, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/first-time-password', protect, firstTimePasswordSetup);
router.post('/request-password-change', protect, requestPasswordChange);
router.post('/confirm-password-change', protect, confirmPasswordChange);

// Forgot Password Routes (Public)
router.post('/forgot-password-request', forgotPasswordRequest);
router.post('/reset-password', resetPassword);

module.exports = router;
