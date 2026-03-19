const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    sectionName: { type: String, required: true }, // A, B, C...
    semester: { type: Number, required: true },
    department: { type: String, required: true },
    maxCapacity: { type: Number, default: 70 }, // Default 70 as per requirement
    currentStrength: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

// Ensure unique section name per semester and department
sectionSchema.index({ semester: 1, department: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
