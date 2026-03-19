const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const students = await User.find({ role: 'Student' });
        console.log(`Found ${students.length} students.`);

        students.forEach(s => {
            console.log(`Student: ${s.name} | Semester: ${s.semester} | Type: ${typeof s.semester}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
