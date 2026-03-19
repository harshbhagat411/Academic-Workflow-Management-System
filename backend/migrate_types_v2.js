const mongoose = require('mongoose');
require('dotenv').config();
const Timetable = require('./models/Timetable'); // Ensure this path is correct relative to backend folder

const migrate = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Update all documents that don't have a 'type' field
        const result = await Timetable.updateMany(
            { type: { $exists: false } },
            { $set: { type: 'Theory' } } // Default to Theory for now to ensure field exists
        );

        console.log(`Matched ${result.matchedCount} documents.`);
        console.log(`Modified ${result.modifiedCount} documents.`);

        // Now, strictly for Labs (2 hours), update them to 'Lab'
        // We can find them by checking duration
        const lectures = await Timetable.find({});
        let labCount = 0;

        for (const lecture of lectures) {
            const start = parseInt(lecture.startTime.split(':')[0]);
            const end = parseInt(lecture.endTime.split(':')[0]);

            // Simple heuristic: if duration >= 2 hours, assume Lab? 
            // Better: use Subject type if available.
            // But populating might be heavy. Let's just update based on duration for now as a fallback.
            // actually, let's rely on the Subject type if we can.

            // Re-fetch with populate
            const populatedLecture = await Timetable.findById(lecture._id).populate('subjectId');
            if (populatedLecture && populatedLecture.subjectId && populatedLecture.subjectId.type) {
                if (populatedLecture.type !== populatedLecture.subjectId.type) {
                    populatedLecture.type = populatedLecture.subjectId.type;
                    await populatedLecture.save();
                    console.log(`Updated ${lecture._id} to ${populatedLecture.type} based on Subject`);
                }
            }
        }

        console.log('Migration Complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
};

migrate();
