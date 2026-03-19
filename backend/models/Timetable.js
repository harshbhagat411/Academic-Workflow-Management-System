const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    semester: {
        type: Number,
        required: true
    },
    section: {
        type: String, // A, B, C...
        required: true
    },
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    startTime: {
        type: String, // Format HH:mm
        required: true
    },
    endTime: {
        type: String, // Format HH:mm
        required: true
    },
    type: {
        type: String, // 'Lecture' (Theory), 'Lab', 'Project'
        required: true,
        enum: ['Lecture', 'Lab', 'Project', 'Theory'], // Added Lecture, kept Theory for backward compat
        default: 'Lecture'
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Timetable', timetableSchema);
