const axios = require('axios');

async function test() {
    try {
        console.log('Logging in as admin or testing...');
        const mongoose = require('mongoose');
        await mongoose.connect('mongodb+srv://harshbhagat4114_db_user:hZVftvevSHEiAWWh@attendancecluster.xqtrdgr.mongodb.net/unicore_db?appName=AttendanceCluster');
        console.log('Connected to DB');
        const Subject = require('./models/Subject');
        const User = require('./models/User');
        const Timetable = require('./models/Timetable');
        
        const admin = await User.findOne({role: 'Admin'});
        console.log('Admin User:', admin ? admin.email : 'None');
        
        const timetables = await Timetable.find().populate('subjectId');
        if (timetables.length > 0) {
            console.log('Found Timetable Entry:');
            const t = timetables[0];
            
            if (!t.subjectId) {
                console.log('subjectId is null on timetable:', t._id);
            } else {
                console.log('Subject Dept:', t.subjectId.department);
                console.log('Subject Semester:', t.subjectId.semester);
                console.log('Timetable Section:', t.section);
                const query = {
                    role: 'Student',
                    department: t.subjectId.department,
                    semester: t.subjectId.semester
                };
                if (t.section) query.section = t.section;
                console.log('Query:', query);
                const students = await User.find(query);
                console.log('Students Found:', students.length);
            }
        } else {
            console.log('No timetables found.');
        }

        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

test();
