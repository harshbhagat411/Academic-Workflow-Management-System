const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    requestId: { type: String, unique: true, required: true },
    requestType: {
        type: String,
        enum: [
            'Bonafide Certificate', 'Leave Application', 'Internship Approval', 'Project Topic Approval', 
            'Section Change', 'Subject Change', 'Timetable Clash', 'Lab Batch Change',
            'Attendance Correction Request', 'Re-evaluation Request', 'ID Card Replacement',
            'Subject Change Request', 'Project Supervisor Change Request', 'Project Extension Request'
        ],
        required: true
    },
    description: { type: String, required: true },
    startDate: { type: Date }, // Phase 15: Structured Leave
    endDate: { type: Date },   // Phase 15: Structured Leave
    department: { type: String, required: true }, // Phase 8: Department Awareness
    status: {
        type: String,
        enum: ['Submitted', 'Faculty Approved', 'Approved', 'Rejected'],
        default: 'Submitted'
    },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    facultyRemarks: { type: String },
    facultyActionDate: { type: Date },
    adminRemarks: { type: String },
    adminActionDate: { type: Date },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },

    // SLA & Delay Tracking
    facultyActionDueAt: { type: Date },
    adminActionDueAt: { type: Date },
    isFacultyDelayed: { type: Boolean, default: false },
    isAdminDelayed: { type: Boolean, default: false },
    delayReason: {
        type: String,
        enum: ['NONE', 'FACULTY_DELAY', 'ADMIN_DELAY'],
        default: 'NONE'
    }
});

module.exports = mongoose.model('Request', requestSchema);
