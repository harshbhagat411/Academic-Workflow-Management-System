const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Subject = require('../models/Subject');
const Assessment = require('../models/Assessment');
const StudentMark = require('../models/StudentMark');
const AssessmentType = require('../models/AssessmentType');

// Config
const ASSESSMENT_TYPES = [
    { name: 'Internal Test 1', maxMarks: 20, weightage: 10 },
    { name: 'Internal Test 2', maxMarks: 20, weightage: 10 },
    { name: 'Assignment', maxMarks: 10, weightage: 5 },
    { name: 'Quiz', maxMarks: 10, weightage: 5 },
    { name: 'Mid Semester', maxMarks: 30, weightage: 20 },
    { name: 'End Semester', maxMarks: 70, weightage: 50 },
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};

const getRandomDate = (daysBack) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date;
};

// Generates marks based on distribution logic
const generateMark = (maxMarks) => {
    const rand = Math.random();
    let minPercent, maxPercent;

    if (rand < 0.15) { // 15% Low (20-40%)
        minPercent = 0.20; maxPercent = 0.40;
    } else if (rand < 0.65) { // 50% Average (45-70%)
        minPercent = 0.45; maxPercent = 0.70;
    } else if (rand < 0.90) { // 25% Good (70-85%)
        minPercent = 0.70; maxPercent = 0.85;
    } else { // 10% High (85-100%)
        minPercent = 0.85; maxPercent = 1.00;
    }

    const marks = Math.floor(maxMarks * (minPercent + Math.random() * (maxPercent - minPercent)));
    // Ensure within bounds (min 0, max maxMarks)
    return Math.max(0, Math.min(marks, maxMarks));
};

const seedAssessments = async () => {
    await connectDB();

    try {
        console.log('--- PHASE 1: Assessment Types ---');
        const typeMap = {};
        for (const type of ASSESSMENT_TYPES) {
            let assessmentType = await AssessmentType.findOne({ name: type.name });
            if (!assessmentType) {
                assessmentType = await AssessmentType.create(type);
                console.log(`Created Assessment Type: ${type.name}`);
            } else {
                console.log(`Assessment Type exists: ${type.name}`);
            }
            typeMap[type.name] = assessmentType;
        }

        console.log('\n--- PHASE 2: Assessments per Subject ---');
        const subjects = await Subject.find().populate('facultyId');
        if (subjects.length === 0) {
            console.log('No subjects found. Exiting.');
            process.exit(0);
        }

        // Get an admin user for "createdBy" / "enteredBy"
        const adminUser = await User.findOne({ role: 'Admin' });
        const adminId = adminUser ? adminUser._id : null;

        let totalAssessments = 0;
        let totalMarks = 0;

        for (const subject of subjects) {
            console.log(`Processing Subject: ${subject.name} (Sem ${subject.semester})`);

            // Define which assessments to create for this subject (All of them)
            const assessmentsToCreate = ['Internal Test 1', 'Internal Test 2', 'Assignment', 'Mid Semester', 'End Semester'];

            for (const typeName of assessmentsToCreate) {
                const typeObj = typeMap[typeName];
                if (!typeObj) continue;

                // Check if assessment already exists
                let assessment = await Assessment.findOne({
                    subjectId: subject._id,
                    title: typeName,
                    assessmentTypeId: typeObj._id
                });

                if (!assessment) {
                    assessment = await Assessment.create({
                        subjectId: subject._id,
                        facultyId: subject.facultyId ? subject.facultyId._id : adminId, // Fallback to admin if no faculty
                        type: typeName, // Using name as type for backward compatibility enum
                        title: typeName,
                        maxMarks: typeObj.maxMarks,
                        semester: subject.semester,
                        assessmentTypeId: typeObj._id,
                        examDate: getRandomDate(60),
                        status: 'Active'
                    });
                    totalAssessments++;
                }

                // --- PHASE 3: Marks for this Assessment ---
                // Fetch Students of this semester
                const students = await User.find({ role: 'Student', semester: subject.semester });

                if (students.length > 0) {
                    const markOps = [];
                    for (const student of students) {
                        const existingMark = await StudentMark.findOne({ assessmentId: assessment._id, studentId: student._id });
                        if (!existingMark) {
                            const marksObtained = generateMark(assessment.maxMarks);
                            markOps.push({
                                insertOne: {
                                    document: {
                                        assessmentId: assessment._id,
                                        studentId: student._id,
                                        subjectId: subject._id,
                                        marksObtained: marksObtained,
                                        enteredBy: subject.facultyId ? subject.facultyId._id : adminId,
                                        enteredAt: new Date()
                                    }
                                }
                            });
                        }
                    }

                    if (markOps.length > 0) {
                        await StudentMark.bulkWrite(markOps);
                        totalMarks += markOps.length;
                    }
                }
            }
        }

        console.log(`\n--- SUMMARY ---`);
        console.log(`Assessments Created: ${totalAssessments}`);
        console.log(`Marks Entries Created: ${totalMarks}`);
        console.log(`Done.`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding assessments:', error);
        process.exit(1);
    }
};

seedAssessments();
