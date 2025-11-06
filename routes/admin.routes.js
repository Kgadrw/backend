import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllArtworks,
  updateArtwork,
  deleteArtwork,
  getAllOrders,
  updateOrder,
  getAllActivities,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} from '../controllers/admin.controller.js';
import {
  getAllVerificationRequests,
  getVerificationRequest,
  approveVerificationRequest,
  rejectVerificationRequest,
} from '../controllers/verification.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// Dashboard stats
router.get('/stats', getAdminStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Artwork management
router.get('/artworks', getAllArtworks);
router.put('/artworks/:id', updateArtwork);
router.delete('/artworks/:id', deleteArtwork);

// Order management
router.get('/orders', getAllOrders);
router.put('/orders/:id', updateOrder);

// Activity logs
router.get('/activities', getAllActivities);

// Verification requests
router.get('/verification-requests', getAllVerificationRequests);
router.get('/verification-requests/:id', getVerificationRequest);
router.put('/verification-requests/:id/approve', approveVerificationRequest);
router.put('/verification-requests/:id/reject', rejectVerificationRequest);

// Admin profile management
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/change-password', changeAdminPassword);

export default router;

