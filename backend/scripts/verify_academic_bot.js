const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
require('dotenv').config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const student = await User.findOne({ role: 'Student' });
        if (!student) {
            console.error('No student found!');
            process.exit(1);
        }
        console.log(`Testing with Student: ${student.name} (${student._id})`);

        const baseUrl = 'http://localhost:5000/api/academic-bot/ask';

        console.log('\n--- Test 1: Blocked Keyword ---');
        try {
            const res = await axios.post(baseUrl, {
                message: 'Tell me a joke about politics',
                studentId: student._id
            });
            console.log('Response:', res.data.reply);
        } catch (e) {
            console.log('Error:', e.response?.data?.reply || e.message);
        }

        console.log('\n--- Test 2: Subject Matching ---');
        const subject = await Subject.findOne();
        if (subject) {
            console.log(`Using Subject: ${subject.name}`);
            try {
                const res = await axios.post(baseUrl, {
                    message: `I have a doubt in ${subject.name}`,
                    studentId: student._id
                });
                console.log('Response:', res.data.reply);
            } catch (e) {
                console.log('Error:', e.response?.data?.reply || e.message);
            }
        }

        console.log('\n--- Test 3: General Academic Query ---');
        try {
            const res = await axios.post(baseUrl, {
                message: 'What is the importance of database normalization?',
                studentId: student._id
            });
            console.log('Response:', res.data.reply);
        } catch (e) {
            console.log('STATUS:', e.response?.status);
            console.log('ERROR DATA:', JSON.stringify(e.response?.data, null, 2));
            console.log('FULL ERROR RESPONSE:', e.response); // Print full object
        }

        console.log('\n--- Test 4: Rate Limiting (Sending 12 more requests) ---');
        for (let i = 0; i < 12; i++) {
            try {
                process.stdout.write(`Request ${i + 1}... `);
                await axios.post(baseUrl, {
                    message: `Query number ${i}`,
                    studentId: student._id
                });
                console.log('Allowed');
            } catch (e) {
                if (e.response?.status === 429) {
                    console.log('BLOCKED (Expected)');
                } else {
                    console.log(`Error: ${e.response?.status}`);
                }
            }
        }

    } catch (err) {
        console.error('Fatal:', err);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
