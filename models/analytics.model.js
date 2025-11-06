import mongoose from 'mongoose';

const pageViewSchema = new mongoose.Schema(
  {
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      required: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for anonymous users
    },
    pageType: {
      type: String,
      enum: ['artwork', 'artist', 'products', 'home', 'other'],
      default: 'artwork',
    },
    referrer: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
pageViewSchema.index({ artworkId: 1, createdAt: -1 });
pageViewSchema.index({ artistId: 1, createdAt: -1 });
pageViewSchema.index({ createdAt: -1 });
pageViewSchema.index({ pageType: 1, createdAt: -1 });

const PageView = mongoose.model('PageView', pageViewSchema);

export default PageView;

