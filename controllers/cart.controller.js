import Cart from '../models/cart.model.js';
import Artwork from '../models/artwork.model.js';
import mongoose from 'mongoose';

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    // Mongoose will handle ObjectId conversion automatically
    let cart = await Cart.findOne({ userId });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Populate cart items safely
    if (cart.items && cart.items.length > 0) {
      try {
        await cart.populate({
          path: 'items.artworkId',
          select: 'title images price currency category artistId',
          populate: {
            path: 'artistId',
            select: 'name avatar',
          },
        });

        // Filter out items where artwork was deleted or doesn't exist
        const originalLength = cart.items.length;
        const invalidItemIds = [];
        
        cart.items.forEach((item, index) => {
          if (!item.artworkId || item.artworkId === null) {
            invalidItemIds.push(item._id);
          }
        });
        
        // Only update if we found invalid items
        if (invalidItemIds.length > 0) {
          // Remove invalid items using pull
          for (const itemId of invalidItemIds) {
            cart.items.pull(itemId);
          }
          
          await cart.save();
          
          // Re-populate after save
          if (cart.items.length > 0) {
            await cart.populate({
              path: 'items.artworkId',
              select: 'title images price currency category artistId',
              populate: {
                path: 'artistId',
                select: 'name avatar',
              },
            });
          }
        }
      } catch (populateError) {
        console.error('Error populating cart items:', populateError);
        // If populate fails completely, return empty items
        cart.items = [];
      }
    }

    // Ensure cart data is properly formatted
    const cartData = cart.toObject ? cart.toObject() : cart;
    
    res.json({
      success: true,
      data: cartData,
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    console.error('Error stack:', error.stack);
    console.error('User ID:', req.user?._id);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
    });
    
    // Return a more specific error response
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cart',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
export const addItemToCart = async (req, res, next) => {
  try {
    const { artworkId, quantity = 1 } = req.body;
    const userId = req.user._id;

    if (!artworkId) {
      return res.status(400).json({ message: 'Artwork ID is required' });
    }

    // Verify artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user is the artist (artists can't add their own artwork to cart)
    if (artwork.artistId.toString() === userId.toString()) {
      return res.status(403).json({ 
        message: 'You cannot add your own artwork to cart' 
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Check if artwork is already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.artworkId.toString() === artworkId.toString()
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        artworkId,
        quantity,
      });
    }

    await cart.save();

    // Populate artwork data
    await cart.populate({
      path: 'items.artworkId',
      select: 'title images price currency category artistId',
      populate: {
        path: 'artistId',
        select: 'name avatar',
      },
    });

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:itemId
// @access  Private
export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    item.quantity = quantity;
    await cart.save();

    // Populate artwork data
    await cart.populate({
      path: 'items.artworkId',
      select: 'title images price currency category artistId',
      populate: {
        path: 'artistId',
        select: 'name avatar',
      },
    });

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
export const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    cart.items.pull(itemId);
    await cart.save();

    // Populate artwork data
    await cart.populate({
      path: 'items.artworkId',
      select: 'title images price currency category artistId',
      populate: {
        path: 'artistId',
        select: 'name avatar',
      },
    });

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync localStorage cart with database
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = async (req, res, next) => {
  try {
    const { items } = req.body; // items from localStorage
    const userId = req.user._id;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be an array' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Sync items: add new items, update quantities for existing ones
    for (const localItem of items) {
      const artworkId = localItem.id || localItem.artworkId;
      
      if (!artworkId) continue;

      // Verify artwork exists
      const artwork = await Artwork.findById(artworkId);
      if (!artwork) continue;

      // Skip if user is the artist
      if (artwork.artistId.toString() === userId.toString()) continue;

      const existingItemIndex = cart.items.findIndex(
        (item) => item.artworkId.toString() === artworkId.toString()
      );

      if (existingItemIndex !== -1) {
        // Update quantity (use max of local and db quantity)
        cart.items[existingItemIndex].quantity = Math.max(
          cart.items[existingItemIndex].quantity,
          localItem.quantity || 1
        );
      } else {
        // Add new item
        cart.items.push({
          artworkId,
          quantity: localItem.quantity || 1,
        });
      }
    }

    await cart.save();

    // Populate artwork data
    await cart.populate({
      path: 'items.artworkId',
      select: 'title images price currency category artistId',
      populate: {
        path: 'artistId',
        select: 'name avatar',
      },
    });

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

