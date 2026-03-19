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

        const student = await User.findOne({ role: 'Student', department: 'Computer Science' }).lean();
        if (!student) {
            console.log('No student found');
            process.exit(0);
        }

        console.log(`Student: ${student.name} (${student._id})`);

        const marks = await StudentMark.find({ studentId: student._id }).lean();
        console.log(`Marks Found: ${marks.length}`);
        if (marks.length > 0) {
            console.log('Sample Mark:', marks[0]);
        }

        const records = await AttendanceRecord.find({ studentId: student._id }).limit(5).lean();
        console.log(`Records Found Sample: ${records.length}`);
        if (records.length > 0) {
            console.log('Sample Record:', records[0]);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error in checkStudent:', err);
        process.exit(1);
    }
};

checkStudent();
