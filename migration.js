const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Request = require('./backend/models/Request');
require('dotenv').config({ path: './backend/.env' });

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Migrate Users
        const userUpdate = await User.updateMany(
            { department: { $exists: false } },
            { $set: { department: 'Computer Science' } }
        );
        console.log(`Updated ${userUpdate.modifiedCount} Users with default department.`);

        // Migrate Requests
        const reqUpdate = await Request.updateMany(
            { department: { $exists: false } },
            { $set: { department: 'Computer Science' } }
        );
        console.log(`Updated ${reqUpdate.modifiedCount} Requests with default department.`);

        process.exit();
    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
};

migrate();
