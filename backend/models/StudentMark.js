const mongoose = require('mongoose');

const studentMarkSchema = new mongoose.Schema({
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    enteredAt: { type: Date, default: Date.now },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }
}, { timestamps: true });

// Ensure one mark entry per student per assessment
studentMarkSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('StudentMark', studentMarkSchema);
