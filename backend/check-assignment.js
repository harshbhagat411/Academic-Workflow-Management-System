const mongoose = require('mongoose');
require('dotenv').config();
const Request = require('./models/Request');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const requests = await Request.find().sort({ createdAt: -1 }).limit(5).populate('facultyId', 'name loginId email').populate('studentId', 'name');
    
    const faculties = await User.find({ role: 'Faculty' }).select('name loginId department email');
    const out = { requests, faculties };
    require('fs').writeFileSync('check-output.json', JSON.stringify(out, null, 2));
    process.exit(0);
});
