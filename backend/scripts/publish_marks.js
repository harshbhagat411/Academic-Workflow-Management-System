const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Assessment = require('../models/Assessment');

const publishMarks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Update all assessments to 'Locked' status
        const result = await Assessment.updateMany(
            {},
            { $set: { status: 'Locked' } }
        );

        console.log(`Updated ${result.modifiedCount} assessments to 'Locked' status.`);
        console.log('Marks should now be visible to students.');

        process.exit(0);
    } catch (err) {
        console.error('Error publishing marks:', err);
        process.exit(1);
    }
};

publishMarks();
