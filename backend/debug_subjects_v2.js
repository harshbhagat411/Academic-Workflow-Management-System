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

        // 2. Check for Semester 8 subjects for ALL students' departments
        for (const student of students) {
            console.log(`\nChecking for Student: ${student.name} (${student.department})`);
            const subjects = await Subject.find({
                department: student.department,
                semester: 8
            });
            console.log(` - Found ${subjects.length} subjects for Sem 8`);
            if (subjects.length > 0) {
                subjects.forEach(s => console.log(`   * ${s.name} (${s.code})`));
            } else {
                // Check if any subjects exist for this dept at all
                const allSubjects = await Subject.find({ department: student.department });
                console.log(`   (Total subjects for dept: ${allSubjects.length})`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
