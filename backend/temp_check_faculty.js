const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkFaculty = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const faculty = await User.find({ role: 'Faculty' });
        console.log('Faculty found:', faculty.length);
        faculty.forEach(f => {
            console.log(`- ${f.name} (${f.loginId}) ID: ${f._id} Dept: ${f.department}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkFaculty();
