const Timetable = require('../models/Timetable');
const AttendanceSession = require('../models/AttendanceSession');

// Get Faculty's Schedule for Today
exports.getFacultySchedule = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const today = new Date();
        const dayName = today.toLocaleString('en-us', { weekday: 'long' });

        // Fetch Timetable for today
        const lectures = await Timetable.find({ facultyId, day: dayName })
            .populate('subjectId', 'name code type')
            .sort({ startTime: 1 });

        // Determine status for each lecture
        const schedule = await Promise.all(lectures.map(async (lecture) => {
            // Check if attendance already marked
            const baseDate = new Date();
            const startOfDay = new Date(baseDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(baseDate.setHours(23, 59, 59, 999));

            let existingSession = await AttendanceSession.findOne({
                timetableId: lecture._id,
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            if (!existingSession) {
                // Fallback for older sessions created without timetableId
                existingSession = await AttendanceSession.findOne({
                    subjectId: lecture.subjectId._id,
                    section: lecture.section,
                    date: { $gte: startOfDay, $lte: endOfDay },
                    timetableId: { $exists: false } // Crucial fix: Only fallback if it's an old record without timetableId
                });
            }

            // Calculate Time Status
            // lecture.startTime is "08:30" (24h format string)
            // Convert to Date objects for comparison
            const now = new Date();
            const [startH, startM] = lecture.startTime.split(':').map(Number);
            const [endH, endM] = lecture.endTime.split(':').map(Number);

            const startDate = new Date(); startDate.setHours(startH, startM, 0);
            const endDate = new Date(); endDate.setHours(endH, endM, 0);

            let status = 'Upcoming';

            if (existingSession) {
                status = 'Submitted';
            } else if (now > endDate) {
                status = 'Expired';
            } else if (now >= startDate && now <= endDate) {
                status = 'Ongoing';
            }

            return {
                ...lecture.toObject(),
                status,
                sessionId: existingSession ? existingSession._id : null
            };
        }));

        res.json(schedule);

    } catch (error) {
        console.error('Error fetching faculty schedule:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Add a new lecture
exports.addLecture = async (req, res) => {
    try {
        const { semester, section, day, startTime, endTime, subjectId, facultyId } = req.body;

        if (!section) return res.status(400).json({ message: 'Section is required.' });

        // 1. Basic Validation
        if (startTime >= endTime) {
            return res.status(400).json({ message: 'Start time must be before end time.' });
        }

        // Subject Type Validation
        const Subject = require('../models/Subject'); // Import here to avoid circular dependency issues if any, or just standard import at top
        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ message: 'Subject not found.' });

        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        const startMin = parseInt(startTime.split(':')[1]);
        const endMin = parseInt(endTime.split(':')[1]);

        // Calculate duration in minutes
        const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

        // Validation Rules
        // Use type from request if provided, otherwise fallback to subject's default type
        const lectureType = req.body.type || subject.type;

        if (lectureType === 'Lab') {
            if (durationMinutes !== 120) { // 2 hours
                return res.status(400).json({ message: 'Lab sessions must be exactly 2 consecutive hours.' });
            }
        } else if (lectureType === 'Theory') {
            if (durationMinutes !== 60) { // 1 hour
                return res.status(400).json({ message: 'Theory sessions must be exactly 1 hour.' });
            }
        } else if (lectureType === 'Project') {
            if (durationMinutes !== 60 && durationMinutes !== 120) {
                return res.status(400).json({ message: 'Project sessions must be 1 or 2 hours.' });
            }
        }

        // 2. Conflict Validation (Section) - A section cannot have two lectures at the same time
        const sectionConflict = await Timetable.findOne({
            semester,
            section,
            day,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
        });

        if (sectionConflict) {
            return res.status(400).json({ message: `Time slot already occupied for Section ${section}.` });
        }

        // 3. Conflict Validation (Faculty) - A faculty cannot be in two places
        const facultyConflict = await Timetable.findOne({
            facultyId,
            day,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
        });

        if (facultyConflict) {
            return res.status(400).json({ message: 'Faculty is already assigned to another lecture at this time.' });
        }

        const lecture = new Timetable({
            semester,
            section,
            day,
            startTime,
            endTime,
            type: req.body.type || subject.type,
            subjectId,
            facultyId
        });

        await lecture.save();
        res.status(201).json(lecture);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get Timetable for a specific Semester and Section
exports.getTimetable = async (req, res) => {
    try {
        const { semester, section } = req.query; // Changed from params to query to support section
        if (!semester || !section) return res.status(400).json({ message: 'Semester and Section are required.' });

        // Robust Parsing
        const parsedSemester = parseInt(semester);
        const cleanSection = section.trim();

        console.log(`[getTimetable] Fetching for Sem: ${parsedSemester}, Section: '${cleanSection}'`);

        // Use regex for case-insensitive section matching
        const timetable = await Timetable.find({
            semester: parsedSemester,
            section: { $regex: new RegExp(`^${cleanSection}$`, 'i') }
        })
            .populate('subjectId', 'name code')
            .populate('facultyId', 'name')
            .sort({ day: 1, startTime: 1 });

        console.log(`[getTimetable] Found ${timetable.length} entries`);

        // Debug fallback: If no entries found, check if semester has ANY entries
        if (timetable.length === 0) {
            const checkSem = await Timetable.countDocuments({ semester: parsedSemester });
            console.log(`[getTimetable] Debug: Total entries for Sem ${parsedSemester}: ${checkSem}`);
        }

        res.json(timetable);
    } catch (error) {
        console.error('[getTimetable] Error:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Update Lecture
exports.updateLecture = async (req, res) => {
    try {
        const { id } = req.params;
        const { semester, section, day, startTime, endTime, subjectId, facultyId } = req.body;

        if (startTime >= endTime) {
            return res.status(400).json({ message: 'Start time must be before end time.' });
        }

        // Check for conflicts excluding the current lecture
        const sectionConflict = await Timetable.findOne({
            _id: { $ne: id },
            semester,
            section,
            day,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
        });

        if (sectionConflict) {
            return res.status(400).json({ message: `Time slot already occupied for Section ${section}.` });
        }

        const facultyConflict = await Timetable.findOne({
            _id: { $ne: id },
            facultyId,
            day,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
        });

        if (facultyConflict) {
            return res.status(400).json({ message: 'Faculty is already assigned to another lecture at this time.' });
        }

        const updatedLecture = await Timetable.findByIdAndUpdate(id,
            { semester, section, day, startTime, endTime, subjectId, facultyId },
            { new: true }
        );

        res.json(updatedLecture);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Delete Lecture
exports.deleteLecture = async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lecture deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
// Copy Timetable from one day to another
exports.copyTimetable = async (req, res) => {
    try {
        const { sourceDay, targetDay, semester, lectureIds } = req.body;

        if (sourceDay === targetDay) {
            return res.status(400).json({ message: 'Source and Target day cannot be the same.' });
        }

        // Fetch source lectures
        const query = { day: sourceDay, semester };
        if (lectureIds && lectureIds.length > 0) {
            query._id = { $in: lectureIds };
        }

        const sourceLectures = await Timetable.find(query);

        if (sourceLectures.length === 0) {
            return res.status(404).json({ message: `No lectures found for ${sourceDay} in Semester ${semester}.` });
        }

        // Check for conflicts in target day for EACH lecture
        const conflicts = [];
        const newLectures = [];

        for (const lecture of sourceLectures) {
            // Check Faculty Conflict in Target Day
            const facultyConflict = await Timetable.findOne({
                facultyId: lecture.facultyId,
                day: targetDay,
                $or: [
                    { startTime: { $lt: lecture.endTime, $gte: lecture.startTime } },
                    { endTime: { $gt: lecture.startTime, $lte: lecture.endTime } },
                    { startTime: { $lte: lecture.startTime }, endTime: { $gte: lecture.endTime } }
                ]
            });

            // Check Semester Conflict in Target Day
            const semesterConflict = await Timetable.findOne({
                semester,
                day: targetDay,
                $or: [
                    { startTime: { $lt: lecture.endTime, $gte: lecture.startTime } },
                    { endTime: { $gt: lecture.startTime, $lte: lecture.endTime } },
                    { startTime: { $lte: lecture.startTime }, endTime: { $gte: lecture.endTime } }
                ]
            });

            if (facultyConflict) {
                conflicts.push(`Faculty ${lecture.facultyId} is busy at ${lecture.startTime}-${lecture.endTime} on ${targetDay}`);
            } else if (semesterConflict) {
                conflicts.push(`Semester ${semester} already has a class at ${lecture.startTime}-${lecture.endTime} on ${targetDay}`);
            } else {
                newLectures.push({
                    semester,
                    day: targetDay,
                    startTime: lecture.startTime,
                    endTime: lecture.endTime,
                    subjectId: lecture.subjectId,
                    facultyId: lecture.facultyId
                });
            }
        }

        if (conflicts.length > 0) {
            return res.status(400).json({
                message: 'Copy failed due to conflicts.',
                conflicts
            });
        }

        await Timetable.insertMany(newLectures);
        res.json({ message: `Successfully copied ${newLectures.length} lectures to ${targetDay}.` });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Bulk Add Lectures
exports.bulkAddLectures = async (req, res) => {
    try {
        const { lectures, semester, day } = req.body; // lectures = [{startTime, endTime, subjectId, facultyId}, ...]

        if (!lectures || lectures.length === 0) {
            return res.status(400).json({ message: 'No lectures provided.' });
        }

        const conflicts = [];
        const validLectures = [];

        // Validate entire batch first
        for (const l of lectures) {
            // 1. Check for missing required fields
            if (!l.subjectId) {
                conflicts.push(`Subject is required for lecture at ${l.startTime}`);
                continue;
            }
            if (!l.facultyId) {
                conflicts.push(`Faculty is required for lecture at ${l.startTime}. Auto-assign failed (Subject has no default faculty).`);
                continue;
            }

            // 2. Check for invalid time range
            if (l.startTime >= l.endTime) {
                conflicts.push(`Invalid time range ${l.startTime}-${l.endTime}`);
                continue;
            }

            // Subject Type Validation for Bulk
            const Subject = require('../models/Subject');
            const subject = await Subject.findById(l.subjectId);
            if (!subject) {
                conflicts.push(`Subject not found for lecture at ${l.startTime}`);
                continue;
            }

            const startHour = parseInt(l.startTime.split(':')[0]);
            const endHour = parseInt(l.endTime.split(':')[0]);
            const startMin = parseInt(l.startTime.split(':')[1]);
            const endMin = parseInt(l.endTime.split(':')[1]);

            const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

            if (subject.type === 'Lab' && durationMinutes !== 120) {
                conflicts.push(`Lab sessions must be 2 hours (${subject.name} at ${l.startTime})`);
                continue;
            }
            if (subject.type === 'Theory' && durationMinutes !== 60) {
                conflicts.push(`Theory sessions must be 1 hour (${subject.name} at ${l.startTime})`);
                continue;
            }
            if (subject.type === 'Project' && durationMinutes !== 60 && durationMinutes !== 120) {
                conflicts.push(`Project sessions must be 1 or 2 hours (${subject.name} at ${l.startTime})`);
                continue;
            }

            // Check DB Conflicts
            const facultyConflict = await Timetable.findOne({
                facultyId: l.facultyId,
                day,
                $or: [
                    { startTime: { $lt: l.endTime, $gte: l.startTime } },
                    { endTime: { $gt: l.startTime, $lte: l.endTime } },
                    { startTime: { $lte: l.startTime }, endTime: { $gte: l.endTime } }
                ]
            });

            const semesterConflict = await Timetable.findOne({
                semester,
                day,
                $or: [
                    { startTime: { $lt: l.endTime, $gte: l.startTime } },
                    { endTime: { $gt: l.startTime, $lte: l.endTime } },
                    { startTime: { $lte: l.startTime }, endTime: { $gte: l.endTime } }
                ]
            });

            if (facultyConflict) {
                conflicts.push(`Faculty busy at ${l.startTime} on ${day}`);
            } else if (semesterConflict) {
                conflicts.push(`Semester slot occupied at ${l.startTime} on ${day}`);
            } else {
                validLectures.push({
                    semester,
                    day,
                    startTime: l.startTime,
                    endTime: l.endTime,
                    subjectId: l.subjectId,
                    facultyId: l.facultyId
                });
            }
        }

        // Internal Batch Check (Overlap within the new batch itself)
        for (let i = 0; i < validLectures.length; i++) {
            for (let j = i + 1; j < validLectures.length; j++) {
                const l1 = validLectures[i];
                const l2 = validLectures[j];

                // Time Overlap check
                if ((l1.startTime < l2.endTime && l1.endTime > l2.startTime)) {
                    conflicts.push(`Internal conflict in batch: ${l1.startTime} overlaps with ${l2.startTime}`);
                }
            }
        }

        if (conflicts.length > 0) {
            return res.status(400).json({ message: 'Bulk add failed due to conflicts.', conflicts });
        }

        await Timetable.insertMany(validLectures);
        res.json({ message: `Successfully added ${validLectures.length} lectures.` });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
