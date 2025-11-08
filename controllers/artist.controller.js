import ArtistProfile from '../models/artist.model.js';
import User from '../models/user.model.js';
import Artwork from '../models/artwork.model.js';
import { createNotification } from '../utils/notificationHelper.js';

export const searchArtists = async (req, res, next) => {
  try {
    const searchTerm = (req.query.search || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    const viewerFollowingIds =
      req.user?.following?.map((id) => id.toString()) || [];

    const matchStage = {
      'user.role': 'ARTIST',
    };

    if (searchTerm) {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      matchStage.$or = [
        { 'user.name': regex },
        { bio: regex },
        { location: regex },
      ];
    }

    const artists = await ArtistProfile.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: matchStage },
      {
        $addFields: {
          followerCount: { $size: { $ifNull: ['$followers', []] } },
        },
      },
      {
        $project: {
          _id: 1,
          bio: 1,
          location: 1,
          cv: 1,
          followerCount: 1,
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            avatar: '$user.avatar',
            isVerified: '$user.isVerified',
          },
        },
      },
      { $sort: { followerCount: -1, 'user.name': 1 } },
      { $limit: limit },
    ]);

    const enriched = artists.map((artist) => ({
      ...artist,
      isFollowing: viewerFollowingIds.includes(
        artist.user._id.toString()
      ),
    }));

    res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get artist profile or user profile
// @route   GET /api/artists/:id
// @access  Public
export const getArtistProfile = async (req, res, next) => {
  try {
    const viewer = req.user;
    const userId = req.params.id;

    const user = await User.findById(userId).select(
      '_id name email avatar isVerified role following'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const artistProfile = await ArtistProfile.findOne({
      userId,
    }).populate('userId', 'name email avatar isVerified role');

    const viewerId = viewer?._id?.toString();
    const isOwner = viewerId === userId.toString();
    const viewerFollowingIds = viewer?.following?.map((id) => id.toString()) || [];
    const followingCount = Array.isArray(user.following) ? user.following.length : 0;

    if (artistProfile) {
      // User is an artist - return artist profile with artworks
      const profileObj = artistProfile.toObject();
      const followerIds = profileObj.followers || [];
      const followerCount = followerIds.length;
      const isFollowing = viewerId
        ? followerIds.some((followerId) => followerId.toString() === viewerId)
        : false;

      // Try to find artworks - first with PUBLISHED status, then without status filter
      let artworks = await Artwork.find({ 
        artistId: userId,
        status: 'PUBLISHED'
      })
        .populate('artistId', '_id name avatar isVerified')
        .sort({ createdAt: -1 })
        .limit(12);

      // If no published artworks found, try to get all artworks (including drafts)
      if (artworks.length === 0) {
        artworks = await Artwork.find({ 
          artistId: userId
        })
          .populate('artistId', '_id name avatar isVerified')
          .sort({ createdAt: -1 })
          .limit(12);
      }

      console.log(`Found ${artworks.length} artworks for artist ${userId}`);

      delete profileObj.followers;

      return res.json({
        success: true,
        data: {
          ...profileObj,
          followerCount,
          followingCount,
          isFollowing,
          isOwner,
          cv: profileObj.cv || null,
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
          .populate('artistId', '_id name avatar isVerified')
          .sort({ createdAt: -1 })
          .limit(12)
            .select('title images price currency category verificationStatus')
        : [];

      const isFollowing = viewerFollowingIds.includes(userId.toString());

      return res.json({
        success: true,
        data: {
          userId: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isVerified: user.isVerified,
          },
          bio: '',
          location: '',
          phone: '',
          socialLinks: {},
          totalArtworks: 0,
          artworks: artworks,
          isArtist: false,
          followerCount: 0,
          followingCount,
          isFollowing,
          isOwner,
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
      .populate('userId', 'name email avatar isVerified');

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
        following: Array.isArray(req.user.following) ? req.user.following.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const followArtist = async (req, res, next) => {
  try {
    const artistId = req.params.id;
    const viewerId = req.user._id.toString();

    if (viewerId === artistId) {
      return res.status(400).json({
        success: false,
        message: "You can't follow yourself",
      });
    }

    const artistUser = await User.findById(artistId);
    if (!artistUser || artistUser.role !== 'ARTIST') {
      return res.status(404).json({
        success: false,
        message: 'Artist not found',
      });
    }

    const artistProfile =
      (await ArtistProfile.findOne({ userId: artistId })) ||
      (await ArtistProfile.create({ userId: artistId }));

    const alreadyFollowing = req.user.following?.some(
      (followId) => followId.toString() === artistId
    );

    if (!alreadyFollowing) {
      req.user.following = [...(req.user.following || []), artistId];
      await req.user.save();
    }

    const followerExists = artistProfile.followers?.some(
      (followerId) => followerId.toString() === viewerId
    );

    if (!followerExists) {
      artistProfile.followers = [...(artistProfile.followers || []), req.user._id];
      await artistProfile.save();

      await createNotification(
        artistProfile.userId,
        'FOLLOW',
        `${req.user.name} started following you`,
        {
          followerId: viewerId,
        }
      );
    }

    res.json({
      success: true,
      data: {
        followerCount: artistProfile.followers.length,
        isFollowing: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const unfollowArtist = async (req, res, next) => {
  try {
    const artistId = req.params.id;
    const viewerId = req.user._id.toString();

    const artistProfile = await ArtistProfile.findOne({ userId: artistId });
    if (!artistProfile) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found',
      });
    }

    req.user.following = (req.user.following || []).filter(
      (followId) => followId.toString() !== artistId
    );
    await req.user.save();

    artistProfile.followers = (artistProfile.followers || []).filter(
      (followerId) => followerId.toString() !== viewerId
    );
    await artistProfile.save();

    res.json({
      success: true,
      data: {
        followerCount: artistProfile.followers.length,
        isFollowing: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowingArtists = async (req, res, next) => {
  try {
    const followingIds = req.user.following || [];

    if (!followingIds.length) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const profiles = await ArtistProfile.find({
      userId: { $in: followingIds },
    })
      .populate('userId', 'name avatar isVerified')
      .sort({ updatedAt: -1 });

    const formatted = profiles.map((profile) => ({
      _id: profile._id,
      userId: profile.userId,
      bio: profile.bio,
      location: profile.location,
      followerCount: profile.followers?.length || 0,
      cv: profile.cv || null,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadArtistCv = async (req, res, next) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({
        success: false,
        message: 'CV file is required',
      });
    }

    let artistProfile = await ArtistProfile.findOne({ userId: req.user._id });
    if (!artistProfile) {
      artistProfile = await ArtistProfile.create({ userId: req.user._id });
    }

    artistProfile.cv = {
      url: req.file.path,
      filename: req.file.originalname || null,
      uploadedAt: new Date(),
    };
    await artistProfile.save();

    res.json({
      success: true,
      data: {
        cv: artistProfile.cv,
      },
      message: 'CV uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const removeArtistCv = async (req, res, next) => {
  try {
    const artistProfile = await ArtistProfile.findOne({ userId: req.user._id });

    if (!artistProfile || !artistProfile.cv?.url) {
      return res.status(404).json({
        success: false,
        message: 'CV not found',
      });
    }

    artistProfile.cv = {
      url: null,
      filename: null,
      uploadedAt: null,
    };
    await artistProfile.save();

    res.json({
      success: true,
      message: 'CV removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

