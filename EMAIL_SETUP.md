# Email Configuration for Newsletter

To enable email notifications for newsletter subscribers, you need to configure email settings in your `.env` file.

## Required Environment Variables

Add these to your `backend/.env` file:

```env
# Email Configuration
# Default sender email is set to kalisagad05@gmail.com
# You can override it by setting EMAIL_USER
EMAIL_USER=kalisagad05@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_SERVICE=gmail
FRONTEND_URL=http://localhost:5173
```

**Note:** The default sender email is `kalisagad05@gmail.com`. You only need to set `EMAIL_PASSWORD` for the email service to work.

## Gmail Setup (Development)

1. **Enable 2-Step Verification** on your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

## Other Email Services

You can use other SMTP services by changing `EMAIL_SERVICE`:

- **SendGrid**: `EMAIL_SERVICE=sendgrid`
- **Mailgun**: `EMAIL_SERVICE=mailgun`
- **Custom SMTP**: Configure host, port, etc. in `emailService.js`

## Features

- ✅ Welcome email when users subscribe
- ✅ Personalized email notifications when new artworks are uploaded
- ✅ Beautiful HTML email templates
- ✅ Graceful error handling (continues if email fails)

## Testing

After configuring, test the newsletter subscription:
1. Subscribe via the newsletter form on the homepage
2. Upload a new artwork as an artist
3. Check subscriber emails for the new artwork notification

## Troubleshooting

### Emails Not Being Sent

If emails are not being sent when new artworks are published, check the following:

1. **Check Backend Console Logs**
   - When you upload a new artwork, you should see logs like:
     - `📧 Starting email notification process for new artwork...`
     - `📧 Found X active subscribers`
     - `✅ Email sent successfully to [email]`
   - If you see errors, they will indicate the problem

2. **Verify EMAIL_PASSWORD is Set**
   - Make sure `EMAIL_PASSWORD` is in your `backend/.env` file
   - For Gmail, you MUST use an App Password (not your regular password)
   - The password should be 16 characters with no spaces

3. **Common Error Messages**

   - **"EMAIL_PASSWORD not configured"**
     - Solution: Add `EMAIL_PASSWORD=your-app-password` to `backend/.env`
   
   - **"Authentication failed (EAUTH)"**
     - Solution: Make sure you're using an App Password, not your regular Gmail password
     - Enable 2-Step Verification first
     - Generate a new App Password specifically for "Mail"
   
   - **"Connection failed (ECONNECTION)"**
     - Solution: Check your internet connection
     - Verify Gmail SMTP is accessible from your server
   
   - **"No active subscribers found"**
     - Solution: Make sure you have subscribers in the database with `isActive: true`
     - Test by subscribing via the newsletter form

4. **Verify Artwork Status**
   - Emails are only sent when artwork status is `PUBLISHED`
   - Check the artwork status in the database or when creating

5. **Test Email Configuration**
   - Check backend console when uploading artwork
   - Look for detailed error messages with emoji indicators:
     - ✅ = Success
     - ❌ = Error
     - ⚠️ = Warning
     - 📧 = Email-related

### Quick Checklist

- [ ] `EMAIL_PASSWORD` is set in `backend/.env`
- [ ] Using Gmail App Password (not regular password)
- [ ] 2-Step Verification is enabled on Gmail account
- [ ] Have at least one active subscriber in the database
- [ ] Artwork status is `PUBLISHED` when created
- [ ] Backend server is running and has access to the internet
- [ ] Check backend console logs for detailed error messages

