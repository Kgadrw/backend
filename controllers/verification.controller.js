import VerificationRequest from '../models/verification.model.js';
import User from '../models/user.model.js';

// @desc    Submit verification request
// @route   POST /api/verification/request
// @access  Private (Artist only)
export const submitVerificationRequest = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if user is an artist
    if (req.user.role !== 'ARTIST') {
      return res.status(403).json({
        success: false,
        message: 'Only artists can submit verification requests',
      });
    }

    // Check if user already has a verification request
    const existingRequest = await VerificationRequest.findOne({ userId });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending verification request',
        });
      }
      if (existingRequest.status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'You are already verified',
        });
      }
    }

    const { idDocument, license, otherDocuments } = req.body;

    // Validate required documents
    if (!idDocument) {
      return res.status(400).json({
        success: false,
        message: 'ID document is required',
      });
    }

    let verificationRequest;
    if (existingRequest && existingRequest.status === 'REJECTED') {
      // Update existing rejected request
      existingRequest.status = 'PENDING';
      existingRequest.documents.idDocument = idDocument;
      existingRequest.documents.license = license || null;
      existingRequest.documents.otherDocuments = otherDocuments || [];
      existingRequest.submittedAt = new Date();
      existingRequest.reviewedAt = null;
      existingRequest.reviewedBy = null;
      existingRequest.rejectionReason = null;
      existingRequest.notes = null;
      verificationRequest = await existingRequest.save();
    } else {
      // Create new request
      verificationRequest = await VerificationRequest.create({
        userId,
        documents: {
          idDocument,
          license: license || null,
          otherDocuments: otherDocuments || [],
        },
      });
    }

    res.status(201).json({
      success: true,
      data: { verificationRequest },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get verification request status
// @route   GET /api/verification/status
// @access  Private (Artist only)
export const getVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const verificationRequest = await VerificationRequest.findOne({ userId })
      .populate('reviewedBy', 'name email');

    if (!verificationRequest) {
      return res.json({
        success: true,
        data: {
          hasRequest: false,
          status: null,
        },
      });
    }

    // Populate admin comments
    await verificationRequest.populate('adminComments.commentedBy', 'name email');

    res.json({
      success: true,
      data: {
        hasRequest: true,
        verificationRequest: {
          status: verificationRequest.status,
          submittedAt: verificationRequest.submittedAt,
          reviewedAt: verificationRequest.reviewedAt,
          reviewedBy: verificationRequest.reviewedBy,
          rejectionReason: verificationRequest.rejectionReason,
          notes: verificationRequest.notes,
          adminComments: verificationRequest.adminComments || [],
          documents: verificationRequest.documents,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all verification requests (Admin only)
// @route   GET /api/admin/verification-requests
// @access  Private (Admin only)
export const getAllVerificationRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const [requests, total] = await Promise.all([
      VerificationRequest.find(query)
        .populate('userId', 'name email role avatar')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      VerificationRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        requests,
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

// @desc    Get single verification request (Admin only)
// @route   GET /api/admin/verification-requests/:id
// @access  Private (Admin only)
export const getVerificationRequest = async (req, res, next) => {
  try {
    const request = await VerificationRequest.findById(req.params.id)
      .populate('userId', 'name email role avatar createdAt')
      .populate('reviewedBy', 'name email')
      .populate('adminComments.commentedBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found',
      });
    }

    res.json({
      success: true,
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve verification request (Admin only)
// @route   PUT /api/admin/verification-requests/:id/approve
// @access  Private (Admin only)
export const approveVerificationRequest = async (req, res, next) => {
  try {
    const request = await VerificationRequest.findById(req.params.id)
      .populate('userId');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be approved',
      });
    }

    // Update request status
    request.status = 'APPROVED';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    request.notes = req.body.notes || null;
    await request.save();

    // Update user verification status
    const user = await User.findById(request.userId._id);
    if (user) {
      user.isVerified = true;
      await user.save();
    }

    res.json({
      success: true,
      data: { request },
      message: 'Verification request approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject verification request (Admin only)
// @route   PUT /api/admin/verification-requests/:id/reject
// @access  Private (Admin only)
export const rejectVerificationRequest = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const request = await VerificationRequest.findById(req.params.id)
      .populate('userId');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be rejected',
      });
    }

    // Update request status
    request.status = 'REJECTED';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    request.rejectionReason = rejectionReason;
    request.notes = req.body.notes || null;
    await request.save();

    // Update user verification status
    const user = await User.findById(request.userId._id);
    if (user) {
      user.isVerified = false;
      await user.save();
    }

    res.json({
      success: true,
      data: { request },
      message: 'Verification request rejected',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add admin comment to verification request
// @route   POST /api/admin/verification-requests/:id/comments
// @access  Private (Admin only)
export const addAdminComment = async (req, res, next) => {
  try {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required',
      });
    }

    const request = await VerificationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found',
      });
    }

    // Add comment
    request.adminComments.push({
      comment: comment.trim(),
      commentedBy: req.user._id,
      commentedAt: new Date(),
    });

    await request.save();

    // Populate the new comment
    await request.populate('adminComments.commentedBy', 'name email');

    res.json({
      success: true,
      data: {
        comment: request.adminComments[request.adminComments.length - 1],
      },
      message: 'Comment added successfully',
    });
  } catch (error) {
    next(error);
  }
};

