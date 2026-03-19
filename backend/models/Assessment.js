const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['Test', 'Quiz', 'Assignment', 'Mid-Term', 'Final', 'Project', 'Internal Test 1', 'Internal Test 2', 'Mid Semester', 'End Semester'],
        required: true
    },
    title: { type: String, required: true }, // e.g., "Unit Test 1", "Assignment 2"
    maxMarks: { type: Number, required: true, min: 1 },
    semester: { type: Number, required: true }, // Derived from Subject for easier querying
    assessmentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentType' },
    examDate: { type: Date },
    section: { type: String }, // Optional
    status: { type: String, enum: ['Active', 'Locked'], default: 'Active' }
}, { timestamps: true });

// Prevent duplicate assessments with same title for same subject (optional but good practice)
assessmentSchema.index({ subjectId: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
