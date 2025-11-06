import PageView from '../models/analytics.model.js';
import Artwork from '../models/artwork.model.js';
import Review from '../models/review.model.js';

// @desc    Track page view
// @route   POST /api/analytics/pageview
// @access  Public
export const trackPageView = async (req, res, next) => {
  try {
    const { artworkId, artistId, pageType, referrer, userAgent, ipAddress } = req.body;
    const userId = req.user?._id || null;

    const pageView = await PageView.create({
      artworkId: artworkId || null,
      artistId: artistId || null,
      userId,
      pageType: pageType || 'other',
      referrer,
      userAgent,
      ipAddress: ipAddress || req.ip || null,
    });

    res.status(201).json({
      success: true,
      data: pageView,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get artist analytics
// @route   GET /api/analytics/artist
// @access  Private (Artist only)
export const getArtistAnalytics = async (req, res, next) => {
  try {
    const artistId = req.user._id;
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get page views
    const pageViews = await PageView.find({
      artistId: artistId.toString(),
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

    // Get artworks with view counts
    const artworks = await Artwork.find({ artistId }).select('title images price viewsCount likesCount');
    
    // Get artwork view counts
    const artworkViews = await PageView.aggregate([
      {
        $match: {
          artistId: artistId.toString(),
          artworkId: { $ne: null },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$artworkId',
          views: { $sum: 1 },
        },
      },
      {
        $sort: { views: -1 },
      },
    ]);

    // Get views by page type
    const viewsByPageType = await PageView.aggregate([
      {
        $match: {
          artistId: artistId.toString(),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$pageType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get views by day (last 30 days)
    const viewsByDay = await PageView.aggregate([
      {
        $match: {
          artistId: artistId.toString(),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          views: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get reviews for artworks
    const artworkIds = artworks.map(a => a._id);
    const reviews = await Review.find({
      artworkId: { $in: artworkIds },
    }).populate('userId', 'name avatar');

    // Calculate average rating per artwork
    const artworkRatings = await Review.aggregate([
      {
        $match: {
          artworkId: { $in: artworkIds },
        },
      },
      {
        $group: {
          _id: '$artworkId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // Get total stats
    const totalViews = pageViews.length;
    const totalArtworks = artworks.length;
    const totalReviews = reviews.length;
    const averageRating = artworkRatings.length > 0
      ? artworkRatings.reduce((sum, r) => sum + r.averageRating, 0) / artworkRatings.length
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalViews,
          totalArtworks,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
        },
        artworkViews: artworkViews.map(av => ({
          artworkId: av._id?.toString() || null,
          views: av.views || 0,
        })),
        viewsByPageType: viewsByPageType.map(v => ({
          pageType: v._id || 'other',
          count: v.count || 0,
        })),
        viewsByDay: viewsByDay.map(v => ({
          _id: v._id,
          date: v._id, // Add date field for easier frontend consumption
          views: v.views || 0,
        })),
        topArtworks: artworks
          .map(artwork => {
            const views = artworkViews.find(av => av._id.toString() === artwork._id.toString())?.views || 0;
            const rating = artworkRatings.find(ar => ar._id.toString() === artwork._id.toString());
            return {
              ...artwork.toObject(),
              views,
              averageRating: rating?.averageRating || 0,
              totalReviews: rating?.totalReviews || 0,
            };
          })
          .sort((a, b) => b.views - a.views)
          .slice(0, 10),
        reviews: reviews.slice(0, 20), // Latest 20 reviews
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get artwork analytics
// @route   GET /api/analytics/artwork/:id
// @access  Private (Artist only)
export const getArtworkAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Verify artwork belongs to artist
    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    if (artwork.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get page views for this artwork
    const pageViews = await PageView.find({
      artworkId: id,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

    // Get views by day
    const viewsByDay = await PageView.aggregate([
      {
        $match: {
          artworkId: id.toString(),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          views: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get reviews
    const reviews = await Review.find({ artworkId: id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    // Calculate rating stats
    const ratingStats = await Review.aggregate([
      {
        $match: {
          artworkId: id.toString(),
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    const totalViews = pageViews.length;
    const totalReviews = reviews.length;
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      data: {
        artwork: {
          title: artwork.title,
          views: artwork.viewsCount || 0,
          likes: artwork.likesCount || 0,
        },
        analytics: {
          totalViews,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          viewsByDay,
          ratingDistribution: ratingStats.map(r => ({
            rating: r._id,
            count: r.count,
          })),
        },
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public views count for an artwork
// @route   GET /api/analytics/artwork/:id/views
// @access  Public
export const getArtworkViewsCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify artwork exists
    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Get total page views for this artwork
    const totalViews = await PageView.countDocuments({ artworkId: id });

    res.json({
      success: true,
      data: {
        artworkId: id,
        totalViews,
      },
    });
  } catch (error) {
    next(error);
  }
};

