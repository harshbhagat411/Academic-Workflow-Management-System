const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const StudentMark = require('../models/StudentMark');
const AttendanceRecord = require('../models/AttendanceRecord');

const checkStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find a random student
        const student = await User.findOne({ role: 'Student', department: 'Computer Science' });
        if (!student) {
            console.log('No student found');
            process.exit(0);
        }

        console.log(`Student: ${student.name}`);
        console.log(`ID: ${student._id}`);

        const markCount = await StudentMark.countDocuments({ studentId: student._id });
        console.log(`Marks Count: ${markCount}`);

        const recordCount = await AttendanceRecord.countDocuments({ studentId: student._id });
        console.log(`Attendance Records Count: ${recordCount}`);

        const sampleMark = await StudentMark.findOne({ studentId: student._id }).populate('assessmentId');
        if (sampleMark) {
            console.log('Sample Mark:', JSON.stringify(sampleMark, null, 2));
        }

        const sampleRecord = await AttendanceRecord.findOne({ studentId: student._id }).populate('sessionId');
        if (sampleRecord) {
            console.log('Sample Record:', JSON.stringify(sampleRecord, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStudent();
