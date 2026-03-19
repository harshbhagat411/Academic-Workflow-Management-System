const mongoose = require('mongoose');

const requestAuditSchema = new mongoose.Schema({
    auditId: { type: String, unique: true, required: true },
    requestId: { type: String, required: true, ref: 'Request' }, // Keeping as String to match Request.requestId
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['Student', 'Faculty', 'Admin'], required: true },
    action: {
        type: String,
        enum: ['Submitted', 'Faculty Approved', 'Faculty Rejected', 'Approved', 'Rejected'],
        required: true
    },
    remarks: { type: String },
    actionDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RequestAudit', requestAuditSchema);
