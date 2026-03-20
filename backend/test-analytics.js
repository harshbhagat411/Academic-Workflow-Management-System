const axios = require('axios');

async function test() {
    try {
        console.log('Logging in as admin...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            loginId: 'admin@college',
            password: 'Admin@123'
        });
        const token = loginRes.data.token;
        console.log('Got token:', token.substring(0, 20) + '...');

        console.log('Fetching analytics...');
        const res = await axios.get('http://localhost:5000/api/attendance/admin/analytics', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Success:', res.data);
    } catch (err) {
        if (err.response) {
            console.error('Error status:', err.response.status);
            console.error('Error data:', err.response.data);
        } else {
            console.error('Request failed:', err.message);
        }
    }
}

test();
