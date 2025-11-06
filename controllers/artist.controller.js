import ArtistProfile from '../models/artist.model.js';
import User from '../models/user.model.js';
import Artwork from '../models/artwork.model.js';

// @desc    Get artist profile or user profile
// @route   GET /api/artists/:id
// @access  Public
export const getArtistProfile = async (req, res, next) => {
  try {
    // First check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Try to find artist profile
    const artistProfile = await ArtistProfile.findOne({
      userId: req.params.id,
    }).populate('userId', 'name email avatar');

    if (artistProfile) {
      // User is an artist - return artist profile with artworks
      // Try to find artworks - first with PUBLISHED status, then without status filter
      let artworks = await Artwork.find({ 
        artistId: req.params.id,
        status: 'PUBLISHED'
      })
        .populate('artistId', '_id name avatar')
        .sort({ createdAt: -1 })
        .limit(12);

      // If no published artworks found, try to get all artworks (including drafts)
      if (artworks.length === 0) {
        artworks = await Artwork.find({ 
          artistId: req.params.id
        })
          .populate('artistId', '_id name avatar')
          .sort({ createdAt: -1 })
          .limit(12);
      }

      console.log(`Found ${artworks.length} artworks for artist ${req.params.id}`);

      return res.json({
        success: true,
        data: {
          ...artistProfile.toObject(),
          artworks,
          isArtist: true,
        },
      });
    } else {
      // User is not an artist - return basic user info
      // Get artworks they've commented on
      const Comment = (await import('../models/comment.model.js')).default;
      const userComments = await Comment.find({ userId: req.params.id })
        .select('artworkId')
        .limit(12);
      
      const artworkIds = userComments.map(comment => comment.artworkId);
      
      const artworks = artworkIds.length > 0 
        ? await Artwork.find({ 
            _id: { $in: artworkIds },
            status: 'PUBLISHED'
          })
            .populate('artistId', '_id name avatar')
            .sort({ createdAt: -1 })
            .limit(12)
            .select('title images price currency category')
        : [];

      return res.json({
        success: true,
        data: {
          userId: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
          bio: '',
          location: '',
          phone: '',
          socialLinks: {},
          totalArtworks: 0,
          artworks: artworks,
          isArtist: false,
        },
      });
    }
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
      avatar,
    } = req.body;

    let artistProfile = await ArtistProfile.findOne({
      userId: req.user._id,
    });

    // Update user's avatar if provided
    if (avatar) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.avatar = avatar;
        user.profileImage = avatar; // Also update profileImage
        await user.save();
      }
    }

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
      artistProfile.bio = bio !== undefined ? bio : artistProfile.bio;
      artistProfile.location = location !== undefined ? location : artistProfile.location;
      artistProfile.phone = phone !== undefined ? phone : artistProfile.phone;
      artistProfile.bannerImage = bannerImage !== undefined ? bannerImage : artistProfile.bannerImage;

      if (socialLinks) {
        artistProfile.socialLinks = {
          ...artistProfile.socialLinks,
          ...socialLinks,
        };
      }

      await artistProfile.save();
    }

    // Populate user data for response
    const populatedProfile = await ArtistProfile.findById(artistProfile._id)
      .populate('userId', 'name email avatar');

    res.json({
      success: true,
      data: populatedProfile,
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

// @desc    Get artist's artworks by artist ID
// @route   GET /api/artists/:id/artworks
// @access  Public
export const getArtistArtworks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // First try to find published artworks
    let artworks = await Artwork.find({ 
      artistId: req.params.id,
      status: 'PUBLISHED'
    })
      .populate('artistId', '_id name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    let total = await Artwork.countDocuments({ 
      artistId: req.params.id,
      status: 'PUBLISHED'
    });

    // If no published artworks found, try without status filter
    if (artworks.length === 0 && !req.query.status) {
      artworks = await Artwork.find({ 
        artistId: req.params.id
      })
        .populate('artistId', '_id name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      total = await Artwork.countDocuments({ 
        artistId: req.params.id
      });
    }

    console.log(`Found ${artworks.length} artworks for artist ${req.params.id} (page ${page})`);

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
    console.error('Error fetching artist artworks:', error);
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

