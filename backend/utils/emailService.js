const nodemailer = require('nodemailer');

const createTransporter = () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

exports.sendCredentialEmail = async (email, loginId, password) => {
    try {
        const transporter = createTransporter();
        if (!transporter) {
            console.log(`[MOCK EMAIL] To: ${email} | Login ID: ${loginId} | Password: ${password}`);
            return;
        }

        const mailOptions = {
            from: '"Academic System" <no-reply@college.edu>',
            to: email,
            subject: 'Your Account Has Been Created',
            html: `
                <h3>Welcome to the Academic Workflow Management System</h3>
                <p>Hello,</p>
                <p>Your account has been successfully created.</p>
                <ul>
                    <li><b>Login ID:</b> ${loginId}</li>
                    <li><b>Password:</b> ${password}</li>
                </ul>
                <p>Please log in and change your password after your first login.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Credential email sent to ${email}`);
    } catch (error) {
        console.error('Error sending credential email:', error);
    }
};

exports.sendPasswordResetEmail = async (email, otp) => {
    try {
        const transporter = createTransporter();
        if (!transporter) {
            console.log(`[MOCK OTP EMAIL] To: ${email} | OTP: ${otp}`);
            return;
        }

        const mailOptions = {
            from: '"Academic System" <no-reply@college.edu>',
            to: email,
            subject: 'Password Reset Verification Code',
            html: `
                <h3>Password Reset OTP</h3>
                <p>Your OTP for resetting your password is: <b>${otp}</b></p>
                <p>This OTP will expire in 5 minutes.</p>
                <p>If you did not request a password reset, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
};

exports.sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = createTransporter();
        if (!transporter) {
            console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
            return;
        }

        const mailOptions = {
            from: '"Academic System" <no-reply@college.edu>',
            to,
            subject,
            html
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
