import User from '../models/user.model.js';
import Artwork from '../models/artwork.model.js';
import Order from '../models/order.model.js';
import Like from '../models/like.model.js';
import Comment from '../models/comment.model.js';
import Review from '../models/review.model.js';
import Notification from '../models/notification.model.js';
import PageView from '../models/analytics.model.js';
import Cart from '../models/cart.model.js';
import bcrypt from 'bcryptjs';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalArtists,
      totalBuyers,
      totalArtworks,
      totalOrders,
      totalLikes,
      totalComments,
      totalReviews,
      totalNotifications,
      totalPageViews,
      recentUsers,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'ARTIST' }),
      User.countDocuments({ role: 'BUYER' }),
      Artwork.countDocuments(),
      Order.countDocuments(),
      Like.countDocuments(),
      Comment.countDocuments(),
      Review.countDocuments(),
      Notification.countDocuments(),
      PageView.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('buyerId', 'name email').populate('artworkId', 'title'),
    ]);

    // Calculate revenue
    const completedOrders = await Order.find({ status: 'COMPLETED' });
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.amount, 0);

    // Get pending orders count
    const pendingOrders = await Order.countDocuments({ status: 'PENDING' });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalArtists,
          totalBuyers,
          totalArtworks,
          totalOrders,
          totalLikes,
          totalComments,
          totalReviews,
          totalNotifications,
          totalPageViews,
          totalRevenue,
          pendingOrders,
        },
        recentUsers,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role; // Filter by role
    const search = req.query.search; // Search by name or email
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -token')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        users,
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

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -token');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user activities
    const [artworks, orders, likes, comments, reviews, notifications] = await Promise.all([
      Artwork.find({ artistId: user._id }).select('title price status createdAt'),
      Order.find({ $or: [{ buyerId: user._id }, { artistId: user._id }] })
        .populate('artworkId', 'title')
        .populate('buyerId', 'name email')
        .populate('artistId', 'name email')
        .sort({ createdAt: -1 }),
      Like.find({ userId: user._id }).countDocuments(),
      Comment.find({ userId: user._id }).countDocuments(),
      Review.find({ userId: user._id }).countDocuments(),
      Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      success: true,
      data: {
        user,
        activities: {
          artworks,
          orders,
          likes,
          comments,
          reviews,
          notifications,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (role, verification, etc.)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
export const updateUser = async (req, res, next) => {
  try {
    const { role, isVerified, name, email } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === req.params.id && role && role !== user.role) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    // Update allowed fields
    if (role) user.role = role;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete related data
    await Promise.all([
      Artwork.deleteMany({ artistId: user._id }),
      Order.deleteMany({ $or: [{ buyerId: user._id }, { artistId: user._id }] }),
      Like.deleteMany({ userId: user._id }),
      Comment.deleteMany({ userId: user._id }),
      Review.deleteMany({ userId: user._id }),
      Notification.deleteMany({ userId: user._id }),
      Cart.deleteMany({ userId: user._id }),
    ]);

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all artworks with filters
// @route   GET /api/admin/artworks
// @access  Private (Admin only)
export const getAllArtworks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [artworks, total] = await Promise.all([
      Artwork.find(query)
        .populate('artistId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Artwork.countDocuments(query),
    ]);

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

// @desc    Update artwork status
// @route   PUT /api/admin/artworks/:id
// @access  Private (Admin only)
export const updateArtwork = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found',
      });
    }

    if (status) artwork.status = status;

    await artwork.save();

    res.json({
      success: true,
      data: { artwork },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete artwork
// @route   DELETE /api/admin/artworks/:id
// @access  Private (Admin only)
export const deleteArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found',
      });
    }

    // Delete related data
    await Promise.all([
      Like.deleteMany({ artworkId: artwork._id }),
      Comment.deleteMany({ artworkId: artwork._id }),
      Review.deleteMany({ artworkId: artwork._id }),
      Order.deleteMany({ artworkId: artwork._id }),
      Cart.deleteMany({ 'items.artworkId': artwork._id }),
    ]);

    await Artwork.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Artwork deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin only)
export const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('buyerId', 'name email')
        .populate('artistId', 'name email')
        .populate('artworkId', 'title images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        orders,
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

// @desc    Update order status
// @route   PUT /api/admin/orders/:id
// @access  Private (Admin only)
export const updateOrder = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (status) order.status = status;

    await order.save();

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all activities (comprehensive activity log)
// @route   GET /api/admin/activities
// @access  Private (Admin only)
export const getAllActivities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // 'user', 'artwork', 'order', 'like', 'comment', 'review'
    const skip = (page - 1) * limit;

    let activities = [];
    let total = 0;

    switch (type) {
      case 'user':
        activities = await User.find()
          .select('name email role createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        total = await User.countDocuments();
        activities = activities.map(user => ({
          type: 'USER_CREATED',
          user: user.name,
          email: user.email,
          role: user.role,
          timestamp: user.createdAt,
        }));
        break;

      case 'artwork':
        activities = await Artwork.find()
          .populate('artistId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        total = await Artwork.countDocuments();
        activities = activities.map(artwork => ({
          type: 'ARTWORK_CREATED',
          artwork: artwork.title,
          artist: artwork.artistId?.name,
          status: artwork.status,
          timestamp: artwork.createdAt,
        }));
        break;

      case 'order':
        activities = await Order.find()
          .populate('buyerId', 'name email')
          .populate('artworkId', 'title')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        total = await Order.countDocuments();
        activities = activities.map(order => ({
          type: 'ORDER_CREATED',
          buyer: order.buyerId?.name,
          artwork: order.artworkId?.title,
          amount: order.amount,
          status: order.status,
          timestamp: order.createdAt,
        }));
        break;

      case 'like':
        activities = await Like.find()
          .populate('userId', 'name email')
          .populate('artworkId', 'title')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        total = await Like.countDocuments();
        activities = activities.map(like => ({
          type: 'LIKE',
          user: like.userId?.name,
          artwork: like.artworkId?.title,
          timestamp: like.createdAt,
        }));
        break;

      case 'comment':
        activities = await Comment.find()
          .populate('userId', 'name email')
          .populate('artworkId', 'title')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        total = await Comment.countDocuments();
        activities = activities.map(comment => ({
          type: 'COMMENT',
          user: comment.userId?.name,
          artwork: comment.artworkId?.title,
          content: comment.content.substring(0, 50),
          timestamp: comment.createdAt,
        }));
        break;

      case 'review':
        activities = await Review.find()
          .populate('userId', 'name email')
          .populate('artworkId', 'title')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        total = await Review.countDocuments();
        activities = activities.map(review => ({
          type: 'REVIEW',
          user: review.userId?.name,
          artwork: review.artworkId?.title,
          rating: review.rating,
          timestamp: review.createdAt,
        }));
        break;

      default:
        // Get all activities mixed
        const [users, artworks, orders, likes, comments, reviews] = await Promise.all([
          User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(5),
          Artwork.find().populate('artistId', 'name').sort({ createdAt: -1 }).limit(5),
          Order.find().populate('buyerId', 'name').populate('artworkId', 'title').sort({ createdAt: -1 }).limit(5),
          Like.find().populate('userId', 'name').populate('artworkId', 'title').sort({ createdAt: -1 }).limit(5),
          Comment.find().populate('userId', 'name').populate('artworkId', 'title').sort({ createdAt: -1 }).limit(5),
          Review.find().populate('userId', 'name').populate('artworkId', 'title').sort({ createdAt: -1 }).limit(5),
        ]);

        activities = [
          ...users.map(u => ({ type: 'USER_CREATED', user: u.name, email: u.email, role: u.role, timestamp: u.createdAt })),
          ...artworks.map(a => ({ type: 'ARTWORK_CREATED', artwork: a.title, artist: a.artistId?.name, timestamp: a.createdAt })),
          ...orders.map(o => ({ type: 'ORDER_CREATED', buyer: o.buyerId?.name, artwork: o.artworkId?.title, amount: o.amount, timestamp: o.createdAt })),
          ...likes.map(l => ({ type: 'LIKE', user: l.userId?.name, artwork: l.artworkId?.title, timestamp: l.createdAt })),
          ...comments.map(c => ({ type: 'COMMENT', user: c.userId?.name, artwork: c.artworkId?.title, timestamp: c.createdAt })),
          ...reviews.map(r => ({ type: 'REVIEW', user: r.userId?.name, artwork: r.artworkId?.title, rating: r.rating, timestamp: r.createdAt })),
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
        total = activities.length;
    }

    res.json({
      success: true,
      data: {
        activities,
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

// @desc    Get current admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
export const getAdminProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -token');
    
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin profile (name, email)
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
export const updateAdminProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) {
      user.name = name.trim();
    }

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          avatar: user.avatar,
        },
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private (Admin only)
export const changeAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword.trim(), user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword.trim();
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

