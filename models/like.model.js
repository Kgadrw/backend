import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// Unique index to prevent duplicate likes
likeSchema.index({ artworkId: 1, userId: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);

export default Like;

