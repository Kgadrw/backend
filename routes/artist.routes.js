import express from 'express';
import {
  getArtistProfile,
  updateArtistProfile,
  getMyArtworks,
  getArtistArtworks,
  getArtistStats,
} from '../controllers/artist.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/artists/me/artworks:
 *   get:
 *     summary: Get my artworks
 *     tags: [Artists]
 *     description: Get all artworks created by the authenticated artist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of artist's artworks
 *       401:
 *         description: Not authorized
 */
router.get('/me/artworks', protect, authorize('ARTIST'), getMyArtworks);

/**
 * @swagger
 * /api/artists/me/stats:
 *   get:
 *     summary: Get artist statistics
 *     tags: [Artists]
 *     description: Get statistics for the authenticated artist (total artworks, likes, comments)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Artist statistics retrieved successfully
 */
router.get('/me/stats', protect, authorize('ARTIST'), getArtistStats);

/**
 * @swagger
 * /api/artists/me:
 *   put:
 *     summary: Update artist profile
 *     tags: [Artists]
 *     description: Update the authenticated artist's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               location:
 *                 type: string
 *               website:
 *                 type: string
 *               avatar:
 *                 type: string
 *               socialLinks:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/me', protect, authorize('ARTIST'), updateArtistProfile);

/**
 * @swagger
 * /api/artists/{id}/artworks:
 *   get:
 *     summary: Get artist's artworks
 *     tags: [Artists]
 *     description: Get all artworks by a specific artist
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of artist's artworks
 */
router.get('/:id/artworks', (req, res, next) => {
  console.log(`📦 GET /api/artists/${req.params.id}/artworks`);
  getArtistArtworks(req, res, next);
});

/**
 * @swagger
 * /api/artists/{id}:
 *   get:
 *     summary: Get artist profile
 *     tags: [Artists]
 *     description: Get public profile information for a specific artist
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artist profile retrieved successfully
 *       404:
 *         description: Artist not found
 */
router.get('/:id', getArtistProfile);

export default router;

