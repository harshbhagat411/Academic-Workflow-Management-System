const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const User = require('./models/User');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. List all Students
        const students = await User.find({ role: 'Student' });
        console.log('\n--- Students ---');
        students.forEach(s => {
            console.log(`Name: ${s.name}, Dept: ${s.department}, Sem: ${s.semester}, ID: ${s._id}`);
        });

        // 2. List all Subjects
        const subjects = await Subject.find({});
        console.log('\n--- Subjects ---');
        subjects.forEach(s => {
            console.log(`Name: ${s.name}, Dept: ${s.department}, Sem: ${s.semester}, Code: ${s.code}`);
        });

        // 3. Simulated Query for a Student (Pick the first one if available)
        if (students.length > 0) {
            const student = students[0];
            const sem = 4; // As per screenshot
            console.log(`\n--- Simulated Query for Student: ${student.name} (Dept: ${student.department}) for Semester ${sem} ---`);

            const matchedSubjects = await Subject.find({
                department: student.department,
                semester: sem // Pass as number
            });
            console.log('Matched Subjects (Number):', matchedSubjects.length);
            matchedSubjects.forEach(s => console.log(` - ${s.name}`));

            const matchedSubjectsStr = await Subject.find({
                department: student.department,
                semester: String(sem) // Pass as string
            });
            console.log('Matched Subjects (String):', matchedSubjectsStr.length);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
