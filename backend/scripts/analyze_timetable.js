const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Timetable = require('../models/Timetable');

const analyzeTimetable = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('--- Timetable Analysis ---');

        // Count by Semester
        const bySemester = await Timetable.aggregate([
            { $group: { _id: "$semester", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        console.log('\nEntries per Semester:');
        bySemester.forEach(item => console.log(`Sem ${item._id}: ${item.count}`));

        // Count by Type
        const byType = await Timetable.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);
        console.log('\nEntries per Type:');
        byType.forEach(item => console.log(`${item._id}: ${item.count}`));

        // Check Sem 1 specifically for Labs
        const sem1Labs = await Timetable.countDocuments({ semester: 1, type: { $ne: 'Lecture' } });
        console.log(`\nSem 1 Non-Lecture entries: ${sem1Labs}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

analyzeTimetable();
