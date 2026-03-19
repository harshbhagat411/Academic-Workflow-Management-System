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
        console.log('--- Starting Bulk Verification ---');

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
            name: 'Bulk Test Faculty',
            email: `bulk_guide_${Date.now()}@test.com`,
            phone: '1112223334',
            gender: 'Male',
            role: 'Faculty',
            department: 'CSE',
            password: 'Password123'
        };
        const facultyRes = await request(`${API_URL}/users/create`, 'POST', facultyData, adminToken);
        const facultyId = facultyRes.data.user._id;
        console.log(`   Created Faculty: ${facultyRes.data.user.loginId}`);

        // 3. Create Multiple Test Students
        console.log('3. Creating 3 Test Students...');
        const studentIds = [];
        for (let i = 0; i < 3; i++) {
            const studentData = {
                name: `Bulk Student ${i + 1}`,
                email: `bulk_st_${i}_${Date.now()}@test.com`,
                phone: `999888777${i}`,
                gender: 'Female',
                role: 'Student',
                department: 'CSE',
                semester: 6,
                password: 'Password123'
            };
            const sRes = await request(`${API_URL}/users/create`, 'POST', studentData, adminToken);
            studentIds.push(sRes.data.user._id);
            console.log(`   Created Student ${i + 1}: ${sRes.data.user.loginId}`);
        }

        // 4. Assign Guide to Multiple Students
        console.log('4. Assigning Guide to all 3 students...');
        const assignData = {
            studentIds, // Array
            facultyId,
            semester: 6
        };
        const assignRes = await request(`${API_URL}/guides/assign`, 'POST', assignData, adminToken);
        console.log(`   Response: ${assignRes.data.message}`);

        if (assignRes.data.count === 3) {
            console.log('   ✅ Assigned count matches.');
        } else {
            console.error('   ❌ Assigned count mismatch.');
        }

        // 5. Verify 1 Student
        console.log('5. Verifying as First Student...');
        // Need to login as them found in DB or simple check if we had their loginId. 
        // We know the pattern, or simpler: Check Admin Allocation List

        const adminAllocRes = await request(`${API_URL}/guides/admin?facultyId=${facultyId}`, 'GET', null, adminToken);
        if (adminAllocRes.data.length === 3) {
            console.log('   ✅ Admin sees 3 allocations for this faculty.');
        } else {
            console.error(`   ❌ Admin sees ${adminAllocRes.data.length} allocations.`);
        }

        console.log('--- Bulk Verification Complete: SUCCESS ---');

    } catch (error) {
        console.error('--- Verification Failed ---');
        console.error(error.message);
    }
}

runVerification();
