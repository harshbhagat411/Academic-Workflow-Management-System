const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Timetable = require('../models/Timetable');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');

// Configuration
const DAYS_TO_SEED = 30;

const PROBABILITY_DISTRIBUTION = [
    { label: 'Very Low', pct: 0.10, min: 0.40, max: 0.55 },
    { label: 'Low', pct: 0.20, min: 0.55, max: 0.65 },
    { label: 'Average', pct: 0.40, min: 0.65, max: 0.80 },
    { label: 'Good', pct: 0.20, min: 0.80, max: 0.90 },
    { label: 'Excellent', pct: 0.10, min: 0.90, max: 1.00 }
];

const assignCategories = (students) => {
    // Shuffle students
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const total = shuffled.length;
    let currentIndex = 0;

    const studentCategories = {}; // studentId -> { prob: number }

    for (const dist of PROBABILITY_DISTRIBUTION) {
        const count = Math.round(total * dist.pct);
        const chunk = shuffled.slice(currentIndex, currentIndex + count);
        currentIndex += count;

        chunk.forEach(student => {
            // Assign a specific probability within the range for this student
            const personalProb = dist.min + Math.random() * (dist.max - dist.min);
            studentCategories[student._id] = personalProb;
        });
    }

    // Assign remainder to Average
    if (currentIndex < total) {
        shuffled.slice(currentIndex).forEach(student => {
            studentCategories[student._id] = 0.75;
        });
    }

    return studentCategories;
};

const getPastDates = (days) => {
    const dates = [];
    let d = new Date();
    d.setHours(0, 0, 0, 0);

    while (dates.length < days) {
        d.setDate(d.getDate() - 1);
        // Skip Sunday (0)
        if (d.getDay() !== 0) {
            dates.push(new Date(d));
        }
    }
    return dates;
};

const seedAttendance = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Fetch Reference Data
        const timetableDocs = await Timetable.find();
        const students = await User.find({ role: 'Student' });

        if (timetableDocs.length === 0) { console.error('No timetable data.'); process.exit(1); }
        if (students.length === 0) { console.error('No students found.'); process.exit(1); }

        console.log(`Found ${timetableDocs.length} timetable entries and ${students.length} students.`);

        // 2. Assign Personas
        const studentprobs = assignCategories(students);

        // 3. Optimized Day Loop
        const dates = getPastDates(DAYS_TO_SEED);
        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let totalSessions = 0;
        let totalRecords = 0;

        // Group students by Key for fast lookup
        const studentsBySection = {};
        students.forEach(s => {
            const key = `${s.semester}-${s.section}`;
            if (!studentsBySection[key]) studentsBySection[key] = [];
            studentsBySection[key].push(s);
        });

        for (const date of dates) {
            const dayName = daysMap[date.getDay()];
            const relevantSlots = timetableDocs.filter(t => t.day === dayName);
            if (relevantSlots.length === 0) continue;

            // A. Fetch existing sessions for this date
            const existingSessions = await AttendanceSession.find({ date: date });
            const sessionMap = new Map(); // "subjectId-section" -> sessionId
            existingSessions.forEach(s => sessionMap.set(`${s.subjectId}-${s.section}`, s._id));

            // B. Prepare New Sessions
            const sessionsToCreate = [];
            const newSessionPayloads = [];

            for (const slot of relevantSlots) {
                const key = `${slot.semester}-${slot.section}`;
                const targetStudents = studentsBySection[key];
                if (!targetStudents || targetStudents.length === 0) continue;
                if (!slot.facultyId) continue;

                const sessionKey = `${slot.subjectId}-${slot.section}`;
                if (!sessionMap.has(sessionKey)) {
                    sessionsToCreate.push(slot); // Store slot ref
                    newSessionPayloads.push({
                        subjectId: slot.subjectId,
                        facultyId: slot.facultyId,
                        date: date,
                        section: slot.section,
                        timetableId: slot._id,
                        topic: 'Seeded Session'
                    });
                    // Mark as present in map to prevent duplicate in SAME batch
                    sessionMap.set(sessionKey, 'PENDING');
                }
            }

            // C. Bulk Insert New Sessions
            if (newSessionPayloads.length > 0) {
                const createdDocs = await AttendanceSession.insertMany(newSessionPayloads);
                createdDocs.forEach(doc => {
                    sessionMap.set(`${doc.subjectId}-${doc.section}`, doc._id);
                    totalSessions++;
                });
            }

            // D. Prepare Records (Bulk)
            const recordsToInsert = [];

            const allSessionIds = Array.from(sessionMap.values());
            if (allSessionIds.length > 0) {
                // Fetch ALL existing records for these sessions to avoid duplicates
                // Optimization: If sessions were JUST created, we know they have 0 records.
                // If sessions existed, they might have records.
                // Let's optimize: only check records for PRE-EXISTING sessions.

                const preExistingSessionIds = existingSessions.map(s => s._id);
                const recordSet = new Set();

                if (preExistingSessionIds.length > 0) {
                    const existingRecords = await AttendanceRecord.find({ sessionId: { $in: preExistingSessionIds } }).select('sessionId studentId');
                    existingRecords.forEach(r => recordSet.add(`${r.sessionId}-${r.studentId}`));
                }

                const recordsInBatch = new Set(); // Dedup within this batch

                for (const slot of relevantSlots) {
                    const sessionKey = `${slot.subjectId}-${slot.section}`;
                    const sessionId = sessionMap.get(sessionKey);
                    if (!sessionId) continue;

                    const key = `${slot.semester}-${slot.section}`;
                    const targetStudents = studentsBySection[key] || [];

                    for (const student of targetStudents) {
                        const uniqueKey = `${sessionId}-${student._id}`;

                        // Check if record exists in DB OR in current batch
                        if (recordSet.has(uniqueKey) || recordsInBatch.has(uniqueKey)) continue;

                        const prob = studentprobs[student._id] || 0.75;
                        const isPresent = Math.random() < prob;

                        recordsToInsert.push({
                            sessionId: sessionId,
                            studentId: student._id,
                            status: isPresent ? 'Present' : 'Absent'
                        });
                        recordsInBatch.add(uniqueKey);
                    }
                }
            }

            // E. Bulk Insert Records
            if (recordsToInsert.length > 0) {
                await AttendanceRecord.insertMany(recordsToInsert);
                totalRecords += recordsToInsert.length;
            }

            process.stdout.write('.');
        }

        console.log(`\n\nSeeding Complete!`);
        console.log(`Sessions Created: ${totalSessions}`);
        console.log(`Records Created: ${totalRecords}`);

        process.exit(0);
    } catch (err) {
        console.error('Error seeding attendance:', err);
        process.exit(1);
    }
};

seedAttendance();
