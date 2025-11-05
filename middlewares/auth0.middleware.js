import { requiresAuth } from 'express-openid-connect';
import User from '../models/user.model.js';
import ArtistProfile from '../models/artist.model.js';

/**
 * Middleware to sync Auth0 user with MongoDB
 * This works with express-openid-connect session-based auth
 * Should be used after requiresAuth() to ensure user is authenticated
 */
export const syncAuth0User = async (req, res, next) => {
  try {
    // Check if user is authenticated via Auth0 session
    if (req.oidc && req.oidc.isAuthenticated() && req.oidc.user) {
      const auth0User = req.oidc.user;

      // Find or create user in MongoDB
      let user = await User.findOne({ email: auth0User.email });

      if (!user) {
        // Create new user from Auth0 data
        user = await User.create({
          name: auth0User.name || auth0User.nickname || auth0User.email,
          email: auth0User.email,
          password: 'auth0-user', // Placeholder, will never be used
          role: auth0User['https://art-marketplace.com/role'] || 'BUYER',
          avatar: auth0User.picture,
          isVerified: auth0User.email_verified || false,
        });

        // If artist, create artist profile
        if (user.role === 'ARTIST') {
          await ArtistProfile.create({ userId: user._id });
        }
      } else {
        // Update existing user info
        user.name = auth0User.name || auth0User.nickname || user.name;
        user.avatar = auth0User.picture || user.avatar;
        user.isVerified = auth0User.email_verified || user.isVerified;
        if (auth0User['https://art-marketplace.com/role']) {
          user.role = auth0User['https://art-marketplace.com/role'];
        }
        await user.save();
      }

      // Attach MongoDB user to request
      req.user = user;
      req.mongoUser = user; // Alias for clarity
    }

    next();
  } catch (error) {
    console.error('Error syncing Auth0 user:', error);
    next(error);
  }
};

/**
 * Middleware to require authentication via Auth0 session
 * Uses express-openid-connect's requiresAuth middleware
 */
export const requireAuth0Auth = requiresAuth();

/**
 * Combined middleware: Requires Auth0 session AND syncs user with MongoDB
 * Use this for routes that need both Auth0 authentication and MongoDB user sync
 */
export const requireAuth0Session = [
  requireAuth0Auth,
  syncAuth0User,
];

