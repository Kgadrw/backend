import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import User from './models/user.model.js';
import crypto from 'crypto';

// Load environment variables first
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes.js';
import artistRoutes from './routes/artist.routes.js';
import artworkRoutes from './routes/artwork.routes.js';
import likeRoutes from './routes/like.routes.js';
import commentRoutes from './routes/comment.routes.js';
import orderRoutes from './routes/order.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import newsletterRoutes from './routes/newsletter.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import reviewRoutes from './routes/review.routes.js';
import cartRoutes from './routes/cart.routes.js';

// Connect to database (dotenv.config() already called at top)
connectDB();

// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const socketCorsOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : process.env.NODE_ENV === 'production' 
    ? []
    : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      if (process.env.NODE_ENV === 'production') {
        if (socketCorsOrigins.length === 0 || socketCorsOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        callback(null, true); // Allow all origins in development
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user's room for notifications
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  // Handle likes
  socket.on('like', (data) => {
    io.emit('like-update', data);
  });

  // Handle comments
  socket.on('comment', (data) => {
    io.emit('comment-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware
// CORS configuration for production deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variables
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : process.env.NODE_ENV === 'production' 
        ? [] // In production, require FRONTEND_URL to be set
        : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];
    
    // In production, strictly enforce allowed origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length === 0) {
        console.warn('WARNING: FRONTEND_URL not set in production. Allowing all origins for now.');
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS: Origin ${origin} not allowed. Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'my_super_secret_session_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Use MongoDB session store in production if available
if (process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
  try {
    const MongoStore = (await import('connect-mongo')).default;
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60, // 24 hours
    });
    console.log('✅ Using MongoDB session store');
  } catch (error) {
    console.log('⚠️  MongoDB session store not available, using memory store');
    console.log('   Install connect-mongo for production: npm install connect-mongo');
  }
}

app.use(session(sessionConfig));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists by email
        user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

        if (user) {
          // Update existing user with Google ID
          user.googleId = profile.id;
          user.profileImage = profile.photos[0]?.value || user.avatar;
          user.avatar = user.avatar || profile.photos[0]?.value;
          if (!user.name || user.name === 'auth0-user') {
            user.name = profile.displayName;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value.toLowerCase(),
          profileImage: profile.photos[0]?.value,
          avatar: profile.photos[0]?.value,
          password: 'google-oauth-user', // Placeholder, will never be used
          isVerified: true, // Google emails are verified
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
  console.log('✅ Google OAuth strategy initialized');
} else {
  console.log('⚠️  Google OAuth credentials not found. Google login will be disabled.');
  console.log('   To enable Google login, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Root route - redirect to API docs or health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Art Marketplace API',
    version: '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    health: `${req.protocol}://${req.get('host')}/api/health`,
    endpoints: {
      auth: '/api/auth',
      artists: '/api/artists',
      artworks: '/api/artworks',
      orders: '/api/orders',
      cart: '/api/cart',
      analytics: '/api/analytics',
      reviews: '/api/reviews',
    },
  });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'INDATWA ART API Documentation',
  customCssUrl: null,
  explorer: true,
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Returns server status and timestamp
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Google OAuth routes (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { 
      failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/account?error=google_auth_failed'
    }),
    async (req, res) => {
      try {
        // Generate token for the user
        const token = crypto.randomBytes(32).toString('hex');
        req.user.token = token;
        await req.user.save();

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/account?token=${token}`);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/account?error=token_generation_failed`);
      }
    }
  );
} else {
  // Return error if Google OAuth is not configured
  app.get('/api/auth/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.'
    });
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api', likeRoutes);
app.use('/api', commentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Make io available to controllers
app.set('io', io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

