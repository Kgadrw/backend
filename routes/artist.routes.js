import express from 'express';
import {
  getArtistProfile,
  updateArtistProfile,
  getMyArtworks,
  getArtistArtworks,
  getArtistStats,
  followArtist,
  unfollowArtist,
  getFollowingArtists,
  uploadArtistCv,
  removeArtistCv,
  searchArtists,
} from '../controllers/artist.controller.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.middleware.js';
import { uploadDocument } from '../utils/documentUpload.js';

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
 * /api/artists/me/following:
 *   get:
 *     summary: Get artists the current user follows
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of followed artists
 */
router.get('/me/following', protect, getFollowingArtists);

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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/me', protect, authorize('ARTIST'), updateArtistProfile);

/**
 * @swagger
 * /api/artists/me/cv:
 *   post:
 *     summary: Upload artist CV
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Remove artist CV
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/me/cv',
  protect,
  authorize('ARTIST'),
  uploadDocument.single('cv'),
  uploadArtistCv
);
router.delete('/me/cv', protect, authorize('ARTIST'), removeArtistCv);

/**
 * @swagger
 * /api/artists:
 *   get:
 *     summary: Search artists
 *     tags: [Artists]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of artists
 */
router.get('/', optionalAuth, searchArtists);

/**
 * @swagger
 * /api/artists/{id}/artworks:
 *   get:
 *     summary: Get artist's artworks
 *     tags: [Artists]
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
 * /api/artists/{id}/follow:
 *   post:
 *     summary: Follow an artist
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Unfollow an artist
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/follow', protect, followArtist);
router.delete('/:id/follow', protect, unfollowArtist);

/**
 * @swagger
 * /api/artists/{id}:
 *   get:
 *     summary: Get artist profile
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artist profile retrieved successfully
 */
router.get('/:id', optionalAuth, getArtistProfile);

export default router;

