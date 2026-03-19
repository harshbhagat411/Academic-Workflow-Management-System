const Assessment = require('../models/Assessment');
const StudentMark = require('../models/StudentMark');
const Subject = require('../models/Subject');
const User = require('../models/User');

// Create a new assessment
exports.createAssessment = async (req, res) => {
    try {
        const { subjectId, type, title, maxMarks } = req.body;
        const facultyId = req.user.id;

        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Ensure faculty owns the subject
        if (subject.facultyId.toString() !== facultyId) {
            return res.status(403).json({ message: 'Not authorized to create assessment for this subject' });
        }

        const assessment = new Assessment({
            subjectId,
            facultyId,
            semester: subject.semester,
            type,
            title,
            maxMarks
        });

        await assessment.save();
        res.status(201).json(assessment);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'An assessment with this title already exists for the subject.' });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get assessments for a faculty (Filtered by their subjects)
exports.getFacultyAssessments = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const assessments = await Assessment.find({ facultyId })
            .populate('subjectId', 'name code semester')
            .sort({ createdAt: -1 });
        res.json(assessments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get details of an assessment + Students + Existing Marks
exports.getAssessmentDetails = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const assessment = await Assessment.findById(assessmentId).populate('subjectId', 'name code department semester');

        if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

        // Get students for this subject
        const students = await User.find({
            role: 'Student',
            department: assessment.subjectId.department,
            semester: assessment.subjectId.semester
        }).select('name loginId');

        // Get existing marks
        const marks = await StudentMark.find({ assessmentId });

        // Merge student list with marks
        const studentList = students.map(student => {
            const markEntry = marks.find(m => m.studentId.toString() === student._id.toString());
            return {
                _id: student._id,
                name: student.name,
                loginId: student.loginId,
                marksObtained: markEntry ? markEntry.marksObtained : ''
            };
        });

        res.json({ assessment, students: studentList });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Save Marks (Update or Insert)
exports.saveMarks = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const { marksData } = req.body; // [{ studentId, marksObtained }]

        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

        if (assessment.status === 'Locked') {
            return res.status(400).json({ message: 'Assessment is locked. Cannot update marks.' });
        }

        // Validate max marks
        for (const entry of marksData) {
            if (entry.marksObtained > assessment.maxMarks) {
                return res.status(400).json({ message: `Marks for student cannot exceed max marks (${assessment.maxMarks})` });
            }
            if (entry.marksObtained < 0) {
                return res.status(400).json({ message: 'Marks cannot be negative' });
            }
        }

        const operations = marksData.map(entry => ({
            updateOne: {
                filter: { assessmentId, studentId: entry.studentId },
                update: { marksObtained: entry.marksObtained },
                upsert: true
            }
        }));

        await StudentMark.bulkWrite(operations);
        res.json({ message: 'Marks saved successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Lock Assessment
exports.lockAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const assessment = await Assessment.findByIdAndUpdate(assessmentId, { status: 'Locked' }, { new: true });
        res.json(assessment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get Student Marks (Filtered by Subject)
exports.getStudentMarks = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { subjectId } = req.query;

        if (!subjectId) {
            return res.status(400).json({ message: 'Subject ID is required' });
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Find assessments for this subject
        // Show all assessments even if not locked? Requirement says "Assessment Appears only after subject selection". 
        // Previously we showed only Locked? Let's show all and status.
        const assessments = await Assessment.find({ subjectId: subject._id })
            .sort({ createdAt: 1 });

        // Find marks for this student
        const assessmentIds = assessments.map(a => a._id);
        const marks = await StudentMark.find({
            studentId,
            assessmentId: { $in: assessmentIds }
        });

        // Format response
        const assessmentDetails = assessments.map(a => {
            const mark = marks.find(m => m.assessmentId.toString() === a._id.toString());
            return {
                _id: a._id,
                title: a.title,
                type: a.type,
                maxMarks: a.maxMarks,
                marksObtained: (mark && a.status === 'Locked') ? mark.marksObtained : 'N/A', // Only show marks if locked/published
                status: a.status
            };
        });

        res.json({
            subjectName: subject.name,
            subjectCode: subject.code,
            assessments: assessmentDetails
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
