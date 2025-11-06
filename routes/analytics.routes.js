import express from 'express';
import {
  trackPageView,
  getArtistAnalytics,
  getArtworkAnalytics,
  getArtworkViewsCount,
} from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public route for tracking page views
router.post('/pageview', trackPageView);

// Public route for getting artwork views count
router.get('/artwork/:id/views', getArtworkViewsCount);

// Protected routes for artists
router.get('/artist', protect, authorize('ARTIST'), getArtistAnalytics);
router.get('/artwork/:id', protect, authorize('ARTIST'), getArtworkAnalytics);

export default router;

