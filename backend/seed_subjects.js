const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedSubjects = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all faculty
        const facultyMembers = await User.find({ role: 'Faculty' });

        if (facultyMembers.length === 0) {
            console.log('No faculty found. Please create a faculty user first.');
            process.exit(0);
        }

        console.log(`Found ${facultyMembers.length} faculty members.`);

        // Create subjects for each faculty
        const subjects = [
            { name: 'Mathematics I', code: 'MATH101', semester: 1 },
            { name: 'Physics I', code: 'PHY101', semester: 1 },
            { name: 'Data Structures', code: 'CS201', semester: 3 },
            { name: 'Operating Systems', code: 'CS301', semester: 5 },
            { name: 'Database Management', code: 'CS302', semester: 5 },
        ];

        for (const faculty of facultyMembers) {
            // Assign 2 random subjects to this faculty
            // Note: In a real app, this would be more specific. 
            // Here we just want ensure they have something.

            // Check if they already have subjects
            const existing = await Subject.find({ facultyId: faculty._id });
            if (existing.length > 0) {
                console.log(`Faculty ${faculty.name} already has ${existing.length} subjects.`);
                continue;
            }

            // Create a unique subject for them
            // To avoid duplicates if multiple faculty, append faculty ID last 4 chars to code
            const uniqueSuffix = faculty._id.toString().slice(-4);

            const newSubject = new Subject({
                name: `Advanced Computing - ${uniqueSuffix}`,
                code: `AC${uniqueSuffix}`,
                department: faculty.department || 'Computer Science',
                semester: 5, // Defaulting to 5 for now
                facultyId: faculty._id
            });

            await newSubject.save();
            console.log(`Assigned ${newSubject.name} to ${faculty.name}`);
        }

        console.log('Seeding complete.');
        process.exit();
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedSubjects();
