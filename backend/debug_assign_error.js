const axios = require('axios');
const mongoose = require('mongoose');

// Connect to MongoDB directly to verify data if needed, but primarily test API
// Actually, let's just use axios to hit the running server if it's running.
// If the user says "Server Error", the server is running but throwing 500.

const API_URL = 'http://localhost:5000/api';

async function testAssignment() {
    try {
        // 1. Login as Admin
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            loginId: 'admin@college',
            password: 'Admin@123'
        });
        const token = loginRes.data.token;
        console.log('Logged in.');

        // 2. Get Sections
        console.log('Fetching sections...');
        const sectionsRes = await axios.get(`${API_URL}/sections?semester=1`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const sections = sectionsRes.data;
        if (sections.length === 0) {
            console.log('No sections found. create one first.');
            return;
        }
        const section = sections[0];
        console.log(`Using Section: ${section.sectionName} (${section._id})`);

        // 3. Get Unassigned Students
        console.log('Fetching students...');
        const usersRes = await axios.get(`${API_URL}/users/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const students = usersRes.data.filter(u => !u.section && u.semester == 1);

        if (students.length === 0) {
            console.log('No unassigned students found.');
            return;
        }

        const studentIds = students.slice(0, 1).map(s => s._id);
        console.log(`Attempting to assign ${studentIds.length} students to section ${section.sectionName}`);

        // 4. Assign
        const assignRes = await axios.post(`${API_URL}/sections/assign`, {
            sectionId: section._id,
            studentIds: studentIds
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Success:', assignRes.data);

    } catch (error) {
        console.error('Error Occurred:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testAssignment();
