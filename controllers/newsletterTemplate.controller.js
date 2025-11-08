import NewsletterTemplate from '../models/newsletterTemplate.model.js';
import NewsletterSendLog from '../models/newsletterSend.model.js';
import Newsletter from '../models/newsletter.model.js';
import { sendCustomEmail } from '../utils/emailService.js';

const sanitizePaginationParams = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit };
};

export const createNewsletterTemplate = async (req, res, next) => {
  try {
    const { title, subject, htmlContent, plainTextContent, tags, isDraft } = req.body;

    const template = await NewsletterTemplate.create({
      title,
      subject,
      htmlContent,
      plainTextContent,
      tags,
      isDraft: isDraft !== undefined ? isDraft : true,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const getNewsletterTemplates = async (req, res, next) => {
  try {
    const { page, limit } = sanitizePaginationParams(req.query);
    const skip = (page - 1) * limit;
    const { search, isDraft } = req.query;

    const query = {};

    if (search) {
      const term = search.trim();
      if (term) {
        const sanitized = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
          { title: { $regex: sanitized, $options: 'i' } },
          { subject: { $regex: sanitized, $options: 'i' } },
          { tags: { $regex: sanitized, $options: 'i' } },
        ];
      }
    }

    if (typeof isDraft === 'string') {
      if (isDraft === 'true') query.isDraft = true;
      if (isDraft === 'false') query.isDraft = false;
    }

    const [templates, total] = await Promise.all([
      NewsletterTemplate.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email'),
      NewsletterTemplate.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        templates,
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

export const getNewsletterTemplate = async (req, res, next) => {
  try {
    const template = await NewsletterTemplate.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    if (req.query.preview === 'true') {
      return res
        .status(200)
        .type('text/html')
        .send(template.htmlContent || '<p>No content</p>');
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const updateNewsletterTemplate = async (req, res, next) => {
  try {
    const { title, subject, htmlContent, plainTextContent, tags, isDraft } = req.body;

    const template = await NewsletterTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    if (title !== undefined) template.title = title;
    if (subject !== undefined) template.subject = subject;
    if (htmlContent !== undefined) template.htmlContent = htmlContent;
    if (plainTextContent !== undefined) template.plainTextContent = plainTextContent;
    if (tags !== undefined) template.tags = tags;
    if (isDraft !== undefined) template.isDraft = isDraft;

    template.updatedBy = req.user._id;

    await template.save();

    await template.populate('createdBy', 'name email');
    await template.populate('updatedBy', 'name email');

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNewsletterTemplate = async (req, res, next) => {
  try {
    const template = await NewsletterTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    await template.deleteOne();

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getNewsletterSendLogs = async (req, res, next) => {
  try {
    const { page, limit } = sanitizePaginationParams(req.query);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      NewsletterSendLog.find()
        .populate('templateId', 'title')
        .populate('sentBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NewsletterSendLog.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        logs,
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

export const sendNewsletterTemplate = async (req, res, next) => {
  try {
    const template = await NewsletterTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    if (template.isDraft) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send a draft template. Please mark it as ready before sending.',
      });
    }

    const subscribers = await Newsletter.find({ isActive: true }).select('email');

    if (!subscribers.length) {
      return res.status(400).json({
        success: false,
        message: 'No active newsletter subscribers found.',
      });
    }

    const subject = template.subject;
    const htmlContent = template.htmlContent;
    const plainTextContent = template.plainTextContent || template.htmlContent.replace(/<[^>]+>/g, ' ');

    const failedRecipients = [];
    let successCount = 0;

    for (const subscriber of subscribers) {
      try {
        await sendCustomEmail({
          to: subscriber.email,
          subject,
          html: htmlContent,
          text: plainTextContent,
        });
        successCount += 1;
      } catch (error) {
        failedRecipients.push({
          email: subscriber.email,
          error: error.message || 'Unknown error',
        });
      }
    }

    const log = await NewsletterSendLog.create({
      templateId: template._id,
      sentBy: req.user._id,
      subject,
      htmlContent,
      totalRecipients: subscribers.length,
      successCount,
      failCount: failedRecipients.length,
      failedRecipients,
    });

    template.lastSentAt = new Date();
    template.sentCount = (template.sentCount || 0) + 1;
    await template.save();

    res.json({
      success: true,
      message: 'Newsletter sent successfully.',
      data: {
        log,
        summary: {
          total: subscribers.length,
          success: successCount,
          failed: failedRecipients.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


