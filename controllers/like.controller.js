import Like from '../models/like.model.js';
import Artwork from '../models/artwork.model.js';
import { createNotification } from '../utils/notificationHelper.js';

// @desc    Toggle like on artwork
// @route   POST /api/artworks/:id/like
// @access  Private
export const toggleLike = async (req, res, next) => {
  try {
    const artworkId = req.params.id;
    const userId = req.user._id;

    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if like already exists
    const existingLike = await Like.findOne({ artworkId, userId });

    if (existingLike) {
      // Unlike - remove like
      await existingLike.deleteOne();
      await Artwork.findByIdAndUpdate(artworkId, {
        $inc: { likesCount: -1 },
      });

      res.json({
        success: true,
        data: {
          liked: false,
          likesCount: artwork.likesCount - 1,
        },
      });
    } else {
      // Like - create like
      await Like.create({ artworkId, userId });
      await Artwork.findByIdAndUpdate(artworkId, {
        $inc: { likesCount: 1 },
      });

      // Create notification for artist (if not liking own artwork)
      if (artwork.artistId.toString() !== userId.toString()) {
        await createNotification(
          artwork.artistId,
          'LIKE',
          `${req.user.name} liked your artwork "${artwork.title}"`,
          { artworkId, userId: userId.toString() }
        );
      }

      const updatedArtwork = await Artwork.findById(artworkId);

      res.json({
        success: true,
        data: {
          liked: true,
          likesCount: updatedArtwork.likesCount,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Check if user liked artwork
// @route   GET /api/artworks/:id/like
// @access  Private
export const checkLike = async (req, res, next) => {
  try {
    const artworkId = req.params.id;
    const userId = req.user._id;

    const like = await Like.findOne({ artworkId, userId });

    res.json({
      success: true,
      data: {
        liked: !!like,
      },
    });
  } catch (error) {
    next(error);
  }
};

