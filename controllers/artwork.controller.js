import Artwork from '../models/artwork.model.js';
import ArtistProfile from '../models/artist.model.js';

// @desc    Get all artworks
// @route   GET /api/artworks
// @access  Public
export const getArtworks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    const query = { status: 'PUBLISHED' };

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.artistId) {
      query.artistId = req.query.artistId;
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sort === 'popular') {
      sort = { likesCount: -1, createdAt: -1 };
    } else if (req.query.sort === 'price-low') {
      sort = { price: 1 };
    } else if (req.query.sort === 'price-high') {
      sort = { price: -1 };
    }

    const artworks = await Artwork.find(query)
      .populate('artistId', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Artwork.countDocuments(query);

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

// @desc    Get single artwork
// @route   GET /api/artworks/:id
// @access  Public
export const getArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate(
      'artistId',
      'name email avatar'
    );

    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    res.json({
      success: true,
      data: artwork,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create artwork
// @route   POST /api/artworks
// @access  Private (Artist only)
export const createArtwork = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      currency,
      dimensions,
      medium,
      year,
      category,
      images,
      status,
    } = req.body;

    const artwork = await Artwork.create({
      artistId: req.user._id,
      title,
      description,
      price,
      currency: currency || 'RWF',
      dimensions,
      medium,
      year,
      category,
      images: images || [],
      status: status || 'PUBLISHED',
    });

    // Update artist profile total artworks
    await ArtistProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { totalArtworks: 1 } }
    );

    const populatedArtwork = await Artwork.findById(artwork._id).populate(
      'artistId',
      'name avatar'
    );

    res.status(201).json({
      success: true,
      data: populatedArtwork,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update artwork
// @route   PUT /api/artworks/:id
// @access  Private (Artist only)
export const updateArtwork = async (req, res, next) => {
  try {
    let artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user owns the artwork
    if (artwork.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this artwork' });
    }

    artwork = await Artwork.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('artistId', 'name avatar');

    res.json({
      success: true,
      data: artwork,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete artwork
// @route   DELETE /api/artworks/:id
// @access  Private (Artist only)
export const deleteArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user owns the artwork
    if (artwork.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this artwork' });
    }

    await artwork.deleteOne();

    // Update artist profile total artworks
    await ArtistProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { totalArtworks: -1 } }
    );

    res.json({
      success: true,
      message: 'Artwork deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

