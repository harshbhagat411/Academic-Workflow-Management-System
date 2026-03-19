const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const User = require('./models/User'); // Need User to find a faculty
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // 1. Find a valid Faculty ID to assign if missing
        const faculty = await User.findOne({ role: 'Faculty' });
        const facultyId = faculty ? faculty._id : null;
        console.log('Using default Faculty ID:', facultyId);

        const subjects = await Subject.find({});
        console.log(`Found ${subjects.length} subjects.`);

        for (const sub of subjects) {
            console.log(JSON.stringify(sub, null, 2));
            // ... checks ...
            if (!sub.department) updates.department = 'Computer Science';
            if (!sub.facultyId && facultyId) updates.facultyId = facultyId;

            if (Object.keys(updates).length > 0) {
                console.log(`Updating Subject ${sub.name} with:`, updates);
                await Subject.updateOne({ _id: sub._id }, { $set: updates });
            } else {
                console.log(`Subject ${sub.name} is valid.`);
            }
        }

        console.log('Migration complete.');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
