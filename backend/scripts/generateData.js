const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Subject = require('../models/Subject');
const Assessment = require('../models/Assessment');
const StudentMark = require('../models/StudentMark');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};

const TARGET_ASSESSMENTS = [
    { title: 'Internal 1', type: 'Test' },
    { title: 'Internal 2', type: 'Quiz' },
    { title: 'Assignment', type: 'Assignment' },
    { title: 'Mid Term', type: 'Mid-Term' }
];

const generateData = async () => {
    await connectDB();

    try {
        // 1. Fetch Students
        const students = await User.find({ role: 'Student', department: 'Computer Science' });
        console.log(`Found ${students.length} students in Computer Science.`);

        if (students.length === 0) {
            console.log('No students found. Exiting.');
            process.exit(0);
        }

        // Group students by semester
        const studentsBySemester = {};
        for (const student of students) {
            if (!studentsBySemester[student.semester]) {
                studentsBySemester[student.semester] = [];
            }
            studentsBySemester[student.semester].push(student);
        }

        for (const semester of Object.keys(studentsBySemester)) {
            const semesterStudents = studentsBySemester[semester];
            console.log(`Processing Semester ${semester}: ${semesterStudents.length} students.`);

            // 2. Fetch Subjects
            const subjects = await Subject.find({ semester: semester, department: 'Computer Science' });
            console.log(`Found ${subjects.length} subjects for Semester ${semester}.`);

            if (subjects.length === 0) continue;

            for (const subject of subjects) {
                console.log(`Processing Subject: ${subject.name} (${subject.code})`);

                // --- ASSESSMENTS (Bulk Upsert) ---
                const assessmentOps = TARGET_ASSESSMENTS.map(target => ({
                    updateOne: {
                        filter: { subjectId: subject._id, title: target.title },
                        update: {
                            $setOnInsert: {
                                subjectId: subject._id,
                                facultyId: subject.facultyId,
                                type: target.type,
                                title: target.title,
                                maxMarks: 100,
                                semester: semester,
                                status: 'Active'
                            }
                        },
                        upsert: true
                    }
                }));

                if (assessmentOps.length > 0) {
                    await Assessment.bulkWrite(assessmentOps);
                }

                // Fetch ensuring we have them with IDs
                const assessments = await Assessment.find({ subjectId: subject._id });

                // --- ATTENDANCE SESSIONS (Bulk Upsert) ---
                const totalLectures = 30;
                let existingSessions = await AttendanceSession.find({ subjectId: subject._id }).sort({ date: 1 });

                const sessionOps = [];
                const sessionsNeeded = totalLectures - existingSessions.length;

                if (sessionsNeeded > 0) {
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - totalLectures);

                    for (let i = 0; i < sessionsNeeded; i++) {
                        const date = new Date(startDate);
                        date.setDate(date.getDate() + i + existingSessions.length);

                        sessionOps.push({
                            updateOne: {
                                filter: { subjectId: subject._id, date: date },
                                update: {
                                    $setOnInsert: {
                                        subjectId: subject._id,
                                        facultyId: subject.facultyId,
                                        date: date,
                                        topic: `Lecture ${existingSessions.length + i + 1}`
                                    }
                                },
                                upsert: true
                            }
                        });
                    }
                }

                if (sessionOps.length > 0) {
                    await AttendanceSession.bulkWrite(sessionOps);
                }

                // Fetch all sessions (limit 30)
                const sessionsToUse = await AttendanceSession.find({ subjectId: subject._id }).sort({ date: 1 }).limit(30);


                // --- BATCHING STUDENT MARKS & ATTENDANCE ---
                // We will prepare all operations for all students in this subject and execute in chunks
                const markOps = [];
                const attendanceOps = [];

                for (const student of semesterStudents) {
                    // Marks
                    for (const assessment of assessments) {
                        const marks = Math.floor(Math.random() * (95 - 40 + 1)) + 40;
                        markOps.push({
                            updateOne: {
                                filter: { assessmentId: assessment._id, studentId: student._id },
                                update: {
                                    $setOnInsert: {
                                        assessmentId: assessment._id,
                                        studentId: student._id,
                                        marksObtained: marks
                                    }
                                },
                                upsert: true
                            }
                        });
                    }

                    // Attendance
                    const presentTarget = Math.floor(Math.random() * (30 - 18 + 1)) + 18;
                    const absentTarget = 30 - presentTarget;
                    const statuses = Array(presentTarget).fill('Present').concat(Array(absentTarget).fill('Absent'));
                    // Shuffle
                    for (let i = statuses.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
                    }

                    for (let i = 0; i < sessionsToUse.length; i++) {
                        attendanceOps.push({
                            updateOne: {
                                filter: { sessionId: sessionsToUse[i]._id, studentId: student._id },
                                update: {
                                    $setOnInsert: {
                                        sessionId: sessionsToUse[i]._id,
                                        studentId: student._id,
                                        status: statuses[i] || 'Absent'
                                    }
                                },
                                upsert: true
                            }
                        });
                    }
                }

                if (markOps.length > 0) {
                    process.stdout.write(`Writing ${markOps.length} marks... `);
                    await StudentMark.bulkWrite(markOps);
                    console.log('Done.');
                }

                if (attendanceOps.length > 0) {
                    process.stdout.write(`Writing ${attendanceOps.length} attendance records... `);
                    // Split into chunks of 1000 to avoid BSON limit if necessary, though bulkWrite handles large arrays well
                    const CHUNK_SIZE = 1000;
                    for (let i = 0; i < attendanceOps.length; i += CHUNK_SIZE) {
                        const chunk = attendanceOps.slice(i, i + CHUNK_SIZE);
                        await AttendanceRecord.bulkWrite(chunk);
                        process.stdout.write('.');
                    }
                    console.log('Done.');
                }
            }
        }

        console.log('Data generation complete.');
        process.exit(0);

    } catch (error) {
        console.error('Error generating data:', error);
        process.exit(1);
    }
};

generateData();
