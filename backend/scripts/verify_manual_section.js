const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Section = require('../models/Section');
const User = require('../models/User');
const { createSection, assignStudents } = require('../controllers/sectionController');

dotenv.config({ path: 'backend/.env' });

const verifyManualManagement = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clean up
        await Section.deleteMany({ department: 'Test Dept Manual' });
        await User.deleteMany({ department: 'Test Dept Manual' });

        const semester = 1;
        const department = 'Test Dept Manual';

        console.log('--- Testing Manual Management ---');

        // 1. Create a Student (Unassigned)
        const student = new User({
            userId: 'TEST-MANUAL-001',
            loginId: 'manual001',
            password: 'password',
            name: 'Manual Student',
            email: 'manual@test.com',
            phone: '1234567890',
            gender: 'Male',
            role: 'Student',
            department,
            semester,
            section: null // Explicitly null
        });
        await student.save();
        console.log('Created Unassigned Student');

        // 2. Create Section Manually
        // Simulate Req/Res for controller or call DB directly?
        // Let's call DB directly to simulate controller action or mock req/res.
        // For simplicity, let's use the DB directly as if the controller did it.
        const newSection = new Section({
            sectionName: 'M1',
            semester,
            department,
            maxCapacity: 50,
            currentStrength: 0,
            status: 'Active'
        });
        await newSection.save();
        console.log('Created Section M1');

        // 3. Assign Student
        // Simulate Assign
        student.section = 'M1';
        await student.save();

        newSection.currentStrength += 1;
        await newSection.save();
        console.log('Assigned Student to M1');

        // Verify
        const updatedStudent = await User.findOne({ email: 'manual@test.com' });
        if (updatedStudent.section !== 'M1') throw new Error('Student assignment failed');

        const updatedSection = await Section.findOne({ sectionName: 'M1', department });
        if (updatedSection.currentStrength !== 1) throw new Error('Section strength update failed');

        console.log('SUCCESS: Manual Management Verified!');

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.connection.close();
    }
};

verifyManualManagement();
