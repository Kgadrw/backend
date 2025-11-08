import Exhibition from '../models/exhibition.model.js';

// @desc    Public - list approved exhibitions
// @route   GET /api/exhibitions
// @access  Public
export const getApprovedExhibitions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 9;
    const skip = (page - 1) * limit;

    const query = { status: 'APPROVED', isPublished: true };

    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      if (searchTerm) {
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
          { title: { $regex: escapedSearchTerm, $options: 'i' } },
          { description: { $regex: escapedSearchTerm, $options: 'i' } },
          { location: { $regex: escapedSearchTerm, $options: 'i' } },
        ];
      }
    }

    if (req.query.artistId) {
      query.artistId = req.query.artistId;
    }

    if (req.query.isPromoted === 'true') {
      query['promotion.isPromoted'] = true;
    }

    const [exhibitions, total] = await Promise.all([
      Exhibition.find(query)
        .populate('artistId', 'name avatar isVerified')
        .sort({ promotion: -1, startDate: 1 })
        .skip(skip)
        .limit(limit),
      Exhibition.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        exhibitions,
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

// @desc    Public - get single exhibition
// @route   GET /api/exhibitions/:id
// @access  Public
export const getExhibitionById = async (req, res, next) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id).populate(
      'artistId',
      'name avatar isVerified bio'
    );

    if (!exhibition) {
      return res.status(404).json({
        success: false,
        message: 'Exhibition not found',
      });
    }

    const isOwner =
      req.user && exhibition.artistId?._id?.toString() === req.user._id?.toString();
    const isAdmin = req.user && req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin && exhibition.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this exhibition',
      });
    }

    res.json({
      success: true,
      data: exhibition,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Artist - create exhibition
// @route   POST /api/exhibitions
// @access  Private (Artist)
export const createExhibition = async (req, res, next) => {
  try {
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      coverImage,
      galleryImages,
      submissionNotes,
      status,
    } = req.body;

    const exhibition = await Exhibition.create({
      artistId: req.user._id,
      title,
      description,
      location,
      startDate,
      endDate,
      coverImage: coverImage || null,
      galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
      submissionNotes: submissionNotes || null,
      status: status === 'DRAFT' ? 'DRAFT' : 'PENDING',
    });

    const populated = await Exhibition.findById(exhibition._id).populate(
      'artistId',
      'name avatar isVerified'
    );

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Artist - update exhibition
// @route   PUT /api/exhibitions/:id
// @access  Private (Artist owner)
export const updateExhibition = async (req, res, next) => {
  try {
    let exhibition = await Exhibition.findById(req.params.id);

    if (!exhibition) {
      return res.status(404).json({
        success: false,
        message: 'Exhibition not found',
      });
    }

    if (exhibition.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this exhibition',
      });
    }

    if (exhibition.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Approved exhibitions cannot be edited. Please contact support.',
      });
    }

    const allowedFields = [
      'title',
      'description',
      'location',
      'startDate',
      'endDate',
      'coverImage',
      'galleryImages',
      'submissionNotes',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (field in req.body) {
        if (field === 'status') {
          exhibition.status = req.body.status === 'DRAFT' ? 'DRAFT' : 'PENDING';
        } else if (field === 'galleryImages' && Array.isArray(req.body.galleryImages)) {
          exhibition.galleryImages = req.body.galleryImages;
        } else {
          exhibition[field] = req.body[field];
        }
      }
    });

    exhibition.adminReview = {
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
    };
    exhibition.promotion = {
      isPromoted: false,
      promotedAt: null,
      promotionNotes: null,
    };

    exhibition = await exhibition.save();
    await exhibition.populate('artistId', 'name avatar isVerified');

    res.json({
      success: true,
      data: exhibition,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Artist - delete exhibition
// @route   DELETE /api/exhibitions/:id
// @access  Private (Artist owner)
export const deleteExhibition = async (req, res, next) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);

    if (!exhibition) {
      return res.status(404).json({
        success: false,
        message: 'Exhibition not found',
      });
    }

    if (exhibition.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this exhibition',
      });
    }

    await exhibition.deleteOne();

    res.json({
      success: true,
      message: 'Exhibition deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Artist - get own exhibitions
// @route   GET /api/exhibitions/me
// @access  Private (Artist)
export const getMyExhibitions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = { artistId: req.user._id };
    if (status) {
      query.status = status;
    }

    const [exhibitions, total] = await Promise.all([
      Exhibition.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Exhibition.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        exhibitions,
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

// @desc    Admin - list exhibitions
// @route   GET /api/admin/exhibitions
// @access  Private (Admin)
export const adminGetExhibitions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;
    const { status, artistId, isPromoted } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (artistId) {
      query.artistId = artistId;
    }

    if (isPromoted === 'true') {
      query['promotion.isPromoted'] = true;
    }

    const [exhibitions, total] = await Promise.all([
      Exhibition.find(query)
        .populate('artistId', 'name email avatar')
        .populate('adminReview.reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Exhibition.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        exhibitions,
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

// @desc    Admin - review exhibition
// @route   PUT /api/admin/exhibitions/:id/review
// @access  Private (Admin)
export const adminReviewExhibition = async (req, res, next) => {
  try {
    const { action, reviewNotes } = req.body;
    const allowedActions = ['APPROVE', 'REJECT'];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review action. Allowed actions are APPROVE or REJECT.',
      });
    }

    const exhibition = await Exhibition.findById(req.params.id);

    if (!exhibition) {
      return res.status(404).json({
        success: false,
        message: 'Exhibition not found',
      });
    }

    exhibition.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    exhibition.adminReview = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes?.trim() || null,
    };

    if (action === 'REJECT') {
      exhibition.promotion = {
        isPromoted: false,
        promotedAt: null,
        promotionNotes: null,
      };
    }

    await exhibition.save();
    await exhibition.populate('artistId', 'name email avatar');
    await exhibition.populate('adminReview.reviewedBy', 'name email');

    res.json({
      success: true,
      message: `Exhibition ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
      data: exhibition,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin - toggle promotion
// @route   PUT /api/admin/exhibitions/:id/promotion
// @access  Private (Admin)
export const adminToggleExhibitionPromotion = async (req, res, next) => {
  try {
    const { enable, promotionNotes } = req.body;

    if (typeof enable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Promotion enable flag must be provided',
      });
    }

    const exhibition = await Exhibition.findById(req.params.id);

    if (!exhibition) {
      return res.status(404).json({
        success: false,
        message: 'Exhibition not found',
      });
    }

    if (exhibition.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Only approved exhibitions can be promoted',
      });
    }

    exhibition.promotion.isPromoted = enable;
    exhibition.promotion.promotedAt = enable ? new Date() : null;
    exhibition.promotion.promotionNotes = promotionNotes?.trim() || null;

    await exhibition.save();
    await exhibition.populate('artistId', 'name email avatar');

    res.json({
      success: true,
      message: enable ? 'Exhibition promotion enabled' : 'Exhibition promotion disabled',
      data: exhibition,
    });
  } catch (error) {
    next(error);
  }
};


