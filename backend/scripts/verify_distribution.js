const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Timetable = require('../models/Timetable');

const verifyDistribution = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Check for Saturday
        const satCount = await Timetable.countDocuments({ day: 'Saturday' });
        console.log(`Saturday Entries: ${satCount} (Should be 0)`);

        // 2. Check Lab Days per Section
        const labs = await Timetable.find({ type: { $ne: 'Lecture' } });
        const sectionLabs = {}; // { sectionName: Set(days) }

        labs.forEach(l => {
            const key = `Sem${l.semester}-${l.section}`;
            if (!sectionLabs[key]) sectionLabs[key] = new Set();
            sectionLabs[key].add(l.day);
        });

        console.log('\nUnique Lab Days per Section:');
        let totalSections = 0;
        let goodDist = 0;

        for (const [sec, days] of Object.entries(sectionLabs)) {
            totalSections++;
            const dayCount = days.size;
            console.log(`${sec}: ${dayCount} days (${Array.from(days).join(', ')})`);
            if (dayCount >= 3) goodDist++;
        }

        console.log(`\nSections with 3+ Lab Days: ${goodDist} / ${totalSections}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyDistribution();
