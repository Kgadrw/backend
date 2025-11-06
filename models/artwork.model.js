import mongoose from 'mongoose';

const artworkSchema = new mongoose.Schema(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    currency: {
      type: String,
      default: 'RWF',
    },
    dimensions: {
      type: String,
      default: '',
    },
    medium: {
      type: String,
      default: '',
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
    category: {
      type: String,
      default: 'General',
    },
    images: [
      {
        type: String,
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['PUBLISHED', 'SOLD', 'DRAFT'],
      default: 'PUBLISHED',
    },
    ownershipDocument: {
      type: String, // URL to ownership document (not visible in profile)
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
artworkSchema.index({ title: 'text', description: 'text' });
artworkSchema.index({ category: 1 });
artworkSchema.index({ artistId: 1 });
artworkSchema.index({ status: 1 });

const Artwork = mongoose.model('Artwork', artworkSchema);

export default Artwork;

