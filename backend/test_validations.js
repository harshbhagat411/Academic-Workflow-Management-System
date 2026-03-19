const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

async function testCreateUserValidations() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('./models/User');
        const admin = await User.findOne({role: 'Admin'});

        if(!admin) {
            console.error("No admin user found in DB!");
            return;
        }

        console.log("---- Generating Admin Token for ID:", admin._id, "----");
        
        // Mock token generation
        const payload = {
            id: admin._id,
            role: 'Admin'
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        if (!token) {
            console.error("Failed to get token");
            return;
        }
        console.log("Token received.");

        const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

        console.log("\n---- Test 1: Invalid Name (Numbers) ----");
        try {
            await axios.post('http://localhost:5000/api/users/create', {
                name: 'John 123 Doe', email: 'test1@example.com', phone: '1234567890', role: 'Student', semester: '1'
            }, axiosConfig);
            console.error("Test 1 FAILED! Did not reject invalid name.");
        } catch (error) {
            console.log("Test 1 Result:", error.response.status, error.response.data.message);
        }

        console.log("\n---- Test 2: Invalid Phone (Letters) ----");
        try {
            await axios.post('http://localhost:5000/api/users/create', {
                name: 'John Doe', email: 'test2@example.com', phone: '123abc4567', role: 'Student', semester: '1'
            }, axiosConfig);
            console.error("Test 2 FAILED! Did not reject invalid phone.");
        } catch (error) {
            console.log("Test 2 Result:", error.response.status, error.response.data.message);
        }

        console.log("\n---- Test 3: Invalid Phone (Length) ----");
        try {
            await axios.post('http://localhost:5000/api/users/create', {
                name: 'John Doe', email: 'test3@example.com', phone: '12345', role: 'Student', semester: '1'
            }, axiosConfig);
            console.error("Test 3 FAILED! Did not reject invalid phone length.");
        } catch (error) {
            console.log("Test 3 Result:", error.response.status, error.response.data.message);
        }

        console.log("\n---- Test 4: Duplicate Email ----");
        try {
            // try creating again with same email
            await axios.post('http://localhost:5000/api/users/create', {
                name: 'Jane Doe Valid', email: 'admin@college.com', phone: '8888888888', role: 'Student', semester: '1'
            }, axiosConfig);
            console.error("Test 4 FAILED! Did not reject duplicate email.");
        } catch (error) {
            console.log("Test 4 Result:", error.response?.status, error.response?.data?.message);
        }

        console.log("\n---- Test 5: Valid User Registration ----");
        try {
            const validRes = await axios.post('http://localhost:5000/api/users/create', {
                name: 'Jane Smith Valid', email: `janesmith${Date.now()}@example.com`, phone: '8888888888', role: 'Student', semester: '10' // Also testing semester 10
            }, axiosConfig);
            console.log("Test 5 Result: ✅ SUCCESS. User created:", validRes.data.user.loginId);
        } catch (error) {
            console.error("Test 5 FAILED! Valid user creation was rejected.", error.response?.data);
        }

    } catch (err) {
        console.error("Fatal Error executing tests:", err.response ? err.response.data : err.message);
    } finally {
        mongoose.disconnect();
    }
}

testCreateUserValidations();
