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

// Put more specific routes first to avoid conflicts
router.get('/me/artworks', protect, authorize('ARTIST'), getMyArtworks);
router.get('/me/stats', protect, authorize('ARTIST'), getArtistStats);
router.put('/me', protect, authorize('ARTIST'), updateArtistProfile);
// Route for getting artworks by artist ID - must come before /:id route
router.get('/:id/artworks', (req, res, next) => {
  console.log(`📦 GET /api/artists/${req.params.id}/artworks`);
  getArtistArtworks(req, res, next);
});
router.get('/:id', getArtistProfile);

export default router;

