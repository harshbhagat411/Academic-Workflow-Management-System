const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        // Login as Admin
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com', // Replace with valid admin credentials if known, or I might need to create one/use one
            password: 'adminpassword'
        });
        const token = loginRes.data.token;
        console.log('Logged in, token received.');

        // Fetch Subjects to get a valid subject ID
        const subRes = await axios.get('http://localhost:5000/api/subjects/all', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const subject = subRes.data[0];
        console.log('Using Subject:', subject);

        // Test Bulk Add with MISSING Faculty
        console.log('Testing Bulk Add with missing faculty...');
        try {
            await axios.post('http://localhost:5000/api/timetable/bulk-add', {
                semester: 1,
                day: 'Monday',
                lectures: [{
                    startTime: '09:00',
                    endTime: '10:00',
                    subjectId: subject._id,
                    facultyId: '' // Explicitly empty
                }]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.log('Expected Error Status:', err.response?.status);
            console.log('Expected Error Data:', err.response?.data);
        }

    } catch (err) {
        console.error('Script Error:', err.response?.data || err.message);
    }
};

run();
