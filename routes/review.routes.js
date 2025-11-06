import express from 'express';
import {
  createReview,
  getArtworkReviews,
  deleteReview,
} from '../controllers/review.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/reviews/artwork/{id}:
 *   get:
 *     summary: Get artwork reviews
 *     tags: [Reviews]
 *     description: Get all reviews for an artwork (Public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/artwork/:id', getArtworkReviews);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create or update review
 *     tags: [Reviews]
 *     description: Create a new review or update existing review for an artwork
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artworkId
 *               - rating
 *             properties:
 *               artworkId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       200:
 *         description: Review updated successfully
 */
router.post('/', protect, createReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     description: Delete a review (owner or admin only)
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
 *         description: Review deleted successfully
 *       403:
 *         description: Not authorized to delete this review
 */
router.delete('/:id', protect, deleteReview);

export default router;

