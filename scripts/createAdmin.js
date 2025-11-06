import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    const adminEmail = 'admin.indatwa@gmail.com';
    const adminPassword = 'indatwa@2025';
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
      existingAdmin.role = 'ADMIN';
      existingAdmin.name = adminName;
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    } else {
      // Create admin user
      const admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // Will be hashed by pre-save hook
        role: 'ADMIN',
        isVerified: true,
      });

      console.log('✅ Admin user created successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('User ID:', admin._id);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

