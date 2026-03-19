const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'Admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            await User.create({
                userId: 'ADMIN-001',
                loginId: 'admin@college',
                password: hashedPassword,
                role: 'Admin',
                name: 'System Admin',
                email: 'admin@college.com',
                phone: '0000000000',
                gender: 'Other',
                department: 'Computer Science' // Phase 8
            });
            console.log('Admin account created: admin@college / Admin@123');
        } else {
            console.log('Admin account already exists.');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

module.exports = seedAdmin;
