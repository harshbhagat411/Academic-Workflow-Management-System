const Section = require('../models/Section');
const User = require('../models/User');

// Get Sections by Semester
exports.getSections = async (req, res) => {
    try {
        const { semester } = req.query;
        if (!semester) return res.status(400).json({ message: 'Semester is required' });

        const sections = await Section.find({ semester }).sort({ sectionName: 1 });
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Update Section (Capacity / Status)
exports.updateSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { maxCapacity, status } = req.body;

        const section = await Section.findByIdAndUpdate(
            id,
            { maxCapacity, status },
            { new: true }
        );

        res.json(section);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Create Section Manually
exports.createSection = async (req, res) => {
    try {
        const { sectionName, semester, maxCapacity } = req.body;
        const department = req.user.department || 'Computer Science'; // Assuming admin has dept or default

        // Check if section exists
        const existingSection = await Section.findOne({ sectionName, semester, department });
        if (existingSection) {
            return res.status(400).json({ message: 'Section already exists' });
        }

        const newSection = new Section({
            sectionName,
            semester,
            department,
            maxCapacity: maxCapacity || 60,
            currentStrength: 0,
            status: 'Active'
        });

        await newSection.save();
        res.status(201).json(newSection);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Assign Students to Section
exports.assignStudents = async (req, res) => {
    try {
        const { sectionId, studentIds } = req.body;

        const section = await Section.findById(sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        // Update Users
        await User.updateMany(
            { _id: { $in: studentIds } },
            { $set: { section: section.sectionName } }
        );

        // Update Section Strength
        const currentStrength = await User.countDocuments({
            semester: section.semester,
            department: section.department,
            section: section.sectionName
        });

        section.currentStrength = currentStrength;
        await section.save();

        res.json({ message: 'Students assigned successfully', currentStrength });
    } catch (error) {
        console.error('Assign Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message, stack: error.stack });
    }
};
