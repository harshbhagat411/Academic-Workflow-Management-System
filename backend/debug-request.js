const mongoose = require('mongoose');
require('dotenv').config();
const Request = require('./models/Request');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const latestReq = await Request.findOne().sort({ createdAt: -1 });
    console.log("Latest Request:");
    console.log(latestReq);
    if (latestReq && latestReq.facultyId) {
        const faculty = await User.findById(latestReq.facultyId);
        console.log("Assigned Faculty Name:", faculty ? faculty.name : "Not Found");
        console.log("Assigned Faculty Role:", faculty ? faculty.role : "N/A");
        console.log("Assigned Faculty ID:", faculty ? faculty._id : "N/A");
    } else {
        console.log("NO facultyId attached to this request!");
    }
    
    // Also log all faculty
    const faculties = await User.find({ role: 'Faculty' });
    const result = {
        latestReq,
        faculties: faculties.map(f => ({ id: f._id, department: f.department }))
    };
    require('fs').writeFileSync('result.json', JSON.stringify(result, null, 2));

    process.exit(0);
});
