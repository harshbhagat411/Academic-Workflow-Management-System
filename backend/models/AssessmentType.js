const mongoose = require('mongoose');

const assessmentTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Internal 1"
    maxMarks: { type: Number, required: true },
    weightage: { type: Number, required: true }, // e.g., 20%
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('AssessmentType', assessmentTypeSchema);
