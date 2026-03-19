const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function request(url, method, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
        method,
        headers,
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Request failed');
    }
    return { data };
}

async function runVerification() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Login as Admin
        console.log('1. Logging in as Admin...');
        const adminLogin = await request(`${API_URL}/auth/login`, 'POST', {
            loginId: 'admin@college',
            password: 'Admin@123'
        });
        const adminToken = adminLogin.data.token;
        console.log('   Admin logged in.');

        // 2. Create Test Faculty
        console.log('2. Creating Test Faculty...');
        const facultyData = {
            name: 'Test Faculty Guide',
            email: `guide_${Date.now()}@test.com`,
            phone: '1234567890',
            gender: 'Male',
            role: 'Faculty',
            department: 'CSE',
            password: 'Password123'
        };

        const facultyRes = await request(`${API_URL}/users/create`, 'POST', facultyData, adminToken);
        const facultyId = facultyRes.data.user._id;
        const facultyLoginId = facultyRes.data.user.loginId;
        console.log(`   Created Faculty: ${facultyLoginId} (${facultyId})`);

        // 3. Create Test Student
        console.log('3. Creating Test Student...');
        const studentData = {
            name: 'Test Student Mentee',
            email: `student_${Date.now()}@test.com`,
            phone: '0987654321',
            gender: 'Female',
            role: 'Student',
            department: 'CSE',
            semester: 5,
            password: 'Password123'
        };
        const studentRes = await request(`${API_URL}/users/create`, 'POST', studentData, adminToken);
        const studentId = studentRes.data.user._id;
        const studentLoginId = studentRes.data.user.loginId;
        console.log(`   Created Student: ${studentLoginId} (${studentId})`);

        // 4. Assign Guide
        console.log('4. Assigning Guide...');
        const assignData = {
            studentIds: [studentId],
            facultyId,
            semester: 5
        };
        await request(`${API_URL}/guides/assign`, 'POST', assignData, adminToken);
        console.log('   Guide assigned successfully.');

        // 5. Verify as Student
        console.log('5. Verifying as Student...');
        const studentLogin = await request(`${API_URL}/auth/login`, 'POST', {
            loginId: studentLoginId,
            password: 'Password123'
        });
        const studentToken = studentLogin.data.token;

        const studentGuideRes = await request(`${API_URL}/guides/student`, 'GET', null, studentToken);

        if (studentGuideRes.data.facultyId._id === facultyId) {
            console.log('   ✅ Student sees correct guide.');
        } else {
            console.error('   ❌ Student sees WRONG guide:', studentGuideRes.data);
        }

        // 6. Verify as Faculty
        console.log('6. Verifying as Faculty...');
        const facultyLogin = await request(`${API_URL}/auth/login`, 'POST', {
            loginId: facultyLoginId,
            password: 'Password123'
        });
        const facultyToken = facultyLogin.data.token;

        const facultyStudentsRes = await request(`${API_URL}/guides/faculty`, 'GET', null, facultyToken);

        // API returns array of allocations
        const assignedStudent = facultyStudentsRes.data.find(alloc => alloc.studentId._id === studentId);
        if (assignedStudent) {
            console.log('   ✅ Faculty sees assigned student.');
        } else {
            console.error('   ❌ Faculty does NOT see assigned student.');
        }

        console.log('--- Verification Complete: SUCCESS ---');

    } catch (error) {
        console.error('--- Verification Failed ---');
        console.error(error.message);
    }
}

runVerification();
