const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Section = require('../models/Section');
const User = require('../models/User');
const { autoAllocateSection } = require('../controllers/sectionController');

dotenv.config({ path: 'backend/.env' });

const verifyAllocation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clean up
        await Section.deleteMany({ department: 'Test Dept' });
        await User.deleteMany({ department: 'Test Dept' });

        const semester = 1;
        const department = 'Test Dept';

        console.log('--- Testing Auto Allocation ---');

        // Test 1: Allocate first student (Should create Section A)
        const sec1 = await autoAllocateSection(semester, department);
        console.log('Student 1 Allocated to:', sec1);
        if (sec1 !== 'A') throw new Error('Expected Section A');

        // Verify Section A created
        const sectionA = await Section.findOne({ semester, department, sectionName: 'A' });
        if (!sectionA) throw new Error('Section A not found in DB');
        console.log('Section A Strength:', sectionA.currentStrength);

        // Test 2: Fill Section A (Capacity is 70, but let's hack it to 1 for testing)
        sectionA.maxCapacity = 1;
        await sectionA.save();

        // Test 3: Allocate second student (Should create Section B)
        const sec2 = await autoAllocateSection(semester, department);
        console.log('Student 2 Allocated to:', sec2);
        if (sec2 !== 'B') throw new Error('Expected Section B');

        const sectionB = await Section.findOne({ semester, department, sectionName: 'B' });
        if (!sectionB) throw new Error('Section B not found');
        console.log('Section B Strength:', sectionB.currentStrength);

        console.log('SUCCESS: Section Allocation Verified!');

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.connection.close();
    }
};

verifyAllocation();
