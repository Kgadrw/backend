import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
commentSchema.index({ artworkId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

