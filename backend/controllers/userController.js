const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendCredentialEmail } = require('../utils/emailService');

exports.createUser = async (req, res) => {
    try {
        const { name, email, phone, gender, role, semester, specialization } = req.body;

        // Backend Validations
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!name || !nameRegex.test(name) || name.length > 100) {
            return res.status(400).json({ message: 'Full name can only contain letters and spaces, and maximum 100 characters.' });
        }

        const phoneRegex = /^\d{10}$/;
        if (!phone || !phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        let department = 'Computer Science';
        const prefix = role === 'Student' ? 'STU' : 'FAC';
        const userId = `${prefix}-${Date.now()}`;

        let loginId = '';
        if (role === 'Student') {
            const count = await User.countDocuments({ role: 'Student' });
            loginId = `ST2026S${String(count + 1).padStart(3, '0')}`;
        } else if (role === 'Faculty') {
            const count = await User.countDocuments({ role: 'Faculty' });
            loginId = `FC2026S${String(count + 1).padStart(3, '0')}`;
        } else {
            loginId = `AD2026S${Math.floor(1000 + Math.random() * 9000)}`;
        }

        const last3 = loginId.slice(-3);
        const generatedPassword = role === 'Student' ? `STU${last3}` : `FAC${last3}`;
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const newUser = new User({
            name, email, phone, gender, role, semester, specialization, department, userId, loginId, password: hashedPassword, section: role === 'Student' ? 'A' : undefined
        });

        await newUser.save();
        await sendCredentialEmail(email, loginId, generatedPassword);
        res.status(201).json({ message: 'User created successfully', user: { loginId } });
    } catch (error) {
        console.error("CREATE USER ERROR:", error);
        res.status(500).json({ message: 'Server error creating user', detail: error.message });
    }
};

exports.getNextId = async (req, res) => {
    try {
        const { role } = req.query;
        let nextId = '';
        if (role === 'Student') {
            const count = await User.countDocuments({ role: 'Student' });
            nextId = `ST2026S${String(count + 1).padStart(3, '0')}`;
        } else if (role === 'Faculty') {
            const count = await User.countDocuments({ role: 'Faculty' });
            nextId = `FC2026S${String(count + 1).padStart(3, '0')}`;
        }
        res.json({ nextId });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await User.findByIdAndUpdate(id, { status });
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getFacultyStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'Student' }).select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getStaffList = async (req, res) => {
    try {
        const staff = await User.find({ role: 'Faculty' }).select('-password');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getStudentList = async (req, res) => {
    try {
        const students = await User.find({ role: 'Student' }).select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
