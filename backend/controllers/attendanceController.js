const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const Subject = require('../models/Subject');

// Create a new attendance session
exports.createSession = async (req, res) => {
    try {
        const { subjectId, date, timetableId, section } = req.body;
        const facultyId = req.user.id; // From authMiddleware

        if (!section) return res.status(400).json({ message: 'Section is required' });

        // Check if session already exists for this slot on this day
        const sessionDate = new Date(date);
        const startOfDay = new Date(sessionDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(sessionDate.setHours(23, 59, 59, 999));

        let query = { 
            subjectId, 
            section, 
            date: { $gte: startOfDay, $lte: endOfDay } 
        }; 
        
        if (timetableId) {
            query = { 
                timetableId, 
                date: { $gte: startOfDay, $lte: endOfDay } 
            };
        }

        const existingSession = await AttendanceSession.findOne(query);
        if (existingSession) {
            return res.status(400).json({ message: 'Session already exists for this slot.' });
        }

        const session = new AttendanceSession({
            subjectId,
            facultyId,
            date: new Date(), // Use current server time instead of raw client date
            timetableId,
            section
        });

        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get students for a specific subject (based on department and semester)
exports.getSessionStudents = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const query = {
            role: 'Student',
            department: subject.department,
            semester: subject.semester
        };

        const { section } = req.query;
        if (section) {
            query.section = section;
        }

        const students = await User.find(query).select('name loginId section');

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
    try {
        const { sessionId, records } = req.body; // records: [{ studentId, status }]

        // Validate session
        const session = await AttendanceSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Process records
        const operations = records.map(record => ({
            updateOne: {
                filter: { sessionId, studentId: record.studentId },
                update: { status: record.status },
                upsert: true
            }
        }));

        await AttendanceRecord.bulkWrite(operations);
        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get attendance summary for a student (Logged in student)
exports.getStudentAttendanceSummary = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Find all subjects appropriate for the student
        const student = await User.findById(studentId);
        const subjects = await Subject.find({
            department: student.department,
            semester: student.semester
        });

        const summary = [];

        for (const subject of subjects) {
            // Get all sessions for this subject AND this student's section
            // A student only attends classes for their section
            const query = { subjectId: subject._id };
            if (student.section) {
                query.section = student.section;
            }

            const sessions = await AttendanceSession.find(query);
            const sessionIds = sessions.map(s => s._id);

            if (sessionIds.length === 0) {
                summary.push({
                    subjectId: subject._id,
                    subjectName: subject.name,
                    subjectCode: subject.code,
                    totalLectures: 0,
                    attendedLectures: 0,
                    percentage: 0
                });
                continue;
            }

            // Get count of records where status is Present
            const attendedCount = await AttendanceRecord.countDocuments({
                sessionId: { $in: sessionIds },
                studentId,
                status: 'Present'
            });

            const totalLectures = sessions.length;
            const percentage = totalLectures > 0 ? (attendedCount / totalLectures) * 100 : 0;

            summary.push({
                subjectId: subject._id,
                subjectName: subject.name,
                subjectCode: subject.code,
                totalLectures,
                attendedLectures: attendedCount,
                percentage: parseFloat(percentage.toFixed(2))
            });
        }

        res.json(summary);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get all sessions for a subject
exports.getSubjectSessions = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const sessions = await AttendanceSession.find({ subjectId }).sort({ date: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get session details with records
exports.getSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await AttendanceSession.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        const records = await AttendanceRecord.find({ sessionId });
        res.json({ session, records });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get detailed attendance for a specific subject
exports.getStudentSubjectAttendance = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { subjectId } = req.params;

        // Get all sessions
        const sessions = await AttendanceSession.find({ subjectId }).sort({ date: 1 });
        const sessionIds = sessions.map(s => s._id);

        // Get records for this student
        const records = await AttendanceRecord.find({
            sessionId: { $in: sessionIds },
            studentId
        });

        // Map sessions to include status
        const details = sessions.map(session => {
            const record = records.find(r => r.sessionId.toString() === session._id.toString());
            return {
                date: session.date,
                status: record ? record.status : 'Absent'
            };
        });

        res.json(details);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
