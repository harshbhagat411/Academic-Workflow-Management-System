const Request = require('../models/Request');
const RequestAudit = require('../models/RequestAudit');
const User = require('../models/User');

exports.getStudentStats = async (req, res) => {
    try {
        const studentId = req.user.id; // From authMiddleware

        // Aggregate counts
        const total = await Request.countDocuments({ studentId });
        const submitted = await Request.countDocuments({ studentId, status: 'Submitted' });
        const facultyApproved = await Request.countDocuments({ studentId, status: 'Faculty Approved' });
        const finalApproved = await Request.countDocuments({ studentId, status: 'Approved' });
        const rejected = await Request.countDocuments({ studentId, status: 'Rejected' });

        res.json({
            total,
            submitted,
            facultyApproved,
            finalApproved,
            rejected
        });
    } catch (error) {
        console.error('Error fetching student stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getFacultyStats = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const faculty = await User.findById(facultyId);

        if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

        // Pending: Requests in this faculty's department that are 'Submitted'
        const pending = await Request.countDocuments({
            status: 'Submitted',
            department: faculty.department
        });

        // Reviewed: Audit logs where this faculty performed an action
        // Distinct requests to count how many unique requests they handled? 
        // Or total actions? "Total Requests Handled" usually implies distinct requests.
        const reviewedIds = await RequestAudit.distinct('requestId', {
            performedBy: facultyId,
            role: 'Faculty'
        });
        const reviewed = reviewedIds.length;

        // Delayed: Requests in this dept that are flagged as 'Faculty Delayed'
        // This is a DEPT metric more than individual metric if "isFacultyDelayed" is generic.
        // But prompt says "Requests Reviewed by Me" (Audit) and "Delayed Requests (from Phase-7)".
        // Delayed requests are typically "Current Pending Delayed" vs "Total Historical Delayed"?
        // Usually dashboards show "Current Attention Needed".
        // Let's count current requests that involve faculty delay.
        // Or total historical?
        // Prompt: "Display read-only cards showing: Pending Requests (Submitted), Delayed Requests (from Phase-7)"
        // "Delayed Requests" implies current active ones typically.
        const delayed = await Request.countDocuments({
            isFacultyDelayed: true,
            department: faculty.department
            // status? If counting historical, status can be anything. 
            // If counting "Active Alerts", status should be non-final or specifically causing delay.
            // Phase 7 implementation sets 'isFacultyDelayed' permanently. 
            // So this counts ALL requests ever delayed by faculty in this dept.
            // Prompt says: "Delayed Requests (from Phase-7)".
            // Let's stick to simple count of the flag for the dept.
        });

        const totalHandled = reviewed; // Is this redundant with "Requests Reviewed by Me"?
        // Prompt lists: "Pending Requests", "Delayed Requests", "Requests Reviewed by Me", "Total Requests Handled".
        // Maybe "Requests Reviewed by Me" = Approved/Rejected by me.
        // "Total Requests Handled" = maybe same? Or includes forwarded?
        // Let's make "Requests Reviewed by Me" = Total actions taken.
        // "Total Requests Handled" = Total distinct requests touched.
        // Actually, distinct requestId count is best for "Handled". 
        // Let's just return distinct count for "Reviewed". 
        // And maybe "Total Requests Handled" is Total Requests in Dept? No, that's "Total Requests Submitted".
        // Let's interpret:
        // Pending: Actionable now.
        // Delayed: Problematic now (or ever).
        // Reviewed: My contribution.
        // Total Handled: ... maybe same as Reviewed.

        // Let's map roughly:
        // Pending -> Pending
        // Delayed -> isFacultyDelayed (Dept wide? or just mine? Dept wide seems safer for shared responsibility)
        // Reviewed -> Audit count (My actions)
        // Total Handled -> Distinct Request count (My requests)

        res.json({
            pending,
            delayed,
            reviewed,
            totalHandled: reviewed // Mapping same for now unless distinction clarified.
        });
    } catch (error) {
        console.error('Error fetching faculty stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        // Admin has system-wide visibility
        const total = await Request.countDocuments();

        const pendingFinal = await Request.countDocuments({ status: 'Faculty Approved' });

        // Delayed: Faculty OR Admin delay
        const delayed = await Request.countDocuments({
            $or: [{ isFacultyDelayed: true }, { isAdminDelayed: true }]
        });

        const completed = await Request.countDocuments({
            status: { $in: ['Approved', 'Rejected'] }
        });

        res.json({
            total,
            pendingFinal,
            delayed,
            completed
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
