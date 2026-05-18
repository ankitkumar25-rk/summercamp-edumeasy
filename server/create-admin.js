const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const createAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('Error: MONGODB_URI is not defined in server/.env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected successfully...');

        const adminEmail = 'admin@edumeasy.com';
        const rawPassword = 'adminpassword';

        // Check if admin already exists
        const existing = await User.findOne({ email: adminEmail });
        if (existing) {
            console.log(`Admin account already exists with email: ${adminEmail}`);
            // Force role to admin just in case
            existing.role = 'admin';
            existing.isEmailVerified = true;
            await existing.save();
            console.log('Role verified as "admin".');
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(rawPassword, 10);

        const newAdmin = await User.create({
            fullName: 'Admin Wizard',
            fatherName: 'System Architect',
            dateOfBirth: new Date('1995-01-01'),
            schoolName: 'EduMEasy HQ',
            studentClass: 10,
            whatsapp: '9999999999',
            email: adminEmail,
            passwordHash,
            state: 'Delhi',
            district: 'New Delhi',
            batchId: 'Foundational',
            role: 'admin',
            isEmailVerified: true,
            paymentStatus: 'paid'
        });

        console.log('\n=============================================');
        console.log('🎉 SUCCESS: Admin account created successfully!');
        console.log('=============================================');
        console.log(`📧 Email:    ${adminEmail}`);
        console.log(`🔑 Password: ${rawPassword}`);
        console.log('=============================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Error creating admin account:', err);
        process.exit(1);
    }
};

createAdmin();
