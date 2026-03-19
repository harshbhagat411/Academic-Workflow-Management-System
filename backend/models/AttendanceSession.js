const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    section: { type: String, required: true }, // Added section
    topic: { type: String }, // Optional: to track what was taught
    timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' } // Linked to specific timetable slot
}, { timestamps: true });

// Prevent duplicate sessions for the same subject on the same date
// Prevent duplicate sessions for the same subject, section, and date
attendanceSessionSchema.index({ subjectId: 1, date: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
