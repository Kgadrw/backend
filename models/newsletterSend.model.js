import mongoose from 'mongoose';

const newsletterSendSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NewsletterTemplate',
      required: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    htmlContent: {
      type: String,
      required: true,
    },
    totalRecipients: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failCount: {
      type: Number,
      default: 0,
    },
    failedRecipients: [
      {
        email: String,
        error: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

newsletterSendSchema.index({ templateId: 1 });
newsletterSendSchema.index({ sentBy: 1 });
newsletterSendSchema.index({ createdAt: -1 });

const NewsletterSendLog = mongoose.model('NewsletterSendLog', newsletterSendSchema);

export default NewsletterSendLog;


