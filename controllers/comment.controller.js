import Comment from '../models/comment.model.js';
import Artwork from '../models/artwork.model.js';
import { createNotification } from '../utils/notificationHelper.js';

// @desc    Get comments for artwork
// @route   GET /api/artworks/:id/comments
// @access  Public
export const getComments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const viewerId = req.user?._id?.toString() || null;

    const comments = await Comment.find({
      artworkId: req.params.id,
      parentCommentId: null,
    })
      .populate('userId', '_id name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formatWithLikes = (doc) => {
      const likes = doc.likes || [];
      const isLiked = viewerId
        ? likes.some((likeId) => likeId?.toString() === viewerId)
        : false;
      const { likes: _ignoredLikes, ...rest } = doc;
      return {
        ...rest,
        likesCount: likes.length,
        isLiked,
      };
    };

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentCommentId: comment._id,
        })
          .populate('userId', '_id name avatar')
          .sort({ createdAt: 1 })
          .limit(5)
          .lean();

        return {
          ...formatWithLikes(comment),
          replies: replies.map((reply) => formatWithLikes(reply)),
        };
      })
    );

    const total = await Comment.countDocuments({
      artworkId: req.params.id,
      parentCommentId: null,
    });

    res.json({
      success: true,
      data: {
        comments: commentsWithReplies,
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

// @desc    Add comment to artwork
// @route   POST /api/artworks/:id/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { content, parentCommentId } = req.body;
    const artworkId = req.params.id;

    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    const comment = await Comment.create({
      artworkId,
      userId: req.user._id,
      content,
      parentCommentId: parentCommentId || null,
    });

    // Update artwork comments count
    await Artwork.findByIdAndUpdate(artworkId, {
      $inc: { commentsCount: 1 },
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'userId',
      'name avatar'
    );

    // Create notification for artist (if not commenting on own artwork)
    if (artwork.artistId.toString() !== req.user._id.toString()) {
      await createNotification(
        artwork.artistId,
        'COMMENT',
        `${req.user.name} commented on your artwork "${artwork.title}"`,
        {
          artworkId,
          commentId: comment._id.toString(),
          userId: req.user._id.toString(),
        }
      );
    }

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (
        parentComment &&
        parentComment.userId.toString() !== req.user._id.toString()
      ) {
        await createNotification(
          parentComment.userId,
          'COMMENT',
          `${req.user.name} replied to your comment`,
          {
            artworkId,
            commentId: comment._id.toString(),
            parentCommentId: parentCommentId.toString(),
            userId: req.user._id.toString(),
          }
        );
      }
    }

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Count total comments to be deleted (parent + all replies)
    const commentsToDelete = await Comment.find({
      $or: [
        { _id: comment._id },
        { parentCommentId: comment._id },
      ],
    });
    const deleteCount = commentsToDelete.length;

    // Delete comment and all replies
    await Comment.deleteMany({
      $or: [
        { _id: comment._id },
        { parentCommentId: comment._id },
      ],
    });

    // Update artwork comments count (decrement by actual count deleted)
    await Artwork.findByIdAndUpdate(comment.artworkId, {
      $inc: { commentsCount: -deleteCount },
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleCommentLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user._id.toString();
    const hasLiked = (comment.likes || []).some(
      (likeId) => likeId.toString() === userId
    );

    if (hasLiked) {
      comment.likes = comment.likes.filter(
        (likeId) => likeId.toString() !== userId
      );
    } else {
      comment.likes = [...(comment.likes || []), req.user._id];
    }

    await comment.save();

    if (!hasLiked && comment.userId.toString() !== userId) {
      await createNotification(
        comment.userId,
        'LIKE',
        `${req.user.name} reacted to your comment`,
        {
          commentId: comment._id.toString(),
          artworkId: comment.artworkId.toString(),
          userId,
        }
      );
    }

    res.json({
      success: true,
      data: {
        isLiked: !hasLiked,
        likesCount: comment.likes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

