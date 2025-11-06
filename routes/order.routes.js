import express from 'express';
import {
  createOrder,
  getMyOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order
 *     tags: [Orders]
 *     description: Create a new order for an artwork (Buyers and artists can order other artists' artworks)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artworkId
 *             properties:
 *               artworkId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       403:
 *         description: Cannot order your own artwork
 *       404:
 *         description: Artwork not found
 */
router.post('/', protect, createOrder);

/**
 * @swagger
 * /api/orders/me:
 *   get:
 *     summary: Get my orders
 *     tags: [Orders]
 *     description: Get orders for the authenticated user (as buyer) or their artworks (as artist)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/me', protect, getMyOrders);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     description: Update order status (Artist only, for their artworks)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       403:
 *         description: Not authorized to update this order
 *       404:
 *         description: Order not found
 */
router.put('/:id/status', protect, authorize('ARTIST'), updateOrderStatus);

export default router;

