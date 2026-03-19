const mongoose = require('mongoose');
require('dotenv').config();
const Timetable = require('./models/Timetable');
const Subject = require('./models/Subject');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const timetables = await Timetable.find({ type: { $exists: false } }).populate('subjectId');
        console.log(`Found ${timetables.length} entries to migrate.`);

        for (const t of timetables) {
            // Default to Subject type or Theory
            const type = t.subjectId?.type || 'Theory';
            t.type = type;
            await t.save();
            console.log(`Updated ${t._id} to ${type}`);
        }

        console.log('Migration Complete');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

migrate();
