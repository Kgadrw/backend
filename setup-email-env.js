/**
 * Helper script to check and guide email environment setup
 * Run with: node backend/setup-email-env.js
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n📧 Email Environment Setup Helper\n');
console.log('=' .repeat(50));

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('\n⚠️  .env file not found!');
  console.log('   Creating .env file...\n');
  
  // Create a basic .env file
  const defaultEnv = `# Email Configuration
EMAIL_USER=kalisagad05@gmail.com
EMAIL_PASSWORD=your-gmail-app-password-here
EMAIL_SERVICE=gmail

# MongoDB Configuration (add your MongoDB URI here)
# MONGODB_URI=your-mongodb-connection-string

# Other configuration...
# JWT_SECRET=your-jwt-secret
# FRONTEND_URL=http://localhost:5173
`;

  fs.writeFileSync(envPath, defaultEnv);
  console.log('✅ Created .env file!\n');
}

// Check current configuration
console.log('Current Configuration:');
console.log(`  EMAIL_USER: ${process.env.EMAIL_USER || '❌ NOT SET'}`);
console.log(`  EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ NOT SET'}`);
console.log(`  EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'gmail (default)'}\n`);

if (!process.env.EMAIL_PASSWORD || process.env.EMAIL_PASSWORD === 'your-gmail-app-password-here') {
  console.log('⚠️  EMAIL_PASSWORD is not configured!\n');
  console.log('📋 Follow these steps to set up Gmail App Password:\n');
  console.log('1. Go to: https://myaccount.google.com/security');
  console.log('2. Enable 2-Step Verification (if not already enabled)');
  console.log('3. Click on "2-Step Verification" → "App passwords"');
  console.log('4. Select "Mail" and "Other (Custom name)"');
  console.log('5. Enter name: "INDATWA ART Email Service"');
  console.log('6. Click "Generate"');
  console.log('7. Copy the 16-character password');
  console.log('8. Add it to your backend/.env file:\n');
  console.log('   EMAIL_PASSWORD=your-16-character-app-password\n');
  console.log('⚠️  IMPORTANT: You MUST use an App Password, NOT your regular Gmail password!');
  console.log('   Regular passwords like "itstoorate" will NOT work with Gmail SMTP.\n');
  console.log('📖 See backend/GMAIL_APP_PASSWORD_GUIDE.md for detailed instructions.\n');
} else {
  console.log('✅ Email configuration found!');
  console.log('   Run "node test-email-config.js" to test the connection.\n');
}

console.log('=' .repeat(50));

