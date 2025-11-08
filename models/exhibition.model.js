import mongoose from 'mongoose';

const exhibitionSchema = new mongoose.Schema(
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
      maxlength: [120, 'Title must not exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location must not exceed 200 characters'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    coverImage: {
      type: String,
      default: null,
    },
    galleryImages: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    submissionNotes: {
      type: String,
      default: null,
      maxlength: [1000, 'Submission notes cannot exceed 1000 characters'],
    },
    adminReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      reviewNotes: {
        type: String,
        default: null,
        maxlength: [1000, 'Review notes cannot exceed 1000 characters'],
      },
    },
    promotion: {
      isPromoted: {
        type: Boolean,
        default: false,
      },
      promotedAt: {
        type: Date,
        default: null,
      },
      promotionNotes: {
        type: String,
        default: null,
        maxlength: [1000, 'Promotion notes cannot exceed 1000 characters'],
      },
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

exhibitionSchema.index({ title: 'text', description: 'text', location: 'text' });
exhibitionSchema.index({ artistId: 1 });
exhibitionSchema.index({ status: 1 });
exhibitionSchema.index({ startDate: 1, endDate: 1 });

const Exhibition = mongoose.model('Exhibition', exhibitionSchema);

export default Exhibition;


