import express from 'express';
import {
  getArtistProfile,
  updateArtistProfile,
  getMyArtworks,
  getArtistStats,
} from '../controllers/artist.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/:id', getArtistProfile);
router.get('/me/artworks', protect, authorize('ARTIST'), getMyArtworks);
router.get('/me/stats', protect, authorize('ARTIST'), getArtistStats);
router.put('/me', protect, authorize('ARTIST'), updateArtistProfile);

export default router;

