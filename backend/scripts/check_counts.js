const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Subject = require('../models/Subject');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const students = await User.find({ role: 'Student' });
        console.log(`Total Students: ${students.length}`);

        const csStudents = await User.find({ role: 'Student', department: 'Computer Science' });
        console.log(`CS Students: ${csStudents.length}`);

        if (csStudents.length > 0) {
            console.log('Sample CS Student Semester:', csStudents[0].semester);
        }

        const subjects = await Subject.find({});
        console.log(`Total Subjects: ${subjects.length}`);

        if (subjects.length > 0) {
            console.log('Sample Subject:', subjects[0]);
        }

        const csSubjects = await Subject.find({ department: 'Computer Science' });
        console.log(`CS Subjects: ${csSubjects.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
