const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User'); // Adjust path as needed
const { sendCredentialEmail } = require('../utils/emailService');
const stream = require('stream');

// Helper to generate temporary password
const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8);
};

// Helper: Capitalize first letter (student -> Student)
const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const { generateLoginId } = require('../utils/idGenerator');

const uploadBulkUsers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let failedCount = 0;
    const rows = [];

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv({
            mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/^\uFEFF/, '') // Normalize headers: trim, lowercase, remove BOM
        }))
        .on('data', (data) => rows.push(data))
        .on('end', async () => {
            const currentYear = new Date().getFullYear();

            for (let i = 0; i < rows.length; i++) {
                const rawRow = rows[i];
                const rowNum = i + 2;

                try {
                    // Standardize keys (just in case mapHeaders didn't catch something, but it should)
                    // We expect: name, gender, role, semester, phone, department, email

                    const row = {
                        name: rawRow.name?.trim(),
                        email: rawRow.email?.trim(),
                        role: capitalize(rawRow.role?.trim()), // student -> Student
                        gender: capitalize(rawRow.gender?.trim()), // male -> Male
                        phone: rawRow.phone?.trim(),
                        department: 'Computer Science',
                        semester: rawRow.semester?.trim(),
                        specialization: rawRow.specialization?.trim()
                    };

                    // 1. Precise Validation
                    const missing = [];
                    if (!row.name) missing.push('name');
                    if (!row.email) missing.push('email');
                    if (!row.role) missing.push('role');
                    if (!row.gender) missing.push('gender');
                    if (!row.phone) missing.push('phone');
                    if (!row.department) missing.push('department');

                    if (missing.length > 0) {
                        throw new Error(`Missing required fields: ${missing.join(', ')}`);
                    }

                    if (!['Student', 'Faculty'].includes(row.role)) {
                        throw new Error(`Invalid role: ${row.role}. Must be Student or Faculty`);
                    }

                    if (row.role === 'Student' && !row.semester) {
                        throw new Error('Semester required for Student');
                    }

                    if (row.role === 'Faculty' && !row.specialization) {
                        throw new Error('Specialization required for Faculty');
                    }

                    // 2. Email Uniqueness in DB
                    const existingUser = await User.findOne({ email: row.email });
                    if (existingUser) {
                        throw new Error(`Email ${row.email} already exists`);
                    }

                    // 3. Generate Data
                    const loginId = await generateLoginId(row.role, row.semester, currentYear);

                    // Generate dynamic password based on Login ID
                    let rawPassword;
                    const idSuffix = loginId.slice(-3); // Extract last 3 digits

                    if (row.role === 'Student') {
                        rawPassword = `STU${idSuffix}`;
                    } else if (row.role === 'Faculty') {
                        rawPassword = `FAC${idSuffix}`;
                    } else {
                        // Fallback usually ensuring it's not empty, though validation prevents other roles
                        rawPassword = `PASS${idSuffix}`;
                    }

                    const hashedPassword = await bcrypt.hash(rawPassword, 10);

                    // 4. Create User
                    const newUser = new User({
                        userId: uuidv4(),
                        loginId,
                        password: hashedPassword,
                        name: row.name,
                        email: row.email,
                        phone: row.phone,
                        gender: row.gender,
                        role: row.role,
                        department: row.department,
                        status: 'Active',
                        semester: row.role === 'Student' ? parseInt(row.semester) : undefined,
                        specialization: row.role === 'Faculty' ? row.specialization : undefined,
                        section: undefined // Manual Management: Explicitly unassigned
                    });

                    await newUser.save();

                    // 5. Send Email
                    await sendCredentialEmail(row.email, loginId, rawPassword);

                    successCount++;
                    results.push({ email: row.email, status: 'Created', loginId });

                } catch (err) {
                    failedCount++;
                    errors.push({
                        row: rowNum,
                        email: rawRow.email || 'N/A',
                        reason: err.message
                    });
                }
            }

            res.json({
                total: rows.length,
                success: successCount,
                failed: failedCount,
                errors
            });
        });
};

module.exports = { uploadBulkUsers };
