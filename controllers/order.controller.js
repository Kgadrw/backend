import Order from '../models/order.model.js';
import Artwork from '../models/artwork.model.js';
import { createNotification } from '../utils/notificationHelper.js';

// @desc    Create order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const { artworkId, message } = req.body;

    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if artwork is available
    if (artwork.status === 'SOLD') {
      return res.status(400).json({ message: 'Artwork is already sold' });
    }

    // Create order
    const order = await Order.create({
      buyerId: req.user._id,
      artworkId,
      artistId: artwork.artistId,
      amount: artwork.price,
      currency: artwork.currency,
      message: message || '',
      status: 'PENDING',
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('buyerId', 'name email avatar')
      .populate('artworkId', 'title images price')
      .populate('artistId', 'name email avatar');

    // Create notification for artist
    await createNotification(
      artwork.artistId,
      'ORDER',
      `${req.user.name} placed an order for your artwork "${artwork.title}"`,
      {
        orderId: order._id.toString(),
        artworkId,
        buyerId: req.user._id.toString(),
      }
    );

    res.status(201).json({
      success: true,
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders/me
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    const userRole = req.user.role;

    if (userRole === 'ARTIST') {
      // Artists see orders for their artworks
      query.artistId = req.user._id;
    } else {
      // Buyers see their own orders
      query.buyerId = req.user._id;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .populate('buyerId', 'name email avatar')
      .populate('artworkId', 'title images price currency')
      .populate('artistId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

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
// @route   PUT /api/orders/:id/status
// @access  Private (Artist only for their artworks)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the artist
    if (order.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    // If order is confirmed, mark artwork as sold
    if (status === 'CONFIRMED') {
      await Artwork.findByIdAndUpdate(order.artworkId, {
        status: 'SOLD',
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('buyerId', 'name email avatar')
      .populate('artworkId', 'title images price')
      .populate('artistId', 'name email avatar');

    // Create notification for buyer
    await createNotification(
      order.buyerId,
      'ORDER',
      `Your order for "${order.artworkId.title}" has been ${status.toLowerCase()}`,
      {
        orderId: order._id.toString(),
        artworkId: order.artworkId.toString(),
      }
    );

    res.json({
      success: true,
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

