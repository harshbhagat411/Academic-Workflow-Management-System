const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const Request = require('./models/Request');
        // Get 4 Submitted requests
        const reqs = await Request.find({ status: 'Submitted' }).limit(4);
        
        if(reqs.length >= 2) {
            // Make 2 of them Faculty Approved so they appear in Admin "Pending Approval"
            reqs[0].status = 'Faculty Approved';
            reqs[0].facultyRemarks = 'Looks good.';
            await reqs[0].save();
            
            reqs[1].status = 'Faculty Approved';
            reqs[1].facultyRemarks = 'Approved from faculty side.';
            await reqs[1].save();
            console.log('Updated 2 requests to Faculty Approved for Pending Admin Approval');
        }

        // Make the other 2 Archived (Approved or Rejected by Admin) so they appear in "All Request History"
        if(reqs.length >= 4) {
            reqs[2].status = 'Approved';
            reqs[2].facultyRemarks = 'OK';
            reqs[2].adminRemarks = 'Admin agrees.';
            reqs[2].isArchived = true;
            await reqs[2].save();

            reqs[3].status = 'Rejected';
            reqs[3].facultyRemarks = 'OK';
            reqs[3].adminRemarks = 'Admin disagrees.';
            reqs[3].isArchived = true;
            await reqs[3].save();
            console.log('Updated 2 requests into Archived state for Admin History tab');
        }
        
        const countPending = await Request.countDocuments({ status: 'Faculty Approved', isArchived: false });
        console.log('Total Faculty Approved & Active requests now:', countPending);

    } catch (e) {
        console.error("Script error:", e);
    }

    mongoose.disconnect();
});
