import express from 'express';
import {
  trackPageView,
  getArtistAnalytics,
  getArtworkAnalytics,
  getArtworkViewsCount,
} from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/analytics/pageview:
 *   post:
 *     summary: Track page view
 *     tags: [Analytics]
 *     description: Track a page view event (Public)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               artworkId:
 *                 type: string
 *               artistId:
 *                 type: string
 *               pageType:
 *                 type: string
 *                 enum: [artwork, artist, products, home, other]
 *     responses:
 *       200:
 *         description: Page view tracked successfully
 */
router.post('/pageview', trackPageView);

/**
 * @swagger
 * /api/analytics/artwork/{id}/views:
 *   get:
 *     summary: Get artwork views count
 *     tags: [Analytics]
 *     description: Get total views count for an artwork (Public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Views count retrieved successfully
 */
router.get('/artwork/:id/views', getArtworkViewsCount);

/**
 * @swagger
 * /api/analytics/artist:
 *   get:
 *     summary: Get artist analytics
 *     tags: [Analytics]
 *     description: Get comprehensive analytics for the authenticated artist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       403:
 *         description: Artist role required
 */
router.get('/artist', protect, authorize('ARTIST'), getArtistAnalytics);

/**
 * @swagger
 * /api/analytics/artwork/{id}:
 *   get:
 *     summary: Get artwork analytics
 *     tags: [Analytics]
 *     description: Get detailed analytics for a specific artwork (Artist only, owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artwork analytics retrieved successfully
 *       403:
 *         description: Not authorized
 */
router.get('/artwork/:id', protect, authorize('ARTIST'), getArtworkAnalytics);

export default router;

