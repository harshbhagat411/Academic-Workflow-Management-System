const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const AttendanceSession = require('../models/AttendanceSession');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');

const checkSchema = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Check Indexes
        const indexes = await AttendanceSession.collection.getIndexes();
        console.log('\nIndexes on AttendanceSession:', JSON.stringify(indexes, null, 2));

        // 2. Check Timetable Conflicts
        // Find a day where same subject is taught in multiple sections
        const timetable = await Timetable.find();
        const conflictMap = {}; // date_subject -> [sections]

        // Simulating "Today" just to check timetable overlap
        const overlaps = [];

        // Group by day + subject
        const grouped = {}; // "Monday-SubjectID" -> Set(sections)

        timetable.forEach(t => {
            const key = `${t.day}-${t.subjectId}`;
            if (!grouped[key]) grouped[key] = new Set();
            grouped[key].add(t.section);
        });

        Object.entries(grouped).forEach(([key, sections]) => {
            if (sections.size > 1) {
                overlaps.push({ key, sections: Array.from(sections) });
            }
        });

        console.log(`\nPotential Conflicts (Same Subject, Same Day, Diff Section): ${overlaps.length}`);
        if (overlaps.length > 0) {
            console.log('Example:', overlaps[0]);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkSchema();
