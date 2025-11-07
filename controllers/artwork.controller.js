import Artwork from '../models/artwork.model.js';
import ArtistProfile from '../models/artist.model.js';
import Newsletter from '../models/newsletter.model.js';
import { sendNewArtworkEmail } from '../utils/emailService.js';

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
      const searchTerm = req.query.search.trim();
      if (searchTerm) {
        // Escape special regex characters
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Use regex for flexible search on title and description only (artworks only)
        // Case-insensitive search that matches title or description
        query.$or = [
          { title: { $regex: escapedSearchTerm, $options: 'i' } },
          { description: { $regex: escapedSearchTerm, $options: 'i' } }
        ];
      }
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
      .populate('artistId', '_id name avatar isVerified')
      .select('-ownershipDocument') // Exclude ownership document from public listings
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
      'name email avatar isVerified'
    );

    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Convert to object
    const artworkObj = artwork.toObject();
    
    // Only include ownershipDocument if user is the owner or admin
    const isOwner = req.user && artwork.artistId._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      delete artworkObj.ownershipDocument;
    }

    res.json({
      success: true,
      data: artworkObj,
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

    // Send email notifications to newsletter subscribers (async, don't wait)
    if (populatedArtwork.status === 'PUBLISHED') {
      console.log('📧 Starting email notification process for new artwork...');
      Newsletter.find({ isActive: true })
        .then((subscribers) => {
          console.log(`📧 Found ${subscribers.length} active subscribers`);
          if (subscribers.length === 0) {
            console.log('⚠️ No active subscribers found. Skipping email notifications.');
            return;
          }

          const artistName = populatedArtwork.artistId?.name || 'Our Artist';
          let emailPromises = [];
          
          subscribers.forEach((subscriber) => {
            const emailPromise = sendNewArtworkEmail(
              subscriber.email,
              populatedArtwork,
              artistName
            ).then(() => {
              console.log(`✅ Email sent successfully to ${subscriber.email}`);
            }).catch((error) => {
              console.error(`❌ Error sending email to ${subscriber.email}:`, error.message || error);
              if (error.code === 'EAUTH') {
                console.error('   → Authentication failed. Check EMAIL_PASSWORD in .env file.');
              } else if (error.code === 'ECONNECTION') {
                console.error('   → Connection failed. Check internet connection.');
              }
            });
            emailPromises.push(emailPromise);
          });

          // Wait for all emails to be sent (but don't block the response)
          Promise.allSettled(emailPromises).then((results) => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`📧 Email notification summary: ${successful} sent, ${failed} failed`);
          });
        })
        .catch((error) => {
          console.error('❌ Error fetching newsletter subscribers:', error.message || error);
        });
    } else {
      console.log(`⚠️ Artwork status is "${populatedArtwork.status}", not PUBLISHED. Skipping email notifications.`);
    }

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

    const protectedFields = ['verificationStatus', 'verificationNotes', 'verifiedAt', 'verifiedBy', 'ownershipDocument'];
    protectedFields.forEach((field) => {
      if (field in req.body) {
        delete req.body[field];
      }
    });

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

