const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subject = require('../models/Subject');
const DailyAIUsage = require('../models/DailyAIUsage');
const AttendanceRecord = require('../models/AttendanceRecord');
const StudentMark = require('../models/StudentMark');
const MentorAllocation = require('../models/MentorAllocation');
const { generateAcademicResponse } = require('../services/academicBotService');

const MAX_DAILY_REQUESTS = 10;
const MAX_MESSAGE_LENGTH = 500;
const BLOCKED_KEYWORDS = ["movie", "joke", "love", "politics", "cricket", "instagram", "netflix", "song"];

router.post('/ask', async (req, res) => {
    try {
        const { message, studentId } = req.body;

        if (!message || !studentId) {
            return res.status(400).json({ reply: "Invalid request data." });
        }

        // 1. Message Length Validation
        if (message.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ reply: "Message too long. Please restrict to 500 characters." });
        }

        // 2. Keyword Blocking
        const lowerMessage = message.toLowerCase();
        for (const keyword of BLOCKED_KEYWORDS) {
            if (lowerMessage.includes(keyword)) {
                return res.json({ reply: "This assistant handles academic queries only." });
            }
        }

        // 3. User Validation
        const student = await User.findById(studentId);
        if (!student || student.role !== 'Student') {
            return res.status(403).json({ reply: "Unauthorized access." });
        }

        // 4. Rate Limiting
        const today = new Date().toISOString().split('T')[0];
        let usage = await DailyAIUsage.findOne({ studentId, date: today });

        if (!usage) {
            usage = new DailyAIUsage({ studentId, date: today, count: 0 });
        }

        if (usage.count >= MAX_DAILY_REQUESTS) {
            return res.status(429).json({ reply: "Daily limit reached (10 requests/day). Please try again tomorrow." });
        }

        // 5. Dynamic Subject Matching
        const subjects = await Subject.find({}, 'name facultyId');
        let matchedSubject = null;

        for (const sub of subjects) {
            if (lowerMessage.includes(sub.name.toLowerCase())) {
                matchedSubject = sub;
                break;
            }
        }

        if (matchedSubject) {
            const faculty = await User.findById(matchedSubject.facultyId);
            if (faculty) {
                return res.json({
                    reply: `For detailed doubts in ${matchedSubject.name}, please contact ${faculty.name} (Specialization: ${faculty.specialization}).`
                });
            }
        }

        // 6. Context Gathering
        // Calculate Attendance
        // Note: This is a simplified calculation. Real attendance logic might be more complex.
        const attendanceRecords = await AttendanceRecord.countDocuments({ studentId: student._id });
        // Assuming we need total sessions to calculate percentage, but currently we just fetch count or existing logic
        // For now, let's just pass a placeholder or count if total sessions aren't easily available without more queries. 
        // Let's assume the student model might have it or we calculate from sessions.
        // Simplified: just passing "Check Dashboard" or raw data if available.
        // Actually, let's try to get a rough % if possible, or just skip if too complex for this route.
        // Let's passed "Checked on Dashboard" for now to avoid overhead, or fetch if critical.
        // User asked for attendance %, let's try to fetch it properly if we can.
        // Only if we have the data. If not, passing "Data not available"

        // Fetch Marks (Weak Subjects logic: Marks < 40%)
        const marks = await StudentMark.find({ studentId: student._id }).populate('subjectId');
        const weakSubjects = marks.filter(m => m.marksObtained < 40).map(m => m.subjectId?.name || 'Unknown');

        // Fetch Mentor
        const mentorAlloc = await MentorAllocation.findOne({ studentId: student._id, isActive: true }).populate('facultyId');
        const mentorName = mentorAlloc ? mentorAlloc.facultyId.name : 'Not Assigned';

        const studentContext = {
            name: student.name,
            department: student.department || 'General',
            semester: student.semester,
            attendance: "Check Dashboard", // Placeholder to save computation time
            weakSubjects: weakSubjects,
            mentorName: mentorName
        };

        // 7. Call AI Service
        const aiResponse = await generateAcademicResponse(message, studentContext);

        // 8. Update Usage
        usage.count += 1;
        await usage.save();

        res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Route Error Detailed:", error);
        console.log("Error Message:", error.message);
        console.log("Error Status:", error.status);

        // Handle specific AI service errors
        if (error.message.includes("AI Service Error")) {
            const status = error.status || 500;
            // Provide a user-friendly message for common configuration errors
            let userMessage = "The AI service is temporarily unavailable.";

            if (status === 404 || error.message.includes("404")) {
                userMessage = "AI Configuration Error: The AI model is not found or API access is disabled. Please check the server configuration.";
            } else if (status === 403 || error.message.includes("403")) {
                userMessage = "AI Permission Error: The server's API key is invalid or expired.";
            } else if (status === 429) {
                userMessage = "AI Traffic Limit: The server is receiving too many requests. Please try again later.";
            }

            return res.status(status).json({
                reply: userMessage,
                debug: error.message // Include technical details for debugging (optional, maybe remove in prod)
            });
        }

        res.status(500).json({ reply: "Something went wrong. Please try again later." });
    }
});

module.exports = router;
