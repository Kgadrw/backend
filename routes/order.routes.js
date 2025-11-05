import express from 'express';
import {
  createOrder,
  getMyOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/me', protect, getMyOrders);
router.put('/:id/status', protect, authorize('ARTIST'), updateOrderStatus);

export default router;

