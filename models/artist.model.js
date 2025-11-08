import mongoose from 'mongoose';

const artistProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    socialLinks: {
      website: {
        type: String,
        default: '',
      },
      instagram: {
        type: String,
        default: '',
      },
      facebook: {
        type: String,
        default: '',
      },
      twitter: {
        type: String,
        default: '',
      },
    },
    bannerImage: {
      type: String,
      default: null,
    },
    totalArtworks: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    cv: {
      url: {
        type: String,
        default: null,
      },
      filename: {
        type: String,
        default: null,
      },
      uploadedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for userId
artistProfileSchema.index({ userId: 1 });

const ArtistProfile = mongoose.model('ArtistProfile', artistProfileSchema);

export default ArtistProfile;

