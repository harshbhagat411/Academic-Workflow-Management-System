const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create dummy students for test
const sems = [1, 3, 4, 7];

async function run() {
    for (const sem of sems) {
        console.log(`\n--- Testing Semester ${sem} ---`);
        const token = jwt.sign({ id: 'dummy_user_id', role: 'Student' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // We need the backend to accept 'dummy_user_id'. Since ruleEngine fetches User from DB, 
        // we need a real DB user.
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('./models/User');
        
        // Create or find a dummy student and set semester
        let student = await User.findOne({ loginId: 'test_student_req' });
        if(!student) {
            student = new User({
                userId: 'TEST-REQ-1234',
                loginId: 'test_student_req',
                password: 'abc',
                name: 'Test Student',
                role: 'Student',
                email: 'test_student_req@test.com',
                phone: '1234567890',
                gender: 'Other',
                department: 'CS',
                semester: sem,
                status: 'Active'
            });
            await student.save();
        } else {
            student.semester = sem.toString();
            await student.save();
        }

        const realToken = jwt.sign({ id: student._id, role: 'Student' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const config = { headers: { Authorization: `Bearer ${realToken}` } };
        
        const requestsToTest = [
            'Attendance Correction Request', // Sem 1
            'Subject Change Request', // Sem 3
            'Internship Approval', // Sem 4
            'Project Topic Approval' // Sem 4
        ];

        for (const req of requestsToTest) {
            try {
                const res = await axios.post('http://localhost:5000/api/requests/create', {
                    requestType: req,
                    description: `Test for ${req}`
                }, config);
                console.log(`[${req}] Allowed (201)`);
            } catch (err) {
                console.log(`[${req}] Rejected (${err.response?.status}): ${err.response?.data?.message}`);
            }
        }
        
        await mongoose.disconnect();
    }
}

run();
