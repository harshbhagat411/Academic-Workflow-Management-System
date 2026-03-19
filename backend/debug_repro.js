const axios = require('axios');

async function debug() {
    try {
        console.log('--- Debugging Request Creation ---');

        // 1. Login as Student
        console.log('1. Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            loginId: 'ST2026S013',
            password: 'Password123'
        });
        const token = loginRes.data.token;
        console.log('   Login successful. Token acquired.');

        // 2. Get Assigned Guide (verify this works first)
        console.log('2. Fetching Assigned Guide...');
        const guideRes = await axios.get('http://localhost:5000/api/guides/student', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const guide = guideRes.data.facultyId;
        console.log('   Assigned Guide:', guide.name, `(${guide._id})`);

        // 3. Create Request
        console.log('3. Creating Request...');
        const payload = {
            guideId: guide._id,
            requestType: 'Leave Permission',
            title: 'Debug Request',
            message: 'Testing from debug script'
        };

        const createRes = await axios.post('http://localhost:5000/api/guide-requests/create', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('   ✅ Request Created Successfully!');
        console.log('   Response:', createRes.data);

    } catch (error) {
        console.error('   ❌ Request Failed!');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Error:', error.message);
        }
    }
}

debug();
