const mongoose = require('mongoose');
require('dotenv').config(); // Load env from root/backend/.env
const User = require('../models/User');
const Request = require('../models/Request');

const seedRequests = async () => {
    try {
        console.log('[Seed] Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[Seed] Connected.');

        // 1. Fetch Students
        const students = await User.find({ role: 'Student' });
        if (students.length === 0) {
            console.error('[Seed] No students found. Cannot seed requests.');
            process.exit(1);
        }
        console.log(`[Seed] Found ${students.length} students.`);

        // 2. Define Distribution
        // Total 30: 12 Pending, 10 Approved, 8 Rejected
        const tasks = [];
        for (let i = 0; i < 12; i++) tasks.push('Submitted'); // Pending maps to Submitted
        for (let i = 0; i < 10; i++) tasks.push('Approved'); // Admin Approved (Final)
        // Note: 'Approved' in DB usually means 'Approved' by Admin? 
        // Schema has: ['Submitted', 'Faculty Approved', 'Approved', 'Rejected']
        // 'Approved' is final. 'Faculty Approved' is intermediate. 
        // User asked for "Approved", I'll assume final 'Approved'.
        for (let i = 0; i < 8; i++) tasks.push('Rejected');

        // Shuffle tasks
        const shuffledStatus = tasks.sort(() => 0.5 - Math.random());

        // 3. Request Types & Descriptions
        const requestTemplates = [
            { type: 'Leave Application', desc: 'Medical leave for 3 days due to fever.' },
            { type: 'Leave Application', desc: 'Family function leave request.' },
            { type: 'Section Change', desc: 'Request to move from Section A to Section B due to timetable overlap.' },
            { type: 'Timetable Clash', desc: 'Project slot clashes with lab session.' },
            { type: 'Project Topic Approval', desc: 'Requesting approval for AI-based attendance system project.' },
            { type: 'Lab Batch Change', desc: 'Request to change lab batch from B1 to B2.' },
            { type: 'Subject Change', desc: 'Request to opt for Cloud Computing instead of Data Science.' }
        ];

        // 4. Generate Requests
        console.log('[Seed] Generating 30 requests...');
        const newRequests = [];

        for (const status of shuffledStatus) {
            const student = students[Math.floor(Math.random() * students.length)];
            const template = requestTemplates[Math.floor(Math.random() * requestTemplates.length)];

            // Random Date in last 20 days
            const daysAgo = Math.floor(Math.random() * 20);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);

            // Generate Request ID
            const datePart = Date.now().toString().slice(-6);
            const randomPart = Math.floor(100 + Math.random() * 900);
            const requestId = `REQ-${datePart}-${randomPart}-${Math.floor(Math.random() * 100)}`; // Added extra random to avoid collisions in loop

            const reqData = {
                requestId,
                requestType: template.type,
                description: template.desc,
                studentId: student._id,
                department: student.department || 'Computer Science',
                status: status,
                createdAt: createdAt,
                // Add dummy remarks if processed
                facultyRemarks: status !== 'Submitted' ? 'Processed' : undefined,
                adminRemarks: status === 'Approved' || status === 'Rejected' ? 'Final Action Taken' : undefined,
                // Set flags for 'Approved'
                adminActionDate: status === 'Approved' || status === 'Rejected' ? new Date() : undefined
            };

            newRequests.push(reqData);
        }

        // 5. Insert
        await Request.insertMany(newRequests);
        console.log(`[Seed] Successfully inserted ${newRequests.length} requests.`);

        process.exit(0);

    } catch (error) {
        console.error('[Seed] Error:', error);
        process.exit(1);
    }
};

seedRequests();
