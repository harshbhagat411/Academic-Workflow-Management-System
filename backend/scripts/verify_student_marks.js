const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const StudentMark = require('../models/StudentMark');

const verifyMarks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const students = await User.find({ role: 'Student' });
        const totalStudents = students.length;
        console.log(`Total Students: ${totalStudents}`);

        let studentsWithMarks = 0;
        let studentsWithoutMarks = 0;

        for (const student of students) {
            const markCount = await StudentMark.countDocuments({ studentId: student._id });
            if (markCount > 0) {
                studentsWithMarks++;
            } else {
                studentsWithoutMarks++;
            }
        }

        console.log(`Students with at least one mark: ${studentsWithMarks}`);
        console.log(`Students with ZERO marks: ${studentsWithoutMarks}`);

        if (studentsWithoutMarks === 0) {
            console.log("\n✅ SUCCESS: All students have marks.");
        } else {
            console.log("\n⚠️ WARNING: Some students were missed.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyMarks();
