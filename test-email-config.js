/**
 * Test script to verify email configuration
 * Run with: node backend/test-email-config.js
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

const DEFAULT_EMAIL = 'kalisagad05@gmail.com';

console.log('\n📧 Testing Email Configuration...\n');

// Check if EMAIL_PASSWORD is set
const emailPassword = process.env.EMAIL_PASSWORD;
const emailUser = process.env.EMAIL_USER || DEFAULT_EMAIL;

console.log('Configuration Check:');
console.log(`  Email User: ${emailUser}`);
console.log(`  EMAIL_PASSWORD: ${emailPassword ? '✅ Set (' + emailPassword.substring(0, 4) + '****)' : '❌ NOT SET'}`);
console.log(`  EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'gmail (default)'}\n`);

if (!emailPassword) {
  console.error('❌ EMAIL_PASSWORD is not configured!');
  console.error('   → Please add EMAIL_PASSWORD to your backend/.env file');
  console.error('   → For Gmail, use an App Password (not your regular password)');
  console.error('   → See backend/EMAIL_SETUP.md for instructions\n');
  process.exit(1);
}

// Test transporter creation
try {
  console.log('Creating email transporter...');
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
  console.log('✅ Transporter created successfully\n');

  // Test connection (verify credentials)
  console.log('Testing SMTP connection and authentication...');
  await transporter.verify();
  console.log('✅ SMTP connection successful!');
  console.log('✅ Email authentication successful!');
  console.log('✅ Email configuration is working correctly!\n');
  console.log('📧 You can now send emails when new artworks are published.\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Email configuration test failed!\n');
  
  if (error.code === 'EAUTH') {
    console.error('   Authentication failed!');
    console.error('   → Make sure you\'re using a Gmail App Password, not your regular password');
    console.error('   → Enable 2-Step Verification on your Google account');
    console.error('   → Generate a new App Password in Google Account settings');
    console.error('   → See backend/EMAIL_SETUP.md for detailed instructions\n');
  } else if (error.code === 'ECONNECTION') {
    console.error('   Connection failed!');
    console.error('   → Check your internet connection');
    console.error('   → Verify Gmail SMTP is accessible\n');
  } else {
    console.error('   Error:', error.message || error);
    if (error.response) {
      console.error('   Response:', error.response);
    }
  }
  
  process.exit(1);
}

