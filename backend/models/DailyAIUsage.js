const mongoose = require('mongoose');

const dailyAIUsageSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    count: { type: Number, default: 0 }
});

// Ensure one record per student per day
dailyAIUsageSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyAIUsage', dailyAIUsageSchema);
