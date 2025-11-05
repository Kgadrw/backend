import express from 'express';
import {
  getArtworks,
  getArtwork,
  createArtwork,
  updateArtwork,
  deleteArtwork,
} from '../controllers/artwork.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { upload } from '../utils/cloudinary.js';
import Artwork from '../models/artwork.model.js';

const router = express.Router();

router.get('/', getArtworks);
router.get('/:id', getArtwork);
router.post('/', protect, authorize('ARTIST'), createArtwork);
router.put('/:id', protect, authorize('ARTIST'), updateArtwork);
router.delete('/:id', protect, authorize('ARTIST'), deleteArtwork);

// Image upload route (optional - can be handled in frontend)
router.post('/:id/upload', protect, authorize('ARTIST'), upload.array('images', 5), async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    const imageUrls = req.files.map(file => file.path);
    artwork.images = [...artwork.images, ...imageUrls];
    await artwork.save();

    res.json({
      success: true,
      data: artwork,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

