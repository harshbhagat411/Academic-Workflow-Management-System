const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const mentorAllocationSchema = new mongoose.Schema({
    allocationId: {
        type: String,
        default: uuidv4,
        unique: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Compound unique index to ensure one active mentor per student per semester
mentorAllocationSchema.index({ studentId: 1, semester: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.model('MentorAllocation', mentorAllocationSchema);
