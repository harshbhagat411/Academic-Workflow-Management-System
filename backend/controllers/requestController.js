const Request = require('../models/Request');
const RequestAudit = require('../models/RequestAudit');
const User = require('../models/User'); // Required for fetching department
const MentorAllocation = require('../models/MentorAllocation');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');
const { validateRequest } = require('../utils/ruleEngine');
const { sendEmail } = require('../utils/emailService');

// SLA Constants
const FACULTY_SLA_DAYS = 3;
const ADMIN_SLA_DAYS = 2;

exports.createRequest = async (req, res) => {
    try {
        const { requestType, description, startDate, endDate } = req.body;
        const studentId = req.user.id; // From authMiddleware

        // basic validation
        if (!requestType || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Fetch student details for Rule Engine
        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Phase 14: Rule Engine Assessment
        const validation = validateRequest(student, req.body);
        if (!validation.isAllowed) {
            return res.status(400).json({ message: validation.message });
        }

        // Generate a simple unique Request ID (REQ-TIMESTAMP-RANDOM)
        const datePart = Date.now().toString().slice(-6);
        const randomPart = Math.floor(100 + Math.random() * 900);
        const requestId = `REQ-${datePart}-${randomPart}`;

        // SLA: Calculate Faculty Due Date
        const facultyDue = new Date();
        facultyDue.setDate(facultyDue.getDate() + FACULTY_SLA_DAYS);

        // Auto-Append Duration to Description for Leave Applications
        let finalDescription = description;
        if (requestType === 'Leave Application' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            finalDescription = `${description} \n\n[System Note: Leave Duration: ${diffDays} Days (${startDate} to ${endDate})]`;
        }

        // Force department mapping to fix General student data
        const requestDepartment = (student.department === 'General' || !student.department) ? 'Computer Science' : student.department;

        // Resolve Assigned Faculty (Mentor)
        const allocation = await MentorAllocation.findOne({ studentId: student._id });
        let resolvedFacultyId = null;
        if (allocation && allocation.mentorId) {
            resolvedFacultyId = allocation.mentorId;
        }

        const newRequest = new Request({
            requestId,
            requestType,
            description: finalDescription,
            startDate: requestType === 'Leave Application' ? startDate : undefined,
            endDate: requestType === 'Leave Application' ? endDate : undefined,
            studentId,
            department: requestDepartment,
            facultyId: resolvedFacultyId,
            facultyActionDueAt: facultyDue
        });

        await newRequest.save();
        console.log(`[DEBUG] Save Request: assigned to facultyId: ${resolvedFacultyId}`);

        // AUDIT LOG: Submitted
        const auditLog = new RequestAudit({
            auditId: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            requestId: requestId,
            performedBy: studentId,
            role: 'Student',
            action: 'Submitted',
            remarks: 'Request initiated by student'
        });
        await auditLog.save();

        // Notification Logic
        try {
            if (resolvedFacultyId) {
                // Notifying specific mentor
                const faculty = await User.findById(resolvedFacultyId);
                console.log(`[DEBUG] Triggering explicit notification for specific mentor: ${resolvedFacultyId}`);
                if (faculty) {
                    await Notification.create({
                        userId: faculty._id,
                        message: `New mapped request from ${student.name}`,
                        type: 'request'
                    });

                    if (faculty.email) {
                        await sendEmail({
                            to: faculty.email,
                            subject: 'New Academic Request',
                            html: `
                                <h3>Update from Academic System</h3>
                                <p>New mapped request from your mentee ${student.name}</p>
                                <p>Please login to the system for more details.</p>
                            `
                        });
                    }
                }
            } else {
                // Notifying the entire department
                console.log(`[DEBUG] Triggering department-wide notification for department: ${requestDepartment}`);
                const deptFaculties = await User.find({ role: 'Faculty', department: requestDepartment });
                for (const faculty of deptFaculties) {
                    await Notification.create({
                        userId: faculty._id,
                        message: `New department request from ${student.name}`,
                        type: 'request'
                    });

                    if (faculty.email) {
                        await sendEmail({
                            to: faculty.email,
                            subject: 'New Academic Request',
                            html: `
                                <h3>Update from Academic System</h3>
                                <p>New department request from ${student.name}</p>
                                <p>Please login to the system for more details.</p>
                            `
                        });
                    }
                }
            }
        } catch (notifErr) {
            console.error('Notification error:', notifErr);
        }

        res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyRequests = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { archived } = req.query;
        const isArchived = archived === 'true';

        // Student sees their own requests matching the archive status
        const requests = await Request.find({
            studentId,
            isArchived: isArchived
        }).sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const faculty = await User.findById(facultyId);
        const { archived } = req.query;
        const isArchived = archived === 'true';

        let query = {
            $or: [
                { facultyId: facultyId }, // Newly assigned requests
                { facultyId: null, department: faculty.department }, // Unassigned 
                { facultyId: { $exists: false }, department: faculty.department } // Legacy
            ]
        };

        if (!isArchived) {
            // ONLY actionable requests
            query.isArchived = false;
            query.status = 'Submitted';
        } else {
            // 🚫 Faculty should NOT see archive here
            // Archive is handled by getFacultyReviewedRequests
            return res.status(200).json([]);
        }

        const requests = await Request.find(query)
            .populate('studentId', 'name loginId')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching faculty requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const facultyId = req.user.id;

        if (!['Faculty Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        if (!remarks) {
            return res.status(400).json({ message: 'Remarks are mandatory' });
        }

        const request = await Request.findOne({ requestId: id });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // SLA CHECK: Faculty Delay
        const now = new Date();
        if (request.facultyActionDueAt && now > request.facultyActionDueAt) {
            request.isFacultyDelayed = true;
            request.delayReason = 'FACULTY_DELAY';
        }

        request.status = status;
        request.facultyRemarks = remarks;
        request.facultyActionDate = now;

        // SLA: If Approved, set Admin Due Date
        if (status === 'Faculty Approved') {
            const adminDue = new Date();
            adminDue.setDate(adminDue.getDate() + ADMIN_SLA_DAYS);
            request.adminActionDueAt = adminDue;
        } else if (status === 'Rejected') {
            // Auto-Archive if Faculty Rejects
            request.isArchived = true;
            request.archivedAt = now;
        }

        await request.save();

        // AUDIT LOG: Faculty Action
        let auditAction = status;
        if (status === 'Rejected') {
            auditAction = 'Faculty Rejected';
        }

        const auditLog = new RequestAudit({
            auditId: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            requestId: id,
            performedBy: facultyId,
            role: 'Faculty',
            action: auditAction,
            remarks: remarks
        });
        await auditLog.save();

        // Notification Logic
        try {
            const student = await User.findById(request.studentId);
            const actionText = status === 'Faculty Approved' ? 'approved' : 'rejected';
            
            if (student) {
                await Notification.create({
                    userId: student._id,
                    message: `Your request has been ${actionText}`,
                    type: 'request'
                });

                if (student.email) {
                    await sendEmail({
                        to: student.email,
                        subject: `Request ${actionText === 'approved' ? 'Approved' : 'Rejected'}`,
                        html: `
                            <h3>Update from Academic System</h3>
                            <p>Your request has been ${actionText}</p>
                            <p>Please login to the system for more details.</p>
                        `
                    });
                }
            }
        } catch (notifErr) {
            console.error('Notification error:', notifErr);
        }

        res.status(200).json({ message: 'Request updated successfully', request });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAdminRequests = async (req, res) => {
    try {
        const { archived } = req.query;
        const isArchived = archived === 'true';

        console.log(`Fetching requests for Admin. Archived: ${isArchived}`);

        let query = {};
        if (isArchived) {
            query.isArchived = true;
        } else {
            query.isArchived = false;
            // Active for Admin = Faculty Approved (Pending Admin Action)
            query.status = 'Faculty Approved';
        }

        const requests = await Request.find(query)
            .populate('studentId', 'name loginId department')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching admin requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateAdminRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const adminId = req.user.id;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        if (!remarks) {
            return res.status(400).json({ message: 'Admin remarks are mandatory' });
        }

        const request = await Request.findOne({ requestId: id });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // SLA CHECK: Admin Delay
        const now = new Date();
        if (request.adminActionDueAt && now > request.adminActionDueAt) {
            request.isAdminDelayed = true;
            // If already faculty delayed, maybe keep strict precedence? 
            // Ideally, track both. 
            // user request: "delayReason (Enum: NONE, FACULTY_DELAY, ADMIN_DELAY)" implies single reason priority? 
            // Or maybe just most recent. Let's overwrite or check logic.
            // Actually, if Faculty was delayed, delayReason is FACULTY_DELAY.
            // If Admin is ALSO delayed, do we overwrite? Yes, currently 'Admin Delay' is the active issue?
            // Or if Faculty was delayed, and Admin is delayed, it's a compound delay.
            // For simplicity and prompt compliance (Enum values), I will overwrite to show the latest delay or maintain the first?
            // Prompt says: "delayReason (Enum: NONE, FACULTY_DELAY, ADMIN_DELAY)".
            // Let's overwrite to show "ADMIN_DELAY" if admin caused further delay. 
            // But if Faculty delayed it, that stain remains.
            // Wait, "delayReason" is a single field. 
            // Let's enable multiple flags (isFacultyDelayed, isAdminDelayed) as requested.
            // The Enum might just be for a primary label.
            // Let's set it to ADMIN_DELAY if admin is delayed.
            request.delayReason = 'ADMIN_DELAY';
        }

        request.status = status;
        request.adminRemarks = remarks;
        request.adminActionDate = now;

        // Phase 13: Auto-Archive on Admin Decision
        request.isArchived = true;
        request.archivedAt = now;

        await request.save();

        // AUDIT LOG: Admin Action
        const auditLog = new RequestAudit({
            auditId: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            requestId: id,
            performedBy: adminId,
            role: 'Admin',
            action: status,
            remarks: remarks
        });
        await auditLog.save();

        res.status(200).json({ message: 'Request updated successfully', request });
    } catch (error) {
        console.error('Error updating request by admin:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRequestStats = async (req, res) => {
    try {
        const { range } = req.query;
        let matchStage = {};
        
        if (range && range !== 'all') {
            const dateRange = new Date();
            dateRange.setDate(dateRange.getDate() - parseInt(range));
            matchStage = { createdAt: { $gte: dateRange } };
        }

        const [total, approved, rejected, pending] = await Promise.all([
            Request.countDocuments(matchStage),
            Request.countDocuments({ ...matchStage, status: 'Approved' }),
            Request.countDocuments({ ...matchStage, status: 'Rejected' }),
            Request.countDocuments({ ...matchStage, status: { $nin: ['Approved', 'Rejected'] } })
        ]);

        res.status(200).json({
            total,
            approved,
            rejected,
            pending
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRequestAudit = async (req, res) => {
    try {
        const { id } = req.params; // requestId
        const userId = req.user.id;
        const userRole = req.user.role;

        const request = await Request.findOne({ requestId: id });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Access Control
        if (userRole === 'Student') {
            if (request.studentId.toString() !== userId) {
                return res.status(403).json({ message: 'Unauthorized to view this audit trail' });
            }
        } else if (userRole === 'Faculty') {
            const faculty = await User.findById(userId);
            const isAssigned = request.facultyId && request.facultyId.toString() === userId;
            const isDepartment = !request.facultyId && request.department === faculty.department;
            const hasActed = await RequestAudit.exists({ requestId: id, performedBy: userId });
            
            if (!isAssigned && !isDepartment && !hasActed) {
                return res.status(403).json({ message: 'You can only view timelines for authorized requests.' });
            }
        }

        let audits = await RequestAudit.find({ requestId: id })
            .populate('performedBy', 'name role')
            .sort({ actionDate: 1 }); // Oldest first

        // DYNAMIC GENERATION FALLBACK ensuring there is always a valid timeline array
        if (!audits || audits.length === 0) {
            audits = [
                {
                    action: 'Submitted',
                    role: 'Student',
                    actionDate: request.createdAt,
                    remarks: 'Request initiated by student'
                }
            ];

            if (request.facultyActionDate) {
                let actionLabel = 'Faculty Approved';
                if (request.status === 'Rejected' && !request.adminActionDate) {
                    actionLabel = 'Faculty Rejected';
                }
                audits.push({
                    action: actionLabel,
                    role: 'Faculty',
                    actionDate: request.facultyActionDate,
                    remarks: request.facultyRemarks || 'Reviewed by Faculty'
                });
            }

            if (request.adminActionDate) {
                audits.push({
                    action: request.status,
                    role: 'Admin',
                    actionDate: request.adminActionDate,
                    remarks: request.adminRemarks || 'Reviewed by Admin'
                });
            }
        }

        res.status(200).json(audits);
    } catch (error) {
        console.error('Error fetching audit trail:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getFacultyReviewedRequests = async (req, res) => {
    try {
        const facultyId = req.user.id;
        console.log('Fetching audit-driven history for Faculty:', facultyId);

        // 1. Fetch relevant Audit Logs (Actions taken by this faculty)
        const audits = await RequestAudit.find({
            performedBy: facultyId,
            role: 'Faculty',
            action: { $in: ['Faculty Approved', 'Faculty Rejected'] }
        }).sort({ actionDate: -1 });

        if (audits.length === 0) {
            return res.status(200).json([]);
        }

        // 2. Extract Request IDs from audits
        const requestIds = [...new Set(audits.map(a => a.requestId))];

        // 3. Fetch the actual Request objects for details (Student, Type, etc.)
        const requests = await Request.find({ requestId: { $in: requestIds } })
            .populate('studentId', 'name loginId');

        // Create a map for quick lookup
        const requestMap = {};
        requests.forEach(r => {
            requestMap[r.requestId] = r;
        });

        // 4. Combine Audit + Request Data
        // We return AUDIT objects, with enriched request details.
        // This ensures the view is strictly based on the AUDIT record.
        const historyData = audits.map(audit => {
            const reqDetails = requestMap[audit.requestId];
            if (!reqDetails) return null; // Should not happen if data integrity is good

            return {
                _id: audit._id,
                auditId: audit.auditId,
                action: audit.action,
                remarks: audit.remarks,
                actionDate: audit.actionDate,
                requestDetails: reqDetails
            };
        }).filter(item => item !== null);

        console.log(`Returned ${historyData.length} history items.`);
        res.status(200).json(historyData);
    } catch (error) {
        console.error('Error fetching faculty history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAdminRequestHistory = async (req, res) => {
    try {
        console.log('Fetching full request history for Admin...');
        // History = ALL requests, regardless of status
        const requests = await Request.find({})
            .populate('studentId', 'name loginId')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching admin history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


