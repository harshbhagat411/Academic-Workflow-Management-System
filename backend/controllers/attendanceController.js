const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const Subject = require('../models/Subject');

// Create a new attendance session
exports.createSession = async (req, res) => {
    try {
        const { subjectId, date, timetableId, section } = req.body;
        const facultyId = req.user.id;

        if (!section) return res.status(400).json({ message: 'Section is required' });

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
            date: new Date(),
            timetableId,
            section
        });

        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get students for a specific subject
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
        const { sessionId, records } = req.body;
        const session = await AttendanceSession.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });

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

// Get attendance summary for a student
exports.getStudentAttendanceSummary = async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await User.findById(studentId);
        const subjects = await Subject.find({
            department: student.department,
            semester: student.semester
        });

        const summary = [];

        for (const subject of subjects) {
            const query = { subjectId: subject._id };
            if (student.section) query.section = student.section;

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
        const sessions = await AttendanceSession.find({ subjectId }).sort({ date: 1 });
        const sessionIds = sessions.map(s => s._id);

        const records = await AttendanceRecord.find({
            sessionId: { $in: sessionIds },
            studentId
        });

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

// Get admin system-wide analytics with filters
exports.getAdminAttendanceAnalytics = async (req, res) => {
    try {
        const { semester, range } = req.query;

        let sessionQuery = {};
        
        if (range && range !== 'all') {
             const dateRange = new Date();
             dateRange.setDate(dateRange.getDate() - parseInt(range));
             sessionQuery.date = { $gte: dateRange };
        }

        if (semester && semester !== 'all') {
             const subjects = await Subject.find({ semester: Number(semester) });
             const subjectIds = subjects.map(s => s._id);
             sessionQuery.subjectId = { $in: subjectIds };
        }

        // Optimized: MongoDB Aggregation Pipeline handles all grouping and counting
        const attendanceStats = await AttendanceSession.aggregate([
            { $match: sessionQuery },
            {
                $lookup: {
                    from: 'attendancerecords', 
                    localField: '_id',
                    foreignField: 'sessionId',
                    as: 'records'
                }
            },
            { $unwind: '$records' },
            {
                $lookup: {
                    from: 'subjects',
                    localField: 'subjectId',
                    foreignField: '_id',
                    as: 'subjectDetails'
                }
            },
            { $unwind: '$subjectDetails' },
            {
                $facet: {
                    bySubject: [
                        {
                            $group: {
                                _id: '$subjectDetails._id',
                                name: { $first: '$subjectDetails.name' },
                                totalRecords: { $sum: 1 },
                                presentRecords: {
                                    $sum: { $cond: [{ $eq: ['$records.status', 'Present'] }, 1, 0] }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                subject: '$name',
                                attendancePercentage: {
                                    $cond: [
                                        { $gt: ['$totalRecords', 0] },
                                        { $round: [{ $multiply: [{ $divide: ['$presentRecords', '$totalRecords'] }, 100] }, 2] },
                                        0
                                    ]
                                }
                            }
                        }
                    ],
                    byDay: [
                        {
                            $project: {
                                dayOfWeek: { $dayOfWeek: '$date' },
                                status: '$records.status'
                            }
                        },
                        {
                            $group: {
                                _id: '$dayOfWeek',
                                totalRecords: { $sum: 1 },
                                absentRecords: {
                                    $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        const results = attendanceStats[0] || {};
        const attendanceOverview = results.bySubject || [];
        
        const dayMap = {
            1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 5: 'Thursday', 6: 'Friday', 7: 'Saturday'
        };
        const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        // Convert aggregated day stats into a map for fast lookup
        const dayStatsMap = {};
        (results.byDay || []).forEach(d => {
            const dayName = dayMap[d._id];
            if (dayName) {
                dayStatsMap[dayName] = {
                    total: d.totalRecords,
                    absent: d.absentRecords
                };
            }
        });

        const attendancePattern = defaultDays.map(day => {
            const stat = dayStatsMap[day] || { total: 0, absent: 0 };
            return {
                day,
                absencePercentage: stat.total > 0 
                    ? parseFloat(((stat.absent / stat.total) * 100).toFixed(2)) 
                    : 0
            };
        });

        res.json({
            attendanceOverview,
            attendancePattern
        });
    } catch (error) {
        console.error('Analytics Fetch Error:', error);
        res.status(500).json({ message: 'Server Error fetching analytics', error });
    }
};
