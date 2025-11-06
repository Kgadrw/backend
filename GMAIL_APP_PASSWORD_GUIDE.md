# How to Create a Gmail App Password

## ⚠️ Important: Regular Gmail passwords DO NOT work with SMTP

You **must** create an **App Password** to send emails through Gmail.

## Step-by-Step Instructions:

### Step 1: Enable 2-Step Verification

1. Go to https://myaccount.google.com/security
2. Under "Signing in to Google", find "2-Step Verification"
3. Click on it and follow the prompts to enable it
4. You'll need to verify your phone number

### Step 2: Generate App Password

1. Go back to https://myaccount.google.com/security
2. Under "Signing in to Google", find "2-Step Verification"
3. Click on "2-Step Verification"
4. Scroll down and click on "App passwords"
5. You may need to sign in again
6. Select "Mail" as the app type
7. Select "Other (Custom name)" as the device
8. Enter a name like "INDATWA ART Email Service"
9. Click "Generate"
10. Google will show you a 16-character password (like: `abcd efgh ijkl mnop`)
11. **Copy this password** (remove spaces if needed)

### Step 3: Add to .env File

Add this to your `backend/.env` file:

```env
EMAIL_USER=kalisagad05@gmail.com
EMAIL_PASSWORD=your-16-character-app-password-here
EMAIL_SERVICE=gmail
```

**Important**: 
- Use the 16-character App Password (not your regular password "itstoorate")
- The App Password will look like: `abcd efgh ijkl mnop` (remove spaces when adding to .env)

### Step 4: Test the Configuration

Run the test script:
```bash
node test-email-config.js
```

You should see: `✅ Email configuration is working correctly!`

## Troubleshooting

- **"Authentication failed"**: Make sure you're using the App Password, not your regular password
- **"Can't find App passwords"**: Make sure 2-Step Verification is enabled first
- **"Invalid password"**: Make sure there are no spaces in the App Password in your .env file

