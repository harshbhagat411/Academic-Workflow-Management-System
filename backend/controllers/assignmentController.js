const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const { cloudinary } = require('../utils/cloudinary');
const User = require('../models/User');

exports.createAssignment = async (req, res) => {
    try {
        const { title, description, subjectId, semester, dueDate } = req.body;
        const assignment = new Assignment({
            title, description, subjectId, semester, dueDate, createdBy: req.user.id
        });
        await assignment.save();
        res.status(201).json({ message: 'Assignment created successfully', assignment });
    } catch (error) {
        res.status(500).json({ message: 'Error creating assignment', error: error.message });
    }
};

exports.getAssignments = async (req, res) => {
    try {
        if (req.user.role === 'Student') {
            const student = await User.findById(req.user.id);
            const assignments = await Assignment.find({ semester: student.semester }).populate('subjectId', 'name code').sort({ createdAt: -1 });
            
            // Get submission map for quick status lookup
            const submissions = await Submission.find({ studentId: req.user.id });
            const subMap = submissions.reduce((acc, sub) => {
                acc[sub.assignmentId.toString()] = sub;
                return acc;
            }, {});

            const results = assignments.map(a => ({
                ...a.toObject(),
                submission: subMap[a._id.toString()] || null
            }));
            return res.json(results);
        } else if (req.user.role === 'Faculty') {
            const assignments = await Assignment.find({ createdBy: req.user.id }).populate('subjectId', 'name code').sort({ createdAt: -1 });
            return res.json(assignments);
        } else {
             const assignments = await Assignment.find().populate('subjectId', 'name code').populate('createdBy', 'name').sort({ createdAt: -1 });
             return res.json(assignments);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assignments', error: error.message });
    }
};

exports.uploadSubmission = async (req, res) => {
    try {
        const { assignmentId } = req.body;
        const studentId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or invalid file format' });
        }

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        let submission = await Submission.findOne({ assignmentId, studentId });

        // Delete old file from Cloudinary on re-upload to save space
        if (submission && submission.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(submission.cloudinaryId, { resource_type: 'raw' });
            } catch (err) {
                console.error('Cloudinary delete error:', err);
            }
        }

        const isLate = new Date() > new Date(assignment.dueDate);
        const status = isLate ? 'Late' : 'Submitted';

        if (submission) {
            submission.fileUrl = req.file.path;
            submission.cloudinaryId = req.file.filename;
            submission.status = status;
            submission.remarks = ''; // Clear remarks on re-upload
            submission.reviewedAt = undefined;
            submission.reviewedBy = undefined;
            await submission.save();
        } else {
            submission = new Submission({
                assignmentId,
                studentId,
                fileUrl: req.file.path,
                cloudinaryId: req.file.filename,
                status
            });
            await submission.save();
        }

        // Notify Faculty
        await Notification.create({
            userId: assignment.createdBy,
            message: `${req.user.name || 'A student'} has submitted an assignment: "${assignment.title}"`,
            type: 'assignment'
        });

        res.json({ message: 'Submission successful', submission });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Error uploading submission', error: error.message });
    }
};

exports.getSubmissionsForAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const submissions = await Submission.find({ assignmentId }).populate('studentId', 'name loginId');
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions' });
    }
};

exports.reviewSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        if (status === 'Rejected' && (!remarks || remarks.trim() === '')) {
            return res.status(400).json({ message: 'Remarks are mandatory when rejecting a submission.' });
        }

        const submission = await Submission.findById(id).populate('assignmentId');
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.status = status;
        if (remarks !== undefined) submission.remarks = remarks;
        submission.reviewedAt = new Date();
        submission.reviewedBy = req.user.id;

        await submission.save();

        // Notify Student
        const message = status === 'Accepted' 
            ? `Your submission for "${submission.assignmentId.title}" has been accepted.`
            : `Your submission for "${submission.assignmentId.title}" was rejected. Remarks: ${remarks}. Please modify and re-upload.`;

        await Notification.create({
            userId: submission.studentId,
            message,
            type: 'assignment'
        });

        res.json({ message: `Submission ${status.toLowerCase()}`, submission });
    } catch (error) {
        console.error('Review Error:', error);
        res.status(500).json({ message: 'Error reviewing submission', error: error.message });
    }
};
