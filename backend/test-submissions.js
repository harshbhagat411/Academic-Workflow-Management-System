const mongoose = require('mongoose');
require('dotenv').config();
const Submission = require('./models/Submission');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const submissions = await Submission.find().sort({ createdAt: -1 }).limit(2);
    console.log(submissions.map(s => ({
        id: s._id,
        status: s.status,
        fileUrl: s.fileUrl,
        cloudinaryId: s.cloudinaryId
    })));
    process.exit(0);
}).catch(console.error);
