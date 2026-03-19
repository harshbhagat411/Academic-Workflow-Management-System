const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Assessment = require('../models/Assessment');

const updateStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const result = await Assessment.updateMany(
            {},
            { $set: { status: 'Locked' } }
        );

        console.log(`Updated ${result.modifiedCount} assessments to 'Locked' status.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateStatus();
