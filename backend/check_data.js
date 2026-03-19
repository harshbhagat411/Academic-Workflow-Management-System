const mongoose = require('mongoose');
const Request = require('./models/Request');
const dotenv = require('dotenv');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const archivedRequests = await Request.find({ isArchived: true });
        console.log(`Found ${archivedRequests.length} archived requests.`);

        const missingDate = archivedRequests.filter(r => !r.facultyActionDate);
        console.log(`Requests missing facultyActionDate: ${missingDate.length}`);

        if (missingDate.length > 0) {
            console.log('Sample missing:', missingDate[0]);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
