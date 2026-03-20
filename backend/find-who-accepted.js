const mongoose = require('mongoose');
require('dotenv').config();
const Request = require('./models/Request');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const recentAction = await Request.findOne({ status: 'Faculty Approved' }).sort({ facultyActionDate: -1, updatedAt: -1 });
        
        if (recentAction) {
            console.log("Recent request action by: ", recentAction.facultyRemarks, "or maybe there is no track of who did it if facultyId was null.");
            // Wait, does updateRequestStatus log who did it?
            // requestController.js: updateRequestStatus -> sets 'facultyRemarks', 'status', 'facultyActionDate'. But it doesn't set 'actionBy' faculty!
        }

        // Just list the faculties so I know all Logins
        const faculties = await User.find({ role: 'Faculty' });
        console.log("FACULTY LIST:");
        faculties.forEach(f => console.log(`${f.loginId} - ${f.name}`));

    } catch(err) {
        console.error(err);
    }
    process.exit(0);
});
