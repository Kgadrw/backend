import Newsletter from '../models/newsletter.model.js';
import { sendWelcomeEmail } from '../utils/emailService.js';

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
export const subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // Check if already subscribed
    let existingSubscription;
    try {
      existingSubscription = await Newsletter.findOne({ email: normalizedEmail });
    } catch (dbError) {
      console.error('Database error finding subscription:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error. Please try again later.',
      });
    }

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(200).json({
          success: true,
          message: 'You are already subscribed to our newsletter',
          data: existingSubscription,
        });
      } else {
        // Reactivate subscription
        try {
          existingSubscription.isActive = true;
          await existingSubscription.save();
        } catch (dbError) {
          console.error('Database error reactivating subscription:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Database error. Please try again later.',
          });
        }
        
        // Send welcome email (non-blocking)
        sendWelcomeEmail(normalizedEmail).catch((emailError) => {
          console.error('Error sending welcome email:', emailError);
        });

        return res.status(200).json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated',
          data: existingSubscription,
        });
      }
    }

    // Create new subscription
    let subscription;
    try {
      subscription = await Newsletter.create({
        email: normalizedEmail,
        isActive: true,
      });
    } catch (dbError) {
      console.error('Database error creating subscription:', dbError);
      
      // Handle duplicate key error (unique constraint)
      if (dbError.code === 11000) {
        return res.status(200).json({
          success: true,
          message: 'You are already subscribed to our newsletter',
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create subscription. Please try again later.',
      });
    }

    // Send welcome email (non-blocking - don't wait for it)
    sendWelcomeEmail(normalizedEmail).catch((emailError) => {
      console.error('Error sending welcome email:', emailError);
      // Email failure doesn't affect subscription success
    });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: subscription,
    });
  } catch (error) {
    console.error('Unexpected error in subscribeNewsletter:', error);
    next(error);
  }
};

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
export const unsubscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const subscription = await Newsletter.findOne({ email: normalizedEmail });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our newsletter list',
      });
    }

    subscription.isActive = false;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    });
  } catch (error) {
    next(error);
  }
};

