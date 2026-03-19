const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Section = require('../models/Section');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Timetable = require('../models/Timetable');

// --- CONSTANTS ---
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Time Slots
const THEORY_SLOTS = [
    { start: '08:30', end: '09:30' },
    { start: '09:30', end: '10:30' },
    { start: '11:15', end: '12:15' },
    { start: '12:15', end: '13:15' },
    { start: '13:30', end: '14:30' },
    { start: '14:30', end: '15:30' }
];

const LAB_SLOTS = [
    { start: '08:30', end: '10:30' }, // Covers slots 0 & 1
    { start: '11:15', end: '13:15' }, // Covers slots 2 & 3
    { start: '13:30', end: '15:30' }  // Covers slots 4 & 5
];

// Map 2-hour lab slots to indices of 1-hour theory slots they occupy
const LAB_OCCUPANCY = {
    0: [0, 1],
    1: [2, 3],
    2: [4, 5]
};

// --- STATE MANANGEMENT ---
// sectionAvailability[sectionId][dayIndex][slotIndex] = true/false (isOccupied)
const sectionAvailability = {};
// facultyAvailability[facultyId][dayIndex][slotIndex] = true/false (isOccupied)
const facultyAvailability = {};

const initAvailability = (sectionId) => {
    if (!sectionAvailability[sectionId]) {
        sectionAvailability[sectionId] = Array(DAYS.length).fill(null).map(() => Array(6).fill(false));
    }
};

const initFacultyAvailability = (facultyId) => {
    if (!facultyAvailability[facultyId]) {
        facultyAvailability[facultyId] = Array(DAYS.length).fill(null).map(() => Array(6).fill(false));
    }
};

// --- HELPER FUNCTIONS ---
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const isSlotFree = (sectionId, facultyId, dayIdx, slotIdx) => {
    initAvailability(sectionId);
    if (facultyId) initFacultyAvailability(facultyId);

    // Check Section
    if (sectionAvailability[sectionId][dayIdx][slotIdx]) return false;

    // Check Faculty (if assigned)
    if (facultyId && facultyAvailability[facultyId][dayIdx][slotIdx]) return false;

    return true;
};

const bookSlot = (sectionId, facultyId, dayIdx, slotIdx) => {
    initAvailability(sectionId);
    sectionAvailability[sectionId][dayIdx][slotIdx] = true;

    if (facultyId) {
        initFacultyAvailability(facultyId);
        facultyAvailability[facultyId][dayIdx][slotIdx] = true;
    }
};

// --- MAIN GENERATOR ---
const generateTimetable = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Clear Existing Timetable
        await Timetable.deleteMany({});
        console.log('Cleared existing timetable.');

        // 2. Fetch Data
        const allSections = await Section.find();
        const allSubjects = await Subject.find().populate('facultyId');

        // Group subjects by semester for easier access
        // subjectsBySem[sem] = [subject1, subject2...]
        const subjectsBySem = {};
        for (const sub of allSubjects) {
            if (!subjectsBySem[sub.semester]) subjectsBySem[sub.semester] = [];
            subjectsBySem[sub.semester].push(sub);
        }

        const entriesToInsert = [];

        // 3. Iterate Sections
        for (const section of allSections) {
            console.log(`Processing Section: ${section.sectionName} (Sem ${section.semester})`);
            const semester = section.semester;
            const subjects = subjectsBySem[semester] || [];

            if (subjects.length === 0) {
                console.warn(`No subjects found for Semester ${semester}. Skipping.`);
                continue;
            }

            // Define Load Rules
            // Sem 1-6: 4 Theory, 1 Lab, 1 Project (if applicable)
            // Sem 7-10: 3 Theory, 2 Major Project
            const isHigherSem = semester >= 7;
            const theoryLoad = 3; // Reduced to 3 to accommodate heavier Lab load (User requested 3-4 lab days)

            // Sort subjects to place Labs/Projects first (harder constraints)
            // Labs/Projects usually have specific names or types. 
            // Since we seeded 'Project' type subjects in recent steps, we check name or type.
            // But relying on names like "Lab" or "Project".

            // Heuristic for Practical Subjects (since names don't always say "Lab")
            const PRACTICAL_KEYWORDS = ['Programming', 'Data', 'Web', 'Algorithms', 'Network', 'Intelligence', 'System', 'Computing', 'Graphics', 'Logic', 'Project', 'Cloud', 'Cyber', 'DevOps', 'Computer', 'Communication', 'Design', 'Electronics'];

            const isPractical = (name) => {
                return PRACTICAL_KEYWORDS.some(k => name.includes(k)) || name.includes('Lab');
            };

            const labSubjects = subjects.filter(s => isPractical(s.name));
            // All subjects get theory, but practicals ALSO get lab
            const theorySubjects = subjects;

            // processing queue: [{ subject, isLab: boolean, count: number }]
            const queue = [];
            const sectionDaysWithLabs = new Set(); // Track days with labs for this section


            // Add Labs/Projects (High Priority - 2hr blocks)
            labSubjects.forEach(sub => {
                const count = 2; // Force 2 sessions per practical subject to Ensure 3-4 days distribution
                for (let i = 0; i < count; i++) {
                    queue.push({ subject: sub, isLab: true });
                }
            });

            // Add Theory (Lower Priority - 1hr slots)
            theorySubjects.forEach(sub => {
                for (let i = 0; i < theoryLoad; i++) {
                    queue.push({ subject: sub, isLab: false });
                }
            });

            // Try to place each item in queue
            for (const item of queue) {
                const { subject, isLab } = item;
                const facultyId = subject.facultyId ? subject.facultyId._id.toString() : null;

                let placed = false;
                let attempts = 0;

                // Shuffle days to distribute load
                const daysWithLabs = new Set();
                // We track this per section above, but simpler: check existing `entriesToInsert` for this section?
                // Better: maintain a local Set for this generation run.
                // Actually, `entriesToInsert` is flat. 
                // Let's optimize: `daysWithLabs` needs to be tracked *outside* this subject loop, but inside the section loop.
                // RE-WRITING LOGIC BELOW will handle it.

                let dayIndices;
                if (isLab) {
                    // Prioritize days that don't have a lab yet
                    const allDays = Array.from({ length: DAYS.length }, (_, i) => i);
                    const usedDays = Array.from(sectionDaysWithLabs); // defined in outer scope
                    const freeDays = allDays.filter(d => !usedDays.includes(d));
                    const busyDays = allDays.filter(d => usedDays.includes(d));

                    dayIndices = [...shuffle(freeDays), ...shuffle(busyDays)];
                } else {
                    dayIndices = shuffle(Array.from({ length: DAYS.length }, (_, i) => i));
                }

                while (!placed && attempts < 20) {
                    attempts++;

                    for (const dayIdx of dayIndices) {
                        if (placed) break;

                        // Saturday rules removed. Max 6 slots always.
                        const maxSlots = 6;

                        if (isLab) {
                            // Try fit 2-hour block
                            // Lab slots indices in LAB_SLOTS array: 0, 1, 2
                            // Occupy THEORY_SLOTS indices defined in LAB_OCCUPANCY
                            const labSlotIndices = shuffle([0, 1, 2]); // Shuffle lab options

                            for (const labSlotIdx of labSlotIndices) {
                                // Check if this lab slot fits in valid day time (e.g. Sat only has morning)
                                const occupiedIndices = LAB_OCCUPANCY[labSlotIdx];
                                if (occupiedIndices.some(idx => idx >= maxSlots)) continue; // Out of bounds for Saturday

                                // Check overlap
                                if (occupiedIndices.every(idx => isSlotFree(section._id, facultyId, dayIdx, idx))) {
                                    // Book it
                                    occupiedIndices.forEach(idx => bookSlot(section._id, facultyId, dayIdx, idx));

                                    const slotDef = LAB_SLOTS[labSlotIdx];
                                    entriesToInsert.push({
                                        semester: semester,
                                        section: section.sectionName,
                                        day: DAYS[dayIdx],
                                        startTime: slotDef.start,
                                        endTime: slotDef.end,
                                        subjectId: subject._id,
                                        facultyId: subject.facultyId || null, // Can be null if not assigned
                                        type: (subject.name.toLowerCase().includes('project')) ? 'Project' : 'Lab'
                                    });
                                    placed = true;
                                    sectionDaysWithLabs.add(dayIdx);
                                    break;
                                }
                            }
                        } else {
                            // Theory - 1 hour
                            const slotIndices = shuffle(Array.from({ length: maxSlots }, (_, i) => i));

                            for (const slotIdx of slotIndices) {
                                if (isSlotFree(section._id, facultyId, dayIdx, slotIdx)) {
                                    bookSlot(section._id, facultyId, dayIdx, slotIdx);

                                    const slotDef = THEORY_SLOTS[slotIdx];
                                    entriesToInsert.push({
                                        semester: semester,
                                        section: section.sectionName,
                                        day: DAYS[dayIdx],
                                        startTime: slotDef.start,
                                        endTime: slotDef.end,
                                        subjectId: subject._id,
                                        facultyId: subject.facultyId || null,
                                        type: 'Lecture'
                                    });
                                    placed = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (!placed) {
                    console.warn(`Could not place ${subject.name} (${isLab ? 'Lab' : 'Theory'}) for Section ${section.sectionName}`);
                }
            }
        }

        // 4. Batch Insert
        if (entriesToInsert.length > 0) {
            await Timetable.insertMany(entriesToInsert);
            console.log(`\nSuccessfully generated ${entriesToInsert.length} timetable entries.`);
        } else {
            console.log('\nNo entries generated.');
        }

        process.exit(0);

    } catch (err) {
        console.error('Error generating timetable:', err);
        process.exit(1);
    }
};

generateTimetable();
