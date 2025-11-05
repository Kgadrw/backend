import Notification from '../models/notification.model.js';

export const createNotification = async (userId, type, message, data = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      data,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

