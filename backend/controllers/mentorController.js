const MentorAllocation = require('../models/MentorAllocation');
const User = require('../models/User');

// @desc    Assign faculty as mentor to student
// @route   POST /api/mentors/assign
// @access  Admin
exports.assignMentor = async (req, res) => {
    try {
        const { studentIds, facultyId, semester } = req.body;
        const assignedBy = req.user.id;

        // 1. Validate Input
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'No students selected' });
        }

        // 2. Validate Faculty
        const faculty = await User.findById(facultyId);
        if (!faculty || faculty.role !== 'Faculty') {
            return res.status(400).json({ message: 'Invalid Faculty ID' });
        }

        // 3. Process each student
        const allocations = [];
        for (const studentId of studentIds) {
            const student = await User.findById(studentId);
            if (!student || student.role !== 'Student') continue;

            // Deactivate existing
            await MentorAllocation.updateMany(
                { studentId, semester, isActive: true },
                { isActive: false }
            );

            // Create new
            const newAllocation = await MentorAllocation.create({
                studentId,
                facultyId,
                semester,
                department: student.department || 'General',
                assignedBy
            });
            allocations.push(newAllocation);
        }

        res.status(201).json({
            message: `Successfully assigned mentor to ${allocations.length} students`,
            count: allocations.length
        });

    } catch (error) {
        console.error('Assign Mentor Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get active mentor for logged-in student
// @route   GET /api/mentors/student
// @access  Student
exports.getStudentMentor = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Fetching user to get current semester
        const student = await User.findById(studentId);
        const currentSemester = student.semester;

        const allocation = await MentorAllocation.findOne({
            studentId,
            isActive: true,
            semester: currentSemester
        }).populate('facultyId', 'name email phone department loginId');

        if (!allocation) {
            return res.status(404).json({ message: 'No active mentor found for current semester.' });
        }

        res.json(allocation);

    } catch (error) {
        console.error('Get Student Mentor Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all students mentored by logged-in faculty
// @route   GET /api/mentors/faculty
// @access  Faculty
exports.getFacultyMentoredStudents = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { semester } = req.query;

        const query = {
            facultyId,
            isActive: true
        };

        if (semester) {
            query.semester = semester;
        }

        const allocations = await MentorAllocation.find(query)
            .populate('studentId', 'name email loginId semester department')
            .sort({ semester: 1, 'studentId.name': 1 }); // Sort by semester then name

        res.json(allocations);

    } catch (error) {
        console.error('Get Faculty Students Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all allocations (Admin view)
// @route   GET /api/mentors/admin
// @access  Admin
exports.getAdminMentorAllocations = async (req, res) => {
    try {
        const { semester, facultyId, studentId, isActive } = req.query;

        const query = {};

        if (semester) query.semester = semester;
        if (facultyId) query.facultyId = facultyId;
        if (studentId) query.studentId = studentId;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const allocations = await MentorAllocation.find(query)
            .populate('studentId', 'name loginId semester')
            .populate('facultyId', 'name loginId')
            .populate('assignedBy', 'name loginId')
            .sort({ assignedAt: -1 });

        res.json(allocations);

    } catch (error) {
        console.error('Admin GetAll Allocations Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
