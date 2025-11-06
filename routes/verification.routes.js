import express from 'express';
import {
  submitVerificationRequest,
  getVerificationStatus,
} from '../controllers/verification.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Artist routes
router.post('/request', protect, authorize('ARTIST'), submitVerificationRequest);
router.get('/status', protect, authorize('ARTIST'), getVerificationStatus);

export default router;

