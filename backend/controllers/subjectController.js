const Subject = require('../models/Subject');

exports.getFacultySubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ facultyId: req.user.id });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Student: Get Subjects (Filtered by Semester)
exports.getStudentSubjects = async (req, res) => {
    try {
        const { semester } = req.query;
        if (!semester) return res.status(400).json({ message: 'Semester is required' });

        const student = req.user;
        console.log(`[getStudentSubjects] Req Sem: ${semester}, Student Dept: '${student.department}', Student ID: ${student._id}`);

        if (!student.department) {
            console.log('[getStudentSubjects] Student has no department');
            return res.json([]);
        }

        const subjects = await Subject.find({
            department: { $regex: new RegExp(`^${student.department.trim()}$`, 'i') },
            semester: parseInt(semester)
        }).select('name code facultyId');

        console.log(`[getStudentSubjects] Found ${subjects.length} subjects`);

        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Admin: Create a new Subject
// Admin: Create a new Subject
exports.createSubject = async (req, res) => {
    try {
        const { name, department, semester, facultyId } = req.body;

        // Auto-generate Subject Code: CS{semester}{sequence}
        // 1. Count existing subjects for this semester (and department, usually) to determine sequence.
        // Assuming 'Computer Science' department for the 'CS' prefix. If department varies, prefix should vary.
        // For now, prompt implies "CS" prefix is fixed or based on department. Let's assume CS per requirements.

        // Find count of subjects in this semester for Computer Science (or current dept)
        const count = await Subject.countDocuments({
            semester,
            department: 'Computer Science' // Ensuring we count relevant subjects for the CS prefix
            // If department is dynamic, we might need a map of Dept -> Prefix. 
            // Requirement says: CS{semester}{sequence}.
        });

        // Sequence starts at 1, so next is count + 1.
        // Format: CS + semester + 2-digit sequence
        // Example: Sem 1, count 0 -> 1 -> CS101
        // Example: Sem 1, count 2 -> 3 -> CS103

        const sequence = (count + 1).toString().padStart(2, '0');
        const code = `CS${semester}${sequence}`;

        // Check for collision (race condition or manual interference from before)
        // If exists, try next sequence? Simple approach: fail and let user retry (or recursive).
        // Given low traffic, simpler is better. But let's be safe.
        // Actually, better to use a loop to find first available if we want to fill gaps, 
        // OR just rely on count if we never delete. 
        // If we delete subject #2, count becomes N-1, and we might generate a duplicate.
        // BETTER APPROACH: Find the latest subject code for this semester and increment.

        const latestSubject = await Subject.findOne({
            semester,
            code: { $regex: `^CS${semester}` }
        }).sort({ code: -1 });

        let nextSequence = 1;
        if (latestSubject) {
            // Extract numeric part: CS105 -> 05
            // Length of "CS" + semester length. "CS" is 2 chars. Sem is 1 char (usually).
            // Actually, regex matching digits at end is safer.
            const match = latestSubject.code.match(/(\d{2})$/);
            if (match) {
                nextSequence = parseInt(match[1]) + 1;
            } else {
                // Fallback to count + 1 if format is weird
                nextSequence = count + 1;
            }
        }

        const newCode = `CS${semester}${nextSequence.toString().padStart(2, '0')}`;

        const subject = new Subject({
            name,
            code: newCode,
            department: department || 'Computer Science',
            semester,
            facultyId
        });

        await subject.save();
        res.status(201).json(subject);

    } catch (error) {
        // Handle duplicate key error if race condition
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Error generating unique code. Please try again.' });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Admin: Get All Subjects
exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().populate('facultyId', 'name email');
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Admin: Delete Subject
exports.deleteSubject = async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
