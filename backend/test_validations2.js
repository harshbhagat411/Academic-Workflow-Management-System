const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const admin = await User.findOne({role: 'Admin'});

    if(!admin) {
        console.error("No admin found in DB!");
        return mongoose.disconnect();
    }

    const token = jwt.sign({ id: admin._id, role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    // We only test validation. 
    const tests = [
        { name: 'Invalid Name', payload: { name: 'John 123', email: 't1@test.com', phone: '1234567890', role: 'Student', semester: '1', gender: 'Male' } },
        { name: 'Invalid Phone (Letters)', payload: { name: 'Valid Name', email: 't2@test.com', phone: '123abc4567', role: 'Student', semester: '1', gender: 'Male' } },
        { name: 'Short Phone', payload: { name: 'Valid Name', email: 't3@test.com', phone: '12345', role: 'Student', semester: '1', gender: 'Male' } },
        { name: 'Valid Student', payload: { name: 'Valid Name', email: `t4${Date.now()}@test.com`, phone: '1234567890', role: 'Student', semester: '10', gender: 'Male' } }
    ];

    for (const test of tests) {
        try {
            const res = await axios.post('http://localhost:5000/api/users/create', test.payload, config);
            console.log(`[${test.name}] Success: ${res.status}`);
        } catch (err) {
            console.log(`[${test.name}] Error: ${err.response?.status} - ${err.response?.data?.message}`);
        }
    }
    
    await mongoose.disconnect();
}
run();
