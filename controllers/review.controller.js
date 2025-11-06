import Review from '../models/review.model.js';
import Artwork from '../models/artwork.model.js';
import mongoose from 'mongoose';

// @desc    Create or update review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const { artworkId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!artworkId || !rating) {
      return res.status(400).json({ message: 'Artwork ID and rating are required' });
    }

    // Verify artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if review already exists
    let review = await Review.findOne({ artworkId, userId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment || '';
      await review.save();
    } else {
      // Create new review
      review = await Review.create({
        artworkId,
        userId,
        rating,
        comment: comment || '',
      });
    }

    // Populate user data
    await review.populate('userId', 'name avatar');

    res.status(review.isNew ? 201 : 200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for an artwork
// @route   GET /api/reviews/artwork/:id
// @access  Public
export const getArtworkReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Convert id to ObjectId for proper matching
    let artworkId;
    try {
      artworkId = new mongoose.Types.ObjectId(id);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid artwork ID format' 
      });
    }

    // Find reviews for this artwork
    const reviews = await Review.find({ artworkId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Count total reviews for this artwork (using ObjectId for accurate count)
    const total = await Review.countDocuments({ artworkId });
    
    console.log(`[Reviews] Artwork ${id}: Found ${total} total reviews`);

    // Calculate average rating (using ObjectId for matching)
    const ratingStats = await Review.aggregate([
      {
        $match: { artworkId: artworkId },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        stats: ratingStats[0] || {
          averageRating: 0,
          totalReviews: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns the review or is admin
    if (review.userId.toString() !== userId.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Review.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

