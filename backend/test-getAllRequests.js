const mongoose = require('mongoose');
require('dotenv').config();
const Request = require('./models/Request');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const faculty = await User.findOne({ role: 'Faculty', loginId: 'FC2026S002' });
        const facultyId = faculty._id;

        let query = {
            $or: [
                { facultyId: facultyId }, 
                { facultyId: null, department: faculty.department }, 
                { facultyId: { $exists: false }, department: faculty.department } 
            ]
        };
        query.isArchived = false;
        query.status = 'Submitted';

        const requests = await Request.find(query).populate('studentId', 'name loginId').sort({ createdAt: -1 });
        const result = {
            query,
            count: requests.length,
            facultyInfo: faculty.name,
            requests: requests.map(r => ({ id: r.requestId, facultyId: r.facultyId }))
        };
        require('fs').writeFileSync('test-fetch-output.json', JSON.stringify(result, null, 2));

    } catch(err) {
        require('fs').writeFileSync('test-fetch-output.json', JSON.stringify({ error: err.toString() }));
    }
    process.exit(0);
});
