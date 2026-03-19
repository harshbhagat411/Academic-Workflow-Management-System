const mongoose = require('mongoose');
const axios = require('axios');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://harshbhagat4114_db_user:hZVftvevSHEiAWWh@attendancecluster.xqtrdgr.mongodb.net/unicore_db?appName=AttendanceCluster');
        console.log('Connected DB');
        
        const AttendanceSession = require('./models/AttendanceSession');
        const session = await AttendanceSession.findOne().sort({ createdAt: -1 });
        if (!session) {
            console.log('No sessions found.');
            process.exit(0);
        }

        console.log('Latest Session:', session);
        console.log('Session ID:', session._id);
        console.log('Subject ID:', session.subjectId);
        console.log('Section:', session.section);

        // Now let's try calling getSessionStudents backend logic manually
        const Subject = require('./models/Subject');
        const User = require('./models/User');

        const subject = await Subject.findById(session.subjectId);
        if (!subject) console.log('SUBJECT NOT FOUND');
        else console.log('Subject Dept/Sem:', subject.department, subject.semester);

        const query = {
            role: 'Student',
            department: subject ? subject.department : undefined,
            semester: subject ? subject.semester : undefined
        };
        if (session.section) query.section = session.section;
        
        console.log('DB Query:', query);
        const students = await User.find(query).select('name loginId section');
        console.log('Students count:', students.length);
        
        process.exit(0);
    } catch(err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}
test();
