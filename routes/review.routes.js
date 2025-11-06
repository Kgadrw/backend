import express from 'express';
import {
  createReview,
  getArtworkReviews,
  deleteReview,
} from '../controllers/review.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public route
router.get('/artwork/:id', getArtworkReviews);

// Protected routes
router.post('/', protect, createReview);
router.delete('/:id', protect, deleteReview);

export default router;

