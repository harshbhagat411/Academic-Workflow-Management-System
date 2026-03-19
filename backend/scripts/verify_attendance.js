const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');

const verifyAttendance = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const totalSessions = await AttendanceSession.countDocuments();
        const totalRecords = await AttendanceRecord.countDocuments();

        console.log(`Total Attendance Sessions: ${totalSessions}`);
        console.log(`Total Attendance Records: ${totalRecords}`);

        if (totalSessions > 0) {
            const avgRecordsPerSession = totalRecords / totalSessions;
            console.log(`Avg Records/Session: ${avgRecordsPerSession.toFixed(1)}`);
        }

        // Check for "Low Attendance" students (Realistic Pattern Check)
        // Group by student status
        const distribution = await AttendanceRecord.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        console.log('Overall Status Distribution:', distribution);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyAttendance();
