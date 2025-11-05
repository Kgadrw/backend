import dotenv from 'dotenv';

dotenv.config();

export const auth0Config = {
  authRequired: false, // Set to false to manually protect routes with requiresAuth()
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET || 'a-long-randomly-generated-string-stored-in-env',
  baseURL: process.env.BASE_URL || 'http://localhost:5000',
  clientID: process.env.AUTH0_CLIENT_ID || 'HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo',
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN || 'dev-f3kd2ekgbk5qvp82.us.auth0.com'}`,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  routes: {
    login: '/api/auth/login', // Auth0 login route
    logout: '/api/auth/logout', // Auth0 logout route
    callback: '/api/auth/callback', // Auth0 callback route
    postLogoutRedirect: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  // Session configuration
  session: {
    rollingDuration: 24 * 60 * 60, // 24 hours
    absoluteDuration: 7 * 24 * 60 * 60, // 7 days
  },
};

