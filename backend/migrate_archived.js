const mongoose = require('mongoose');
const Request = require('./models/Request'); // Adjusted path: ./models/Request since script is in backend root
const dotenv = require('dotenv');

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Archive all 'Approved' and 'Rejected' requests
        const resArchive = await Request.updateMany(
            { status: { $in: ['Approved', 'Rejected'] } },
            { $set: { isArchived: true, archivedAt: new Date() } }
        );
        console.log(`Archived ${resArchive.modifiedCount} completed requests.`);

        // 2. Ensure 'Submitted' and 'Faculty Approved' are Active (isArchived: false)
        const resActive = await Request.updateMany(
            { status: { $in: ['Submitted', 'Faculty Approved'] } },
            { $set: { isArchived: false } }
        );
        console.log(`Set ${resActive.modifiedCount} pending requests to Active.`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();
