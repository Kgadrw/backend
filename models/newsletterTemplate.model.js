import mongoose from 'mongoose';

const newsletterTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
      maxlength: [200, 'Subject must not exceed 200 characters'],
    },
    htmlContent: {
      type: String,
      required: [true, 'HTML content is required'],
    },
    plainTextContent: {
      type: String,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [40, 'Tag must not exceed 40 characters'],
      },
    ],
    isDraft: {
      type: Boolean,
      default: true,
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

newsletterTemplateSchema.index({ title: 'text', subject: 'text', tags: 1 });
newsletterTemplateSchema.index({ isDraft: 1 });
newsletterTemplateSchema.index({ createdBy: 1 });

const NewsletterTemplate = mongoose.model('NewsletterTemplate', newsletterTemplateSchema);

export default NewsletterTemplate;


