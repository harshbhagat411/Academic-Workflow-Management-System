const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../utils/emailService');

exports.login = async (req, res) => {
    try {
        const { loginId, password } = req.body;
        const user = await User.findOne({ loginId });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // Phase 11: Check Account Status
        if (user.status === 'Deactivated') {
            return res.status(403).json({ message: 'Your account has been deactivated by the department. Please contact the administration.' });
        }

        // Generate Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Security Check: First Time Login
        if (user.isFirstLogin) {
            return res.json({
                token,
                role: user.role,
                forcePasswordChange: true,
                message: 'First time login. Please set your password.'
            });
        }

        res.json({ token, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 1. First Time Password Setup
exports.firstTimePasswordSetup = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.isFirstLogin) {
            return res.status(400).json({ message: 'User has already set their password.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.isFirstLogin = false;
        await user.save();

        res.json({ message: 'Password updated successfully. Access granted.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2. Request OTP for Password Change
exports.requestPasswordChange = async (req, res) => {
    try {
        const { oldPassword } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Verify Old Password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect old password' });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP (hashed ideally, but for now plain for simplicity/speed via email)
        // Let's hash it for security.
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        user.passwordResetOtp = hashedOtp;
        user.passwordResetOtpExpiry = Date.now() + 5 * 60 * 1000; // 5 mins
        await user.save();

        // Send Email
        const emailSubject = 'Password Change Verification Code';
        const emailBody = `Your OTP for password change is: <b>${otp}</b>. It expires in 5 minutes.`;

        // Use existing email service but we need to update it or duplicate logic if it's strictly credential-based
        // Let's import nodemailer transport directly or update emailService to be generic. 
        // For speed, let's use the one we have or a small inline sender if the existing one is rigid.
        // Actually, the existing service `sendCredentialEmail` is specific. 
        // Let's make a generic one right here or modifying the utility is better practice.
        // I will use `sendCredentialEmail` logic pattern here directly for now or update utility later.
        // Let's reuse the transporter setup logic if possible or just import nodemailer.

        // REUSING LOGIC INLINE FOR NOW (To avoid breaking generic utility in this step)
        const nodemailer = require('nodemailer');
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Academic System" <no-reply@college.edu>',
                to: user.email,
                subject: emailSubject,
                html: emailBody
            });
            console.log(`OTP sent to ${user.email}`);
        } else {
            console.log(`[MOCK OTP] To: ${user.email} | Code: ${otp}`);
        }

        res.json({ message: 'OTP sent to your registered email' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 3. Confirm Password Change
exports.confirmPasswordChange = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.passwordResetOtp || !user.passwordResetOtpExpiry) {
            return res.status(400).json({ message: 'No OTP requested' });
        }

        if (user.passwordResetOtpExpiry < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        const isOtpMatch = await bcrypt.compare(otp, user.passwordResetOtp);
        if (!isOtpMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.passwordResetOtp = undefined;
        user.passwordResetOtpExpiry = undefined;
        user.isFirstLogin = false; // Just in case
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 4. Forgot Password Request (Public)
exports.forgotPasswordRequest = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with this email.' });

        if (user.status === 'Deactivated') {
            return res.status(403).json({ message: 'Your account is deactivated. Cannot reset password.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        user.passwordResetOtp = hashedOtp;
        user.passwordResetOtpExpiry = Date.now() + 5 * 60 * 1000;
        await user.save();

        await sendPasswordResetEmail(user.email, otp);

        res.json({ message: 'OTP sent to your registered email' });

    } catch (error) {
        console.error('forgotPasswordRequest error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 5. Reset Password (Public)
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.passwordResetOtp || !user.passwordResetOtpExpiry) {
            return res.status(400).json({ message: 'No OTP requested' });
        }

        if (user.passwordResetOtpExpiry < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        const isOtpMatch = await bcrypt.compare(otp, user.passwordResetOtp);
        if (!isOtpMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.passwordResetOtp = undefined;
        user.passwordResetOtpExpiry = undefined;
        user.isFirstLogin = false;
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('resetPassword error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
