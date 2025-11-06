import nodemailer from 'nodemailer';

// Default sender email
const DEFAULT_EMAIL = 'kalisagad05@gmail.com';

// Create reusable transporter object using SMTP
const createTransporter = () => {
  // Use default email if not set in environment
  const emailUser = process.env.EMAIL_USER || DEFAULT_EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD;

  // Check if email password is configured
  if (!emailPassword) {
    console.error('❌ EMAIL_PASSWORD not configured in .env file!');
    console.error('   → Email sending will fail. Please set EMAIL_PASSWORD in your backend/.env file');
    console.error('   → For Gmail, use an App Password (not your regular password)');
    console.error('   → See backend/EMAIL_SETUP.md for instructions');
    throw new Error('EMAIL_PASSWORD not configured. Please set it in .env file.');
  }

  console.log(`📧 Creating email transporter with user: ${emailUser}`);

  // For development, you can use Gmail or another SMTP service
  // For production, use a service like SendGrid, Mailgun, or AWS SES
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // You can change this to other services
    auth: {
      user: emailUser, // Your email
      pass: emailPassword, // Your email password or app password
    },
  });
};

// Get sender email
const getSenderEmail = () => {
  return process.env.EMAIL_USER || DEFAULT_EMAIL;
};

// Send welcome email when user subscribes
export const sendWelcomeEmail = async (email, name = 'Valued Customer') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"INDATWA ART" <${getSenderEmail()}>`,
      to: email,
      subject: 'Welcome to INDATWA ART - Exclusive Art Updates',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to INDATWA ART</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Thank you for subscribing to our newsletter! We're thrilled to have you join our exclusive community of art enthusiasts.</p>
              <p>You'll be the first to discover:</p>
              <ul>
                <li>✨ New artwork creations from our talented artists</li>
                <li>🎨 Exclusive stories and behind-the-scenes content</li>
                <li>🛍️ Special offers and early access to collections</li>
                <li>📅 Upcoming events and exhibitions</li>
              </ul>
              <p>We can't wait to share our passion for art with you!</p>
              <p>Best regards,<br>The INDATWA ART Team</p>
            </div>
            <div class="footer">
              <p>© 2025 INDATWA ART. All rights reserved.</p>
              <p>You received this email because you subscribed to our newsletter.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email} from ${getSenderEmail()}`);
  } catch (error) {
    console.error('Error sending welcome email:', error.message || error);
    // Don't throw - email failure shouldn't break subscription
    // Log detailed error for debugging
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check EMAIL_PASSWORD in .env file.');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Check internet connection and email service settings.');
    }
  }
};

// Send personalized email when new artwork is uploaded
export const sendNewArtworkEmail = async (email, artwork, artistName) => {
  try {
    console.log(`📧 Attempting to send new artwork email to ${email}...`);
    const transporter = createTransporter();
    
    const artworkImage = artwork.images && artwork.images.length > 0 
      ? `<img src="${artwork.images[0]}" alt="${artwork.title}" style="max-width: 100%; border-radius: 8px; margin: 20px 0;" />`
      : '';

    const mailOptions = {
      from: `"INDATWA ART" <${getSenderEmail()}>`,
      to: email,
      subject: `🎨 New Artwork Alert: ${artwork.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .artwork-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .price { font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 New Artwork Available!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We're excited to share that a stunning new creation has just been added to our collection!</p>
              
              <div class="artwork-card">
                ${artworkImage}
                <h2 style="margin-top: 20px;">${artwork.title}</h2>
                <p><strong>Artist:</strong> ${artistName}</p>
                ${artwork.description ? `<p>${artwork.description}</p>` : ''}
                ${artwork.category ? `<p><strong>Category:</strong> ${artwork.category}</p>` : ''}
                ${artwork.year ? `<p><strong>Year:</strong> ${artwork.year}</p>` : ''}
                <div class="price">${artwork.price?.toLocaleString()} ${artwork.currency || 'RWF'}</div>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/artworks/${artwork._id}" class="button">View Artwork</a>
              </div>
              
              <p>Don't miss out on this exclusive piece. Visit our gallery to explore more!</p>
              <p>Best regards,<br>The INDATWA ART Team</p>
            </div>
            <div class="footer">
              <p>© 2025 INDATWA ART. All rights reserved.</p>
              <p>You received this email because you subscribed to our newsletter.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ New artwork email sent successfully to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending new artwork email to ${email}:`, error.message || error);
    // Log detailed error for debugging
    if (error.code === 'EAUTH') {
      console.error('   → Authentication failed. Check EMAIL_PASSWORD in .env file.');
      console.error('   → For Gmail, make sure you\'re using an App Password, not your regular password.');
      console.error('   → See backend/EMAIL_SETUP.md for instructions.');
    } else if (error.code === 'ECONNECTION') {
      console.error('   → Connection failed. Check internet connection and email service settings.');
    } else if (error.code === 'EENVELOPE') {
      console.error('   → Invalid email address or envelope error.');
    } else {
      console.error('   → Full error details:', error);
    }
    // Re-throw the error so it can be caught by the caller
    throw error;
  }
};

