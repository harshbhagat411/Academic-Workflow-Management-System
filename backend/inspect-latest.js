const mongoose = require('mongoose');
require('dotenv').config();
const Request = require('./models/Request');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const latestReq = await Request.findOne().sort({ createdAt: -1 });
        
        let out = { request: null };
        if (latestReq) {
            let assignedFaculty = null;
            if (latestReq.facultyId) {
                assignedFaculty = await User.findById(latestReq.facultyId).select('name loginId department');
            }
            
            out.request = {
                id: latestReq._id,
                requestId: latestReq.requestId,
                studentId: latestReq.studentId,
                department: latestReq.department,
                status: latestReq.status,
                isArchived: latestReq.isArchived,
                facultyId: latestReq.facultyId,
                assignedFacultyInfo: assignedFaculty
            };
        }
        require('fs').writeFileSync('inspect-latest.json', JSON.stringify(out, null, 2));

    } catch(err) {
        require('fs').writeFileSync('inspect-latest.json', JSON.stringify({ error: err.toString() }));
    }
    process.exit(0);
});
