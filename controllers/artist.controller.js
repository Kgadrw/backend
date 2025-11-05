import ArtistProfile from '../models/artist.model.js';
import User from '../models/user.model.js';
import Artwork from '../models/artwork.model.js';

// @desc    Get artist profile
// @route   GET /api/artists/:id
// @access  Public
export const getArtistProfile = async (req, res, next) => {
  try {
    const artistProfile = await ArtistProfile.findOne({
      userId: req.params.id,
    }).populate('userId', 'name email avatar');

    if (!artistProfile) {
      return res.status(404).json({ message: 'Artist profile not found' });
    }

    res.json({
      success: true,
      data: artistProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update artist profile
// @route   PUT /api/artists/me
// @access  Private (Artist only)
export const updateArtistProfile = async (req, res, next) => {
  try {
    const {
      bio,
      location,
      phone,
      socialLinks,
      bannerImage,
    } = req.body;

    let artistProfile = await ArtistProfile.findOne({
      userId: req.user._id,
    });

    if (!artistProfile) {
      // Create profile if it doesn't exist
      artistProfile = await ArtistProfile.create({
        userId: req.user._id,
        bio,
        location,
        phone,
        socialLinks,
        bannerImage,
      });
    } else {
      // Update existing profile
      artistProfile.bio = bio || artistProfile.bio;
      artistProfile.location = location || artistProfile.location;
      artistProfile.phone = phone || artistProfile.phone;
      artistProfile.bannerImage = bannerImage || artistProfile.bannerImage;

      if (socialLinks) {
        artistProfile.socialLinks = {
          ...artistProfile.socialLinks,
          ...socialLinks,
        };
      }

      await artistProfile.save();
    }

    res.json({
      success: true,
      data: artistProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get artist's artworks
// @route   GET /api/artists/me/artworks
// @access  Private (Artist only)
export const getMyArtworks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const artworks = await Artwork.find({ artistId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Artwork.countDocuments({ artistId: req.user._id });

    res.json({
      success: true,
      data: {
        artworks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get artist stats
// @route   GET /api/artists/me/stats
// @access  Private (Artist only)
export const getArtistStats = async (req, res, next) => {
  try {
    const stats = await Artwork.aggregate([
      { $match: { artistId: req.user._id } },
      {
        $group: {
          _id: '$artistId',
          totalLikes: { $sum: '$likesCount' },
          totalArtworks: { $sum: 1 },
          totalComments: { $sum: '$commentsCount' },
          totalViews: { $sum: 0 }, // Add views if needed
        },
      },
    ]);

    const artistProfile = await ArtistProfile.findOne({
      userId: req.user._id,
    });

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalLikes: 0,
          totalArtworks: 0,
          totalComments: 0,
        },
        followers: artistProfile?.followers?.length || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

